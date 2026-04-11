document.addEventListener('DOMContentLoaded', () => {
  const footerMessage = document.getElementById('footer-message');
  const restartButton = document.getElementById('btn-restart');

  const term = new Terminal({
    cursorBlink: true,
    cursorStyle: 'block',
    fontSize: 13,
    fontFamily: "'Menlo', 'Monaco', 'Cascadia Code', 'Courier New', monospace",
    lineHeight: 1.2,
    theme: {
      background: '#141414',
      foreground: '#D4D0CB',
      cursor: '#FF5A2D',
      cursorAccent: '#141414',
      selectionBackground: 'rgba(255,90,45,0.25)',
      black: '#1A1A1A',
      red: '#E06C75',
      green: '#98C379',
      yellow: '#E5C07B',
      blue: '#61AFEF',
      magenta: '#C678DD',
      cyan: '#56B6C2',
      white: '#ABB2BF',
      brightBlack: '#3D4048',
      brightRed: '#F87171',
      brightGreen: '#34D399',
      brightYellow: '#FBBF24',
      brightBlue: '#7BB8F5',
      brightMagenta: '#D4A4E0',
      brightCyan: '#6EC9D4',
      brightWhite: '#F0EDE8'
    },
    scrollback: 1000,
    rows: 24,
    cols: 80
  });

  const fitAddon = new FitAddon.FitAddon();
  term.loadAddon(fitAddon);
  term.open(document.getElementById('terminal'));
  fitAddon.fit();
  term.focus();

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.btn-restart')) {
      term.focus();
    }
  });

  if (navigator.platform.indexOf('Mac') !== -1) {
    document.getElementById('paste-hint').textContent = '⌘V';
  }

  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  let ws = new WebSocket(proto + '//' + location.host + '/api/terminal');

  function setFooter(message, mode = '') {
    footerMessage.textContent = message;
    footerMessage.className = 'footer-message';
    if (mode) footerMessage.classList.add(mode);
  }

  ws.onopen = () => {
    setFooter('Connected to Hermes Agent terminal.', 'success');
    ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    term.focus();
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type === 'output') {
        term.write(msg.data);
      } else if (msg.type === 'exit') {
        term.write('\r\n\x1b[38;5;242mTerminal session ended. Click "Start over" below to open a fresh Hermes session.\x1b[0m\r\n');
        setFooter('Terminal exited unexpectedly.', 'error');
      }
    } catch (e) {}
  };

  ws.onclose = () => {
    if (!footerMessage.textContent.includes('exited')) {
      setFooter('Connection lost.', 'error');
    }
  };

  ws.onerror = () => {
    setFooter('Connection error.', 'error');
  };

  term.onData((data) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'input', data }));
    }
  });

  const resizeObserver = new ResizeObserver(() => {
    fitAddon.fit();
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'resize', cols: term.cols, rows: term.rows }));
    }
  });
  resizeObserver.observe(document.getElementById('terminal'));

  restartButton.addEventListener('click', () => {
    try {
      ws.close();
    } catch (e) {}
  });
});
