export function connect() {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const url = `${proto}://${location.host}/ws`;
  const listeners = new Set();
  const openListeners = new Set();
  const closeListeners = new Set();

  let ws = null;
  let retryDelay = 1000;
  let reconnectTimer = null;
  let queue = [];
  let isClosedExplicitly = false;

  function initSocket() {
    try {
      ws = new WebSocket(url);
    } catch {
      scheduleReconnect();
      return;
    }

    ws.addEventListener("open", () => {
      retryDelay = 1000;
      for (const fn of openListeners) fn();
      while (queue.length > 0 && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(queue.shift()));
      }
    });

    ws.addEventListener("message", (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        return;
      }
      for (const fn of listeners) fn(msg);
    });

    ws.addEventListener("close", () => {
      for (const fn of closeListeners) fn();
      if (!isClosedExplicitly) scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      ws.close();
    });
  }

  function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      retryDelay = Math.min(8000, Math.round(retryDelay * 1.5));
      initSocket();
    }, retryDelay);
  }

  initSocket();

  return {
    get ws() {
      return ws;
    },
    on(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    onOpen(fn) {
      openListeners.add(fn);
      if (ws?.readyState === WebSocket.OPEN) fn();
      return () => openListeners.delete(fn);
    },
    onClose(fn) {
      closeListeners.add(fn);
      return () => closeListeners.delete(fn);
    },
    send(msg) {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(msg));
      } else {
        queue.push(msg);
      }
    },
    close() {
      isClosedExplicitly = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    },
  };
}
