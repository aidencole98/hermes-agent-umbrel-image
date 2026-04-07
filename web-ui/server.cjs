const fs = require("fs");
const path = require("path");
const http = require("http");
const pty = require("node-pty");
const WebSocket = require("ws");

const PORT = Number.parseInt(process.env.PORT || "8080", 10);
const HOST = process.env.HOST || "0.0.0.0";
const APP_DIR = "/app";
const SITE_DIR = path.join(APP_DIR, "site");
const DATA_DIR = process.env.HERMES_HOME || "/opt/data";
const SHELL = process.env.SHELL || "/bin/bash";
const TERM = "xterm-256color";
const START_COMMAND = process.env.HERMES_WEB_COMMAND || "cd /opt/data && exec hermes";

let activePty = null;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp"
};

function resolveStaticPath(urlPath) {
  const normalized = urlPath === "/" ? "/index.html" : urlPath;
  const filePath = path.normalize(path.join(SITE_DIR, normalized));
  if (!filePath.startsWith(SITE_DIR)) {
    return null;
  }
  return filePath;
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8"
      });
      res.end(error.code === "ENOENT" ? "Not found" : "Internal server error");
      return;
    }

    res.writeHead(200, {
      "Cache-Control": filePath.includes("/assets/") ? "public, max-age=86400" : "no-cache",
      "Content-Type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream"
    });
    res.end(data);
  });
}

function spawnShell() {
  if (activePty) {
    try {
      activePty.kill();
    } catch (error) {
      console.error("Failed to stop previous PTY:", error);
    }
  }

  activePty = pty.spawn(SHELL, ["--login", "-i", "-c", START_COMMAND], {
    name: TERM,
    cols: 120,
    rows: 32,
    cwd: DATA_DIR,
    env: {
      ...process.env,
      HOME: process.env.HOME || "/home/hermes",
      HERMES_HOME: DATA_DIR,
      PWD: DATA_DIR,
      SHELL,
      TERM
    }
  });

  return activePty;
}

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (pathname.startsWith("/vendor/")) {
    const vendorMap = {
      "/vendor/xterm.css": path.join(APP_DIR, "node_modules", "@xterm", "xterm", "css", "xterm.css"),
      "/vendor/xterm.js": path.join(APP_DIR, "node_modules", "@xterm", "xterm", "lib", "xterm.js"),
      "/vendor/xterm-addon-fit.js": path.join(APP_DIR, "node_modules", "@xterm", "addon-fit", "lib", "addon-fit.js")
    };
    const filePath = vendorMap[pathname];
    if (!filePath) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    sendFile(res, filePath);
    return;
  }

  const filePath = resolveStaticPath(pathname);
  if (!filePath) {
    res.writeHead(400, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Bad request");
    return;
  }

  sendFile(res, filePath);
});

const wss = new WebSocket.Server({ noServer: true });

wss.on("connection", (socket) => {
  console.log("Terminal client connected");
  const shell = spawnShell();

  shell.onData((data) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "output", data }));
    }
  });

  shell.onExit(({ exitCode, signal }) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "exit", exitCode, signal }));
    }
    activePty = null;
  });

  socket.on("message", (message) => {
    let payload;
    try {
      payload = JSON.parse(message.toString());
    } catch (error) {
      console.error("Invalid websocket payload:", error);
      return;
    }

    if (!activePty) {
      return;
    }

    if (payload.type === "input" && typeof payload.data === "string") {
      activePty.write(payload.data);
      return;
    }

    if (payload.type === "resize") {
      const cols = Number.parseInt(payload.cols, 10);
      const rows = Number.parseInt(payload.rows, 10);
      if (Number.isInteger(cols) && Number.isInteger(rows) && cols > 0 && rows > 0) {
        activePty.resize(cols, rows);
      }
    }
  });

  socket.on("close", () => {
    console.log("Terminal client disconnected");
    if (activePty) {
      try {
        activePty.kill();
      } catch (error) {
        console.error("Failed to stop PTY:", error);
      }
      activePty = null;
    }
  });
});

server.on("upgrade", (req, socket, head) => {
  const { pathname } = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  if (pathname !== "/api/terminal") {
    socket.destroy();
    return;
  }

  wss.handleUpgrade(req, socket, head, (client) => {
    wss.emit("connection", client, req);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Hermes web UI listening on http://${HOST}:${PORT}`);
});

function shutdown() {
  if (activePty) {
    try {
      activePty.kill();
    } catch (error) {
      console.error("Failed to stop PTY during shutdown:", error);
    }
  }
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
