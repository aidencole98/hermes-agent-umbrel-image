(function () {
  const terminalElement = document.getElementById("terminal");
  const statusElement = document.getElementById("status");
  const restartButton = document.getElementById("restart");
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socketUrl = `${protocol}//${window.location.host}/api/terminal`;

  const terminal = new window.Terminal({
    cursorBlink: true,
    convertEol: true,
    fontFamily: '"SFMono-Regular", Menlo, Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.35,
    theme: {
      background: "#141414",
      foreground: "#F2EDE3",
      cursor: "#F3B23A",
      selectionBackground: "rgba(243, 178, 58, 0.22)",
      black: "#141414",
      red: "#FF6B6B",
      green: "#34D399",
      yellow: "#F3B23A",
      blue: "#7DD3FC",
      magenta: "#F9A8D4",
      cyan: "#67E8F9",
      white: "#F2EDE3",
      brightBlack: "#6F665E",
      brightRed: "#F87171",
      brightGreen: "#6EE7B7",
      brightYellow: "#FCD34D",
      brightBlue: "#BAE6FD",
      brightMagenta: "#FBCFE8",
      brightCyan: "#A5F3FC",
      brightWhite: "#FFF7ED"
    }
  });
  const fitAddon = new window.FitAddon.FitAddon();

  let socket;

  terminal.loadAddon(fitAddon);
  terminal.open(terminalElement);

  function setStatus(message, tone) {
    statusElement.textContent = message;
    statusElement.className = "footer-message";
    if (tone) {
      statusElement.classList.add(tone);
    }
  }

  function sendResize() {
    if (!socket || socket.readyState !== window.WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify({
      type: "resize",
      cols: terminal.cols,
      rows: terminal.rows
    }));
  }

  function fitTerminal() {
    fitAddon.fit();
    sendResize();
  }

  function connect() {
    if (socket && (socket.readyState === window.WebSocket.OPEN || socket.readyState === window.WebSocket.CONNECTING)) {
      return;
    }

    terminal.reset();
    setStatus("Connecting to Hermes terminal...");
    socket = new window.WebSocket(socketUrl);

    socket.addEventListener("open", function () {
      setStatus("Connected to Hermes terminal", "success");
      fitTerminal();
      terminal.focus();
    });

    socket.addEventListener("message", function (event) {
      const payload = JSON.parse(event.data);
      if (payload.type === "output") {
        terminal.write(payload.data);
        return;
      }

      if (payload.type === "exit") {
        setStatus(`Shell exited (${payload.exitCode ?? "?"}). Restart to open a new session.`, "error");
      }
    });

    socket.addEventListener("close", function () {
      if (!statusElement.classList.contains("error")) {
        setStatus("Disconnected from Hermes terminal", "error");
      }
    });

    socket.addEventListener("error", function () {
      setStatus("Terminal connection failed", "error");
    });
  }

  terminal.onData(function (data) {
    if (!socket || socket.readyState !== window.WebSocket.OPEN) {
      return;
    }
    socket.send(JSON.stringify({ type: "input", data }));
  });

  window.addEventListener("resize", fitTerminal);

  restartButton.addEventListener("click", function () {
    if (socket) {
      socket.close();
    }
    connect();
  });

  window.setTimeout(fitTerminal, 0);
  connect();
}());
