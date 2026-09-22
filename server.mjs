import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";
import QRCode from "qrcode";
import selfsigned from "selfsigned";
import { WebSocketServer } from "ws";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, "public");
const CERT_DIR = path.join(__dirname, ".certs");
const HTTP_PORT = Number(process.env.PORT || 4242);
const HTTPS_PORT = Number(process.env.HTTPS_PORT || 4243);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json; charset=utf-8",
  ".webm": "video/webm",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

function lanIPs() {
  const ips = [];
  const fallbackIps = [];
  const virtualRegex = /(docker|veth|br-|wsl|vethernet|virtualbox|vmware|tailscale|zerotier)/i;

  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    const isVirtual = virtualRegex.test(name);
    for (const net of addrs || []) {
      const family = net.family === 4 || net.family === "IPv4";
      if (!family || net.internal) continue;
      if (net.address.startsWith("169.254.")) continue;
      if (isVirtual) {
        fallbackIps.push(net.address);
      } else {
        ips.push(net.address);
      }
    }
  }
  return ips.length > 0 ? ips : fallbackIps;
}

function sessionInfo() {
  const ips = lanIPs();
  const lan = ips[0] || "127.0.0.1";
  return {
    https: true,
    port: HTTP_PORT,
    httpsPort: HTTPS_PORT,
    local: `http://localhost:${HTTP_PORT}`,
    lan: `http://${lan}:${HTTP_PORT}`,
    ips: ips.map((ip) => `http://${ip}:${HTTP_PORT}`),
    remote: `https://${lan}:${HTTPS_PORT}/remote?cam=1`,
  };
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    "permissions-policy": "camera=(self), microphone=(self)",
    ...headers,
  });
  res.end(body);
}

async function handleApi(req, res, url) {
  if (url.pathname === "/api/session") {
    send(res, 200, JSON.stringify(sessionInfo()), {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    });
    return true;
  }
  if (url.pathname === "/api/qr.svg") {
    const info = sessionInfo();
    const target = url.searchParams.get("url") || info.remote;
    const svg = await QRCode.toString(target, {
      type: "svg",
      margin: 1,
      width: 240,
      color: { dark: "#111114", light: "#f4f4f1" },
    });
    send(res, 200, svg, {
      "content-type": "image/svg+xml",
      "cache-control": "no-store",
    });
    return true;
  }
  return false;
}

function serveStatic(req, res, url) {
  let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
  if (filePath === "/remote") filePath = "/remote.html";
  const safe = path.normalize(filePath).replace(/^(\.\.[/\\])+/, "");
  const full = path.join(PUBLIC, safe);
  if (!full.startsWith(PUBLIC)) {
    send(res, 403, "forbidden");
    return;
  }
  fs.readFile(full, (err, data) => {
    if (err) {
      send(res, 404, "not found");
      return;
    }
    const ext = path.extname(full);
    send(res, 200, data, {
      "content-type": MIME[ext] || "application/octet-stream",
      "cache-control": "no-cache",
    });
  });
}

function loadCerts() {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  const keyPath = path.join(CERT_DIR, "key.pem");
  const certPath = path.join(CERT_DIR, "cert.pem");
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
  }
  const attrs = [{ name: "commonName", value: "flare.local" }];
  const alts = [
    { type: 2, value: "localhost" },
    { type: 7, ip: "127.0.0.1" },
    ...lanIPs().map((ip) => ({ type: 7, ip })),
  ];
  const pems = selfsigned.generate(attrs, {
    days: 365,
    keySize: 2048,
    algorithm: "sha256",
    extensions: [{ name: "subjectAltName", altNames: alts }],
  });
  fs.writeFileSync(keyPath, pems.private);
  fs.writeFileSync(certPath, pems.cert);
  return { key: pems.private, cert: pems.cert };
}

const requestListener = async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (await handleApi(req, res, url)) return;
    serveStatic(req, res, url);
  } catch (err) {
    send(res, 500, String(err));
  }
};

const httpServer = http.createServer(requestListener);
const httpsServer = https.createServer(loadCerts(), requestListener);
const wss = new WebSocketServer({ noServer: true });
const sockets = new Set();
let state = {
  look: "teknoStrobe",
  intensity: 0.72,
  source: "none",
  bassReact: 0.7,
  bassFlash: true,
  bassShake: true,
  bassZoom: false,
  bassRgb: false,
  rotate: false,
  rotateSec: 30,
  randomMode: "free_tekno",
  hueShift: 0,
  bpm: 124,
  camMode: "auto",
  camMix: 0.5,
  motionMask: 0.0,
  auto: false,
  dimension: "all",
  autoScope: "all",
};

function onUpgrade(req, socket, head) {
  const pathname = new URL(req.url || "/", "http://flare.local").pathname;
  if (pathname !== "/ws") {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => wss.emit("connection", ws, req));
}

httpServer.on("upgrade", onUpgrade);
httpsServer.on("upgrade", onUpgrade);

function broadcast(msg, except) {
  const data = JSON.stringify(msg);
  for (const ws of sockets) {
    if (ws !== except && ws.readyState === 1) ws.send(data);
  }
}

wss.on("connection", (ws) => {
  ws.id = "peer_" + Math.random().toString(36).slice(2, 9);
  sockets.add(ws);
  ws.send(JSON.stringify({ type: "init", id: ws.id, ...state }));
  ws.send(JSON.stringify({ type: "peers", count: sockets.size }));
  broadcast({ type: "peers", count: sockets.size }, ws);

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!msg.from) msg.from = ws.id;

    // Targeted routing (WebRTC signaling between stage and a specific phone)
    if (msg.to) {
      for (const s of sockets) {
        if (s.id === msg.to && s.readyState === 1) {
          s.send(JSON.stringify(msg));
          return;
        }
      }
      return;
    }

    if (msg.type === "setLook" && typeof msg.id === "string") {
      state.look = msg.id;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setIntensity" && Number.isFinite(msg.value)) {
      state.intensity = Math.min(1, Math.max(0, msg.value));
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setHue" && Number.isFinite(msg.value)) {
      state.hueShift = Math.min(1, Math.max(0, msg.value));
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setBpm" && Number.isFinite(msg.value)) {
      state.bpm = Math.min(240, Math.max(40, Math.round(msg.value)));
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setRandomMode" && typeof msg.id === "string") {
      state.randomMode = msg.id;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setCamMode" && typeof msg.mode === "string") {
      state.camMode = msg.mode;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setCamMix" && Number.isFinite(msg.value)) {
      state.camMix = Math.min(1, Math.max(0, msg.value));
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setMotionMask" && Number.isFinite(msg.value)) {
      state.motionMask = Math.min(1, Math.max(0, msg.value));
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setAuto" && typeof msg.enabled === "boolean") {
      state.auto = msg.enabled;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setDimension" && typeof msg.dimension === "string") {
      state.dimension = msg.dimension;
      state.autoScope = msg.dimension;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setAutoScope" && typeof msg.scope === "string") {
      state.autoScope = msg.scope;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setSource" && typeof msg.source === "string") {
      state.source = msg.source;
      broadcast({ type: "state", ...state });
      return;
    }
    if (msg.type === "setMods") {
      if (Number.isFinite(msg.bassReact)) state.bassReact = Math.min(1, Math.max(0, msg.bassReact));
      if (typeof msg.bassFlash === "boolean") state.bassFlash = msg.bassFlash;
      if (typeof msg.bassShake === "boolean") state.bassShake = msg.bassShake;
      if (typeof msg.bassZoom === "boolean") state.bassZoom = msg.bassZoom;
      if (typeof msg.bassRgb === "boolean") state.bassRgb = msg.bassRgb;
      if (typeof msg.rotate === "boolean") state.rotate = msg.rotate;
      if (Number.isFinite(msg.rotateSec)) state.rotateSec = msg.rotateSec;
      if (typeof msg.randomMode === "string") state.randomMode = msg.randomMode;
      if (Number.isFinite(msg.hueShift)) state.hueShift = Math.min(1, Math.max(0, msg.hueShift));
      if (Number.isFinite(msg.bpm)) state.bpm = Math.min(240, Math.max(40, Math.round(msg.bpm)));
      if (typeof msg.camMode === "string") state.camMode = msg.camMode;
      if (Number.isFinite(msg.camMix)) state.camMix = Math.min(1, Math.max(0, msg.camMix));
      if (Number.isFinite(msg.motionMask)) state.motionMask = Math.min(1, Math.max(0, msg.motionMask));
      if (typeof msg.auto === "boolean") state.auto = msg.auto;
      if (typeof msg.dimension === "string") state.dimension = msg.dimension;
      if (typeof msg.autoScope === "string") state.autoScope = msg.autoScope;
      broadcast({ type: "state", ...state });
      return;
    }
    broadcast(msg, ws);
  });

  ws.on("close", () => {
    sockets.delete(ws);
    broadcast({ type: "peerDisconnect", id: ws.id });
    broadcast({ type: "peers", count: sockets.size });
  });
});

httpServer.listen(HTTP_PORT, "0.0.0.0", () => {
  httpsServer.listen(HTTPS_PORT, "0.0.0.0", () => {
    const info = sessionInfo();
    console.log("");
    console.log("  FLARE  ·  câmara obrigatória");
    console.log("");
    console.log(`  Palco PC     ${info.local}`);
    console.log(`  Telemóvel    ${info.remote}`);
    console.log("");
    console.log("  PC: Chrome/Edge em localhost — Permite a câmara quando o browser pedir.");
    console.log("  Telemóvel: lê o QR, Avançado → continuar (certificado local), Liga a câmara.");
    console.log("");
    if (process.platform === "win32" && !process.argv.includes("--no-open")) {
      exec(`cmd /c start "" "${info.local}"`);
    }
  });
});
