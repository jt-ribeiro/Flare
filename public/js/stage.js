import { AudioPulse } from "./audio.js";
import { bindVideo, cameraContext, cameraErrorText, openCamera } from "./camera.js";
import { CATEGORIES, LOOKS, RANDOM_MODES, lookById, randomModeById } from "./looks.js";
import { connect } from "./net.js";
import { Renderer } from "./renderer.js";
import { DEFAULTS } from "./settings.js";

const canvas = document.querySelector("#stage");
const hud = document.querySelector("#hud");
const looksEl = document.querySelector("#looks");
const catBar = document.querySelector("#catBar");
const vibeBadge = document.querySelector("#vibeBadge");
const randomModeSelect = document.querySelector("#randomModeSelect");
const intensityEl = document.querySelector("#intensity");
const hueShiftEl = document.querySelector("#hueShift");
const btnTap = document.querySelector("#btnTap");
const bpmVal = document.querySelector("#bpmVal");
const lookNameEl = document.querySelector("#lookName");
const cameraSelect = document.querySelector("#cameraSelect");
const qrImg = document.querySelector("#qr");
const remoteLink = document.querySelector("#remoteLink");
const toastEl = document.querySelector("#toast");
const liveDot = document.querySelector("#liveDot");
const gateError = document.querySelector("#gateError");
const gateQr = document.querySelector("#gateQr");
const gateRemoteLink = document.querySelector("#gateRemoteLink");
const rawPreview = document.querySelector("#rawPreview");
const bassAmountEl = document.querySelector("#bassAmount");
const bassMeter = document.querySelector("#bassMeter");
const btnRotate = document.querySelector("#btnRotate");
const rotateMinsEl = document.querySelector("#rotateMins");
const rotateEtaEl = document.querySelector("#rotateEta");

const camBadges = document.querySelector("#camBadges");
const badgeCamA = document.querySelector("#badgeCamA");
const camModeChips = document.querySelector("#camModeChips");
const camFader = document.querySelector("#camFader");
const camFaderVal = document.querySelector("#camFaderVal");
const motionMaskSlider = document.querySelector("#motionMaskSlider");
const btnMotionMaskToggle = document.querySelector("#btnMotionMaskToggle");
const btnAuto = document.querySelector("#btnAuto");
const btnExitAuto = document.querySelector("#btnExitAuto");
const btnToggleDock = document.querySelector("#btnToggleDock");
const dock = document.querySelector("#dock");
const phoneListChips = document.querySelector("#phoneListChips");

const renderer = new Renderer(canvas);
const audio = new AudioPulse();
const net = connect();

const videoA = document.createElement("video");
videoA.playsInline = true;
videoA.muted = true;
videoA.autoplay = true;
videoA.setAttribute("playsinline", "");

// Multi-phone remote cameras map: peerId -> { pc, videoEl, stream, label, iceQueue }
const remoteCams = new Map();
let activePhoneId = null;

let autoMode = false;
let autoLookTimer = 0;
let autoCamTimer = 0;
let autoPhoneTimer = 0;
let autoHuePhase = 0;

let look = DEFAULTS.look;
let intensity = DEFAULTS.intensity;
let hueShift = DEFAULTS.hueShift ?? 0;
let randomMode = DEFAULTS.randomMode || "free_tekno";
let camMode = DEFAULTS.camMode || "auto";
let camMix = DEFAULTS.camMix ?? 0.5;
let motionMask = DEFAULTS.motionMask ?? 0.0;
let currentCategory = "all";
let source = "none";
let camStreamA = null;
let recorder = null;
let hudLocked = false;
let hideTimer = 0;
let applyingRemote = false;
let bassReact = DEFAULTS.bassReact;
let bassFlash = DEFAULTS.bassFlash;
let bassShake = DEFAULTS.bassShake;
let bassZoom = DEFAULTS.bassZoom;
let bassRgb = DEFAULTS.bassRgb;
let rotateOn = DEFAULTS.rotate;
let rotateSec = DEFAULTS.rotateSec;
let rotateAt = 0;
let wakeLock = null;

async function requestWakeLock() {
  if ("wakeLock" in navigator) {
    try {
      wakeLock = await navigator.wakeLock.request("screen");
    } catch {}
  }
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") requestWakeLock();
});

function toast(text) {
  toastEl.hidden = false;
  toastEl.textContent = text;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => {
    toastEl.hidden = true;
  }, 2400);
}

function showGateError(err) {
  const { title, body } = cameraErrorText(err);
  gateError.hidden = false;
  gateError.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = body;
  gateError.append(strong, span);
}

function setLive(on) {
  document.body.classList.toggle("waiting-cam", !on);
  hud.hidden = !on;
  liveDot.classList.toggle("off", !on);
  if (on) requestWakeLock();
}

function getActivePhoneVideo() {
  if (remoteCams.size === 0) return null;
  if (activePhoneId && remoteCams.has(activePhoneId)) {
    return remoteCams.get(activePhoneId).videoEl;
  }
  const first = remoteCams.values().next().value;
  return first?.videoEl || null;
}

function updateCamUi() {
  if (badgeCamA) badgeCamA.classList.toggle("live", Boolean(camStreamA));

  if (camBadges) {
    for (const el of camBadges.querySelectorAll(".phone-badge")) el.remove();
    let i = 1;
    for (const [peerId, peer] of remoteCams) {
      const badge = document.createElement("span");
      badge.className = "cam-badge live phone-badge";
      badge.dataset.peer = peerId;
      badge.innerHTML = `B${remoteCams.size > 1 ? i : ""}: TEL ${i} <i class="indicator"></i>`;
      camBadges.append(badge);
      i++;
    }
  }

  if (phoneListChips) {
    phoneListChips.innerHTML = "";
    if (remoteCams.size === 0) {
      phoneListChips.innerHTML = `<span class="no-phones-hint">Lê o QR com o telemóvel para ligar câmaras em direto</span>`;
    } else {
      let i = 1;
      for (const [peerId, peer] of remoteCams) {
        const btn = document.createElement("button");
        btn.type = "button";
        const isActive = (!activePhoneId && i === 1) || activePhoneId === peerId;
        btn.className = `chip ${isActive ? "active" : ""}`;
        btn.textContent = `TEL ${i} (${peerId.slice(5, 9)})`;
        btn.addEventListener("click", () => {
          activePhoneId = peerId;
          updateCamUi();
          toast(`Câmara B mudada para TEL ${i}`);
        });
        phoneListChips.append(btn);
        i++;
      }
    }
  }

  const isLive = Boolean(camStreamA || remoteCams.size > 0);
  setLive(isLive);
  source = camStreamA && remoteCams.size > 0 ? "dual" : (camStreamA ? "camera" : (remoteCams.size > 0 ? "phone" : "none"));
  document.querySelector("#btnCam")?.classList.toggle("active", Boolean(camStreamA));
}

function setCamMode(mode, broadcast = true) {
  camMode = mode;
  renderer.setParams({ camMode });
  if (camModeChips) {
    for (const chip of camModeChips.querySelectorAll(".chip")) {
      chip.classList.toggle("active", chip.dataset.cam === camMode);
    }
  }
  if (broadcast) net.send({ type: "setCamMode", mode: camMode });
}

function setCamMix(val, broadcast = true) {
  camMix = Math.min(1, Math.max(0, val));
  renderer.setParams({ camMix });
  if (camFader) camFader.value = String(Math.round(camMix * 100));
  if (camFaderVal) {
    const aPct = Math.round((1 - camMix) * 100);
    const bPct = Math.round(camMix * 100);
    camFaderVal.textContent = `${aPct}/${bPct}`;
  }
  if (broadcast) net.send({ type: "setCamMix", value: camMix });
}

function setMotionMask(val, broadcast = true) {
  motionMask = Math.min(1, Math.max(0, val));
  renderer.setParams({ motionMask });
  if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));
  if (btnMotionMaskToggle) {
    btnMotionMaskToggle.classList.toggle("active", motionMask > 0.05);
  }
  if (broadcast) net.send({ type: "setMotionMask", value: motionMask });
}

function modsPayload() {
  return {
    type: "setMods",
    bassReact,
    bassFlash,
    bassShake,
    bassZoom,
    bassRgb,
    rotate: rotateOn,
    rotateSec,
    randomMode,
    hueShift,
    bpm: audio.bpm,
    camMode,
    camMix,
    motionMask,
  };
}

function bassWanted() {
  return bassReact > 0.02 && (bassFlash || bassShake || bassZoom || bassRgb);
}

async function ensureMic() {
  if (!bassWanted()) return;
  try {
    await audio.start();
    document.querySelector("#btnMic").classList.add("active");
  } catch {
    toast("Sem microfone — a reação ao baixo precisa de som da sala");
  }
}

function setLook(id, broadcast = true, fromRotate = false, duration = 10000) {
  look = lookById(id).id;
  renderer.setLook(look, true, duration);
  lookNameEl.textContent = lookById(look).name;
  for (const btn of looksEl.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.id === look);
  }
  if (rotateOn && !fromRotate) armRotate();
  if (broadcast) net.send({ type: "setLook", id: look });
}

function setRandomMode(id, broadcast = true) {
  randomMode = randomModeById(id).id;
  if (randomModeSelect) randomModeSelect.value = randomMode;
  if (vibeBadge) vibeBadge.textContent = randomModeById(randomMode).badge;
  if (rotateOn) armRotate();
  if (broadcast) net.send({ type: "setRandomMode", id: randomMode });
}

function setIntensity(value, broadcast = true) {
  intensity = Math.min(1, Math.max(0, value));
  if (!applyingRemote && intensityEl) intensityEl.value = String(Math.round(intensity * 100));
  if (broadcast) net.send({ type: "setIntensity", value: intensity });
}

function setHueShift(value, broadcast = true) {
  hueShift = Math.min(1, Math.max(0, value));
  if (!applyingRemote && hueShiftEl) hueShiftEl.value = String(Math.round(hueShift * 100));
  if (broadcast) net.send({ type: "setHue", value: hueShift });
}

function setBpm(value, broadcast = true) {
  audio.setBpm(value);
  if (bpmVal) bpmVal.textContent = String(audio.bpm);
  if (broadcast) net.send({ type: "setBpm", value: audio.bpm });
}

function handleTap(broadcast = true) {
  const currentBpm = audio.tap();
  if (bpmVal) bpmVal.textContent = String(currentBpm);
  btnTap?.classList.add("pulse");
  setTimeout(() => btnTap?.classList.remove("pulse"), 140);
  if (broadcast) net.send({ type: "tap", bpm: currentBpm });
}

function setSource(next, broadcast = true) {
  source = next;
  const live = next === "camera" || next === "phone" || next === "dual";
  setLive(live);
  document.querySelector("#btnCam").classList.toggle("active", next === "camera" || next === "dual");
  if (live) {
    ensureMic();
    if (rotateOn) armRotate();
  }
  if (broadcast) net.send({ type: "setSource", source });
}

function syncModUi() {
  bassAmountEl.value = String(Math.round(bassReact * 100));
  if (hueShiftEl) hueShiftEl.value = String(Math.round(hueShift * 100));
  if (bpmVal) bpmVal.textContent = String(audio.bpm);
  if (randomModeSelect) randomModeSelect.value = randomMode;
  if (vibeBadge) vibeBadge.textContent = randomModeById(randomMode).badge;
  for (const btn of document.querySelectorAll("#bassChips .chip")) {
    const key = btn.dataset.bass;
    const on = { bassFlash, bassShake, bassZoom, bassRgb }[key];
    btn.classList.toggle("active", Boolean(on));
  }
  btnRotate.classList.toggle("active", rotateOn);
  rotateMinsEl.value = String(rotateSec);
  rotateEtaEl.hidden = !rotateOn;

  if (camModeChips) {
    for (const chip of camModeChips.querySelectorAll(".chip")) {
      chip.classList.toggle("active", chip.dataset.cam === camMode);
    }
  }
  if (camFader) camFader.value = String(Math.round(camMix * 100));
  if (camFaderVal) {
    const aPct = Math.round((1 - camMix) * 100);
    const bPct = Math.round(camMix * 100);
    camFaderVal.textContent = `${aPct}/${bPct}`;
  }
  if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));
  if (btnMotionMaskToggle) {
    btnMotionMaskToggle.classList.toggle("active", motionMask > 0.05);
  }
}

function applyMods(msg, broadcast = false) {
  const rotateChanged = typeof msg.rotate === "boolean" || Number.isFinite(msg.rotateSec);
  if (Number.isFinite(msg.bassReact)) bassReact = Math.min(1, Math.max(0, msg.bassReact));
  if (typeof msg.bassFlash === "boolean") bassFlash = msg.bassFlash;
  if (typeof msg.bassShake === "boolean") bassShake = msg.bassShake;
  if (typeof msg.bassZoom === "boolean") bassZoom = msg.bassZoom;
  if (typeof msg.bassRgb === "boolean") bassRgb = msg.bassRgb;
  if (typeof msg.rotate === "boolean") rotateOn = msg.rotate;
  if (Number.isFinite(msg.rotateSec)) rotateSec = msg.rotateSec;
  if (typeof msg.randomMode === "string") randomMode = msg.randomMode;
  if (Number.isFinite(msg.hueShift)) hueShift = Math.min(1, Math.max(0, msg.hueShift));
  if (Number.isFinite(msg.bpm)) audio.setBpm(msg.bpm);
  if (typeof msg.camMode === "string") camMode = msg.camMode;
  if (Number.isFinite(msg.camMix)) camMix = Math.min(1, Math.max(0, msg.camMix));
  if (Number.isFinite(msg.motionMask)) motionMask = Math.min(1, Math.max(0, msg.motionMask));
  renderer.setParams({ camMode, camMix, motionMask });
  if (!applyingRemote) syncModUi();
  if (rotateChanged && rotateOn) armRotate();
  if (!rotateOn) rotateEtaEl.hidden = true;
  if (bassWanted()) ensureMic();
  if (broadcast) net.send(modsPayload());
}

function armRotate() {
  rotateAt = performance.now() + rotateSec * 1000;
}

function formatEta(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}:${String(r).padStart(2, "0")}` : `${r}s`;
}

function getModePool(mode) {
  if (!mode) return LOOKS;
  if (mode.type === "random") {
    if (!mode.category || mode.category === "all") return LOOKS;
    return LOOKS.filter((l) => l.category === mode.category);
  }
  if (Array.isArray(mode.looks) && mode.looks.length > 0) {
    return mode.looks.map((id) => lookById(id)).filter(Boolean);
  }
  return LOOKS;
}

function tickRotate(now) {
  if (!rotateOn || source === "none") {
    rotateEtaEl.hidden = true;
    return;
  }
  rotateEtaEl.hidden = false;
  rotateEtaEl.textContent = `rodízio ${formatEta(rotateAt - now)}`;
  if (now >= rotateAt) {
    const mode = randomModeById(randomMode);
    const pool = getModePool(mode);
    const candidates = pool.filter((item) => item.id !== look);
    const nextLook = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : pool[0];

    if (nextLook) {
      setLook(nextLook.id, true, true, 10000);
      armRotate();
      toast(`${mode.badge} → ${nextLook.name} (transição 10s)`);
    }
  }
}

function fillCategories() {
  if (!catBar) return;
  catBar.innerHTML = "";
  for (const cat of CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `cat-chip ${cat.id === currentCategory ? "active" : ""}`;
    btn.textContent = cat.name;
    btn.addEventListener("click", () => {
      currentCategory = cat.id;
      for (const b of catBar.querySelectorAll("button")) {
        b.classList.toggle("active", b === btn);
      }
      fillLooks();
    });
    catBar.append(btn);
  }
}

function fillRandomModes() {
  if (!randomModeSelect) return;
  randomModeSelect.innerHTML = "";
  for (const m of RANDOM_MODES) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = `${m.badge} · ${m.name}`;
    randomModeSelect.append(opt);
  }
  randomModeSelect.value = randomMode;
  if (vibeBadge) vibeBadge.textContent = randomModeById(randomMode).badge;
  randomModeSelect.addEventListener("change", () => {
    setRandomMode(randomModeSelect.value, true);
  });
}

function fillLooks() {
  looksEl.innerHTML = "";
  const list = currentCategory === "all" ? LOOKS : LOOKS.filter((l) => l.category === currentCategory);
  for (const item of list) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.id = item.id;
    btn.classList.toggle("active", item.id === look);
    btn.innerHTML = `${item.name}<small>${item.hint}</small>`;
    btn.addEventListener("click", () => setLook(item.id));
    looksEl.append(btn);
  }
}

async function loadSession() {
  const session = await fetch("/api/session").then((r) => r.json());
  remoteLink.textContent = session.remote;
  remoteLink.href = session.remote;
  gateRemoteLink.textContent = session.remote;
  gateRemoteLink.href = session.remote;
  const qrUrl = `/api/qr.svg?url=${encodeURIComponent(session.remote)}`;
  qrImg.src = qrUrl;
  gateQr.src = qrUrl;
  if (!cameraContext().secure) {
    showGateError({ name: "SecurityError" });
  }
}

async function listCameras() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  const cams = devices.filter((d) => d.kind === "videoinput");
  cameraSelect.innerHTML = "";
  for (const cam of cams) {
    const opt = document.createElement("option");
    opt.value = cam.deviceId;
    opt.textContent = cam.label || "Câmara";
    cameraSelect.append(opt);
  }
  cameraSelect.hidden = cams.length < 2;
}

function attachStreamA(stream) {
  camStreamA = stream;
  bindVideo(videoA, stream).catch(() => {});
  rawPreview.srcObject = stream;
  rawPreview.play().catch(() => {});
  updateCamUi();
  requestWakeLock();
  ensureMic();
  if (rotateOn) armRotate();
}

async function startCamera(deviceId) {
  gateError.hidden = true;
  const stream = await openCamera({ deviceId: deviceId || undefined });
  camStreamA?.getTracks().forEach((t) => t.stop());
  attachStreamA(stream);
  await listCameras();
  toast("Câmara A (PC) ligada");
}

function getOrCreatePeer(peerId) {
  if (remoteCams.has(peerId)) {
    const existing = remoteCams.get(peerId);
    try { existing.pc?.close(); } catch {}
    try { existing.stream?.getTracks().forEach((t) => t.stop()); } catch {}
    remoteCams.delete(peerId);
  }

  const peerPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  const peerVideo = document.createElement("video");
  peerVideo.playsInline = true;
  peerVideo.muted = true;
  peerVideo.autoplay = true;
  peerVideo.setAttribute("playsinline", "");

  const peerData = {
    pc: peerPc,
    videoEl: peerVideo,
    stream: null,
    label: `TEL ${remoteCams.size + 1}`,
    iceQueue: [],
  };
  remoteCams.set(peerId, peerData);

  peerPc.onicecandidate = (ev) => {
    if (ev.candidate) {
      net.send({ type: "ice", to: peerId, from: "stage", candidate: ev.candidate });
    }
  };

  peerPc.ontrack = (ev) => {
    const stream = ev.streams[0] || new MediaStream([ev.track]);
    peerData.stream = stream;
    bindVideo(peerVideo, stream).catch(() => {});
    if (!activePhoneId) activePhoneId = peerId;
    updateCamUi();
    ensureMic();
    requestWakeLock();
    toast(`Câmara do Telemóvel (${peerData.label}) ligada!`);
  };

  peerPc.onconnectionstatechange = () => {
    if (["failed", "disconnected", "closed"].includes(peerPc.connectionState)) {
      remoteCams.delete(peerId);
      if (activePhoneId === peerId) {
        activePhoneId = remoteCams.keys().next().value || null;
      }
      updateCamUi();
    }
  };

  return peerData;
}

async function onSignal(msg) {
  if (msg.type === "offer" && msg.sdp && msg.from) {
    const peer = getOrCreatePeer(msg.from);
    await peer.pc.setRemoteDescription(msg.sdp);
    const answer = await peer.pc.createAnswer();
    await peer.pc.setLocalDescription(answer);
    net.send({ type: "answer", to: msg.from, from: "stage", sdp: peer.pc.localDescription });
    while (peer.iceQueue.length > 0) {
      const cand = peer.iceQueue.shift();
      try {
        await peer.pc.addIceCandidate(cand);
      } catch {}
    }
  }
  if (msg.type === "ice" && msg.from && msg.candidate) {
    const peer = remoteCams.get(msg.from);
    if (peer && peer.pc && peer.pc.remoteDescription && peer.pc.remoteDescription.type) {
      try {
        await peer.pc.addIceCandidate(msg.candidate);
      } catch {}
    } else if (peer) {
      peer.iceQueue.push(msg.candidate);
    }
  }
  if (msg.type === "stopCam" && msg.from) {
    const peer = remoteCams.get(msg.from);
    if (peer) {
      peer.stream?.getTracks().forEach((t) => t.stop());
      peer.pc?.close();
      remoteCams.delete(msg.from);
      if (activePhoneId === msg.from) {
        activePhoneId = remoteCams.keys().next().value || null;
      }
      updateCamUi();
      toast("Câmara do telemóvel desligada");
    }
  }
  if (msg.type === "peerDisconnect" && msg.id) {
    const peer = remoteCams.get(msg.id);
    if (peer) {
      peer.stream?.getTracks().forEach((t) => t.stop());
      peer.pc?.close();
      remoteCams.delete(msg.id);
      if (activePhoneId === msg.id) {
        activePhoneId = remoteCams.keys().next().value || null;
      }
      updateCamUi();
    }
  }
}

function enterAutoMode(broadcast = true) {
  autoMode = true;
  document.body.classList.add("auto-showtime");
  if (btnExitAuto) btnExitAuto.hidden = false;
  btnAuto?.classList.add("active");
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
  autoLookTimer = performance.now() + 18000;
  autoCamTimer = performance.now() + 14000;
  autoPhoneTimer = performance.now() + 12000;
  toast("⚡ MODO AUTO FULLSCREEN ACTIVO");
  if (broadcast) net.send({ type: "setAuto", enabled: true });
}

function exitAutoMode(broadcast = true) {
  autoMode = false;
  document.body.classList.remove("auto-showtime");
  if (btnExitAuto) btnExitAuto.hidden = true;
  btnAuto?.classList.remove("active");
  if (document.fullscreenElement) {
    document.exitFullscreen().catch(() => {});
  }
  toast("Modo Auto desligado");
  if (broadcast) net.send({ type: "setAuto", enabled: false });
}

function setProjector(on) {
  hudLocked = on;
  document.body.classList.toggle("projector", on);
  hud.classList.toggle("hidden", on);
  document.querySelector("#btnHud").classList.toggle("active", on);
}

function showHudBriefly() {
  if (!hudLocked) return;
  hud.classList.remove("hidden");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => hud.classList.add("hidden"), 1800);
}

function toggleRecord() {
  if (source === "none") return;
  const btn = document.querySelector("#btnRec");
  if (recorder && recorder.state === "recording") {
    recorder.stop();
    return;
  }
  const chunks = [];
  const stream = canvas.captureStream(30);
  const mime = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find((t) =>
    MediaRecorder.isTypeSupported(t)
  );
  recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  recorder.ondataavailable = (ev) => {
    if (ev.data.size) chunks.push(ev.data);
  };
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: recorder.mimeType || "video/webm" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `flare-${Date.now()}.webm`;
    a.click();
    btn.classList.remove("rec");
    btn.textContent = "Gravar";
    toast("Clip gravado");
  };
  recorder.start();
  btn.classList.add("rec");
  btn.textContent = "Parar";
}

function applyIncomingState(msg) {
  applyingRemote = true;
  if (msg.look) setLook(msg.look, false);
  if (Number.isFinite(msg.intensity)) setIntensity(msg.intensity, false);
  if (Number.isFinite(msg.hueShift)) setHueShift(msg.hueShift, false);
  if (Number.isFinite(msg.bpm)) setBpm(msg.bpm, false);
  if (typeof msg.randomMode === "string") setRandomMode(msg.randomMode, false);
  if (typeof msg.camMode === "string") setCamMode(msg.camMode, false);
  if (Number.isFinite(msg.camMix)) setCamMix(msg.camMix, false);
  if (Number.isFinite(msg.motionMask)) setMotionMask(msg.motionMask, false);
  if (typeof msg.auto === "boolean") {
    if (msg.auto && !autoMode) enterAutoMode(false);
    else if (!msg.auto && autoMode) exitAutoMode(false);
  }
  applyMods(msg, false);
  applyingRemote = false;
}

net.on((msg) => {
  if (msg.type === "state") applyIncomingState(msg);
  if (msg.type === "setLook") setLook(msg.id, false);
  if (msg.type === "setIntensity") setIntensity(msg.value, false);
  if (msg.type === "setHue") setHueShift(msg.value, false);
  if (msg.type === "setBpm") setBpm(msg.value, false);
  if (msg.type === "setRandomMode") setRandomMode(msg.id, false);
  if (msg.type === "setCamMode") setCamMode(msg.mode, false);
  if (msg.type === "setCamMix") setCamMix(msg.value, false);
  if (msg.type === "setMotionMask") setMotionMask(msg.value, false);
  if (msg.type === "setAuto" && typeof msg.enabled === "boolean") {
    if (msg.enabled && !autoMode) enterAutoMode(false);
    else if (!msg.enabled && autoMode) exitAutoMode(false);
  }
  if (msg.type === "setMods") {
    applyMods(msg, false);
    if (Number.isFinite(msg.hueShift)) setHueShift(msg.hueShift, false);
    if (Number.isFinite(msg.bpm)) setBpm(msg.bpm, false);
    if (typeof msg.randomMode === "string") setRandomMode(msg.randomMode, false);
    if (typeof msg.camMode === "string") setCamMode(msg.camMode, false);
    if (Number.isFinite(msg.camMix)) setCamMix(msg.camMix, false);
    if (Number.isFinite(msg.motionMask)) setMotionMask(msg.motionMask, false);
    if (typeof msg.auto === "boolean") {
      if (msg.auto && !autoMode) enterAutoMode(false);
      else if (!msg.auto && autoMode) exitAutoMode(false);
    }
  }
  if (msg.type === "pulse") audio.pulse();
  if (msg.type === "tap") {
    if (Number.isFinite(msg.bpm)) audio.setBpm(msg.bpm);
    handleTap(false);
  }
  onSignal(msg);
});

fillCategories();
fillRandomModes();
fillLooks();
setLook(look, false);
setIntensity(intensity, false);
setHueShift(hueShift, false);
setRandomMode(randomMode, false);
setCamMode(camMode, false);
setCamMix(camMix, false);
setMotionMask(motionMask, false);
setSource("none", false);
syncModUi();
loadSession().catch(() => showGateError(new Error("Servidor de sessão indisponível")));

async function grantCam() {
  try {
    await startCamera(cameraSelect?.value);
  } catch (err) {
    showGateError(err);
  }
}

document.querySelector("#btnGrantCam")?.addEventListener("click", grantCam);
document.querySelector("#btnCam")?.addEventListener("click", grantCam);
document.querySelector("#btnMic")?.addEventListener("click", async () => {
  try {
    await audio.start();
    document.querySelector("#btnMic").classList.add("active");
    toast("Som da sala ligado");
  } catch {
    toast("Sem acesso ao microfone");
  }
});
document.querySelector("#btnRec")?.addEventListener("click", toggleRecord);
document.querySelector("#btnFull")?.addEventListener("click", () => {
  if (!document.fullscreenElement) document.documentElement.requestFullscreen();
  else document.exitFullscreen();
});
cameraSelect?.addEventListener("change", () => startCamera(cameraSelect.value).catch(showGateError));
intensityEl?.addEventListener("input", () => setIntensity(Number(intensityEl.value) / 100));
hueShiftEl?.addEventListener("input", () => setHueShift(Number(hueShiftEl.value) / 100));
btnTap?.addEventListener("click", () => handleTap(true));

camFader?.addEventListener("input", () => setCamMix(Number(camFader.value) / 100));
motionMaskSlider?.addEventListener("input", () => setMotionMask(Number(motionMaskSlider.value) / 100));
btnMotionMaskToggle?.addEventListener("click", () => setMotionMask(motionMask > 0.05 ? 0.0 : 0.85));
if (camModeChips) {
  for (const chip of camModeChips.querySelectorAll(".chip")) {
    chip.addEventListener("click", () => setCamMode(chip.dataset.cam));
  }
}

// Tabs in dock
document.querySelectorAll(".dock-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".dock-tab").forEach((t) => t.classList.toggle("active", t === tab));
    const targetId = tab.dataset.tab;
    document.querySelectorAll(".dock-pane").forEach((p) => p.classList.toggle("active", p.id === targetId));
  });
});

// Toggle dock visibility
btnToggleDock?.addEventListener("click", () => {
  dock?.classList.toggle("collapsed");
  btnToggleDock.classList.toggle("active", !dock?.classList.contains("collapsed"));
});

// Master AUTO button and discreet exit button
btnAuto?.addEventListener("click", () => {
  if (autoMode) exitAutoMode();
  else enterAutoMode();
});

btnExitAuto?.addEventListener("click", () => {
  exitAutoMode();
});

bassAmountEl?.addEventListener("input", () => {
  applyMods({ bassReact: Number(bassAmountEl.value) / 100 }, true);
});
for (const btn of document.querySelectorAll("#bassChips .chip")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.bass;
    applyMods({ [key]: !{ bassFlash, bassShake, bassZoom, bassRgb }[key] }, true);
  });
}
btnRotate?.addEventListener("click", () => applyMods({ rotate: !rotateOn }, true));
rotateMinsEl?.addEventListener("change", () => applyMods({ rotateSec: Number(rotateMinsEl.value) }, true));

window.addEventListener("mousemove", showHudBriefly);
window.addEventListener("keydown", (ev) => {
  if (ev.key === "f" || ev.key === "F") document.querySelector("#btnFull")?.click();
  if (ev.key === "Escape" && autoMode) exitAutoMode();
  if (ev.key === "h" || ev.key === "H") {
    if (autoMode) exitAutoMode();
    else setProjector(!hudLocked);
  }
  if (ev.key === "a" || ev.key === "A") {
    if (autoMode) exitAutoMode();
    else enterAutoMode();
  }
  if (ev.key === "t" || ev.key === "T") handleTap(true);
  if (ev.key === " ") {
    ev.preventDefault();
    audio.pulse();
  }
  if (ev.key === "[") setIntensity(intensity - 0.05);
  if (ev.key === "]") setIntensity(intensity + 0.05);
  const num = Number(ev.key);
  if (num >= 1 && num <= 9 && LOOKS[num - 1]) setLook(LOOKS[num - 1].id);
});

let start = performance.now();
function frame(now) {
  const t = (now - start) / 1000;
  audio.tick(now);
  tickRotate(now);
  bassMeter.style.height = `${Math.min(100, audio.bass * 140)}%`;

  if (bpmVal && audio.bpm !== Number(bpmVal.textContent)) {
    bpmVal.textContent = String(audio.bpm);
  }
  if (btnTap) {
    btnTap.classList.toggle("pulse", audio.beat > 0.65);
  }

  let activeIntensity = intensity;
  if (autoMode) {
    // 1. Organic Intensity Swing (60% to 100% on bass + LFO)
    const lfo = Math.sin(t * 0.6) * 0.5 + 0.5;
    const kickBoost = Math.max(audio.bass * 0.7, audio.beat) * 0.35;
    const wave = Math.min(1.0, Math.max(0.0, lfo * 0.7 + kickBoost));
    activeIntensity = 0.60 + 0.40 * wave;
    if (intensityEl) intensityEl.value = String(Math.round(activeIntensity * 100));

    // 2. Smooth drifting color spectrum (Hue / Tint)
    autoHuePhase = (autoHuePhase + 0.0004) % 1.0;
    hueShift = autoHuePhase;
    if (hueShiftEl) hueShiftEl.value = String(Math.round(hueShift * 100));

    // 3. Dynamic Dancer Silhouette Isolation (Motion Mask)
    if (audio.bass > 0.42) {
      motionMask = Math.min(0.85, motionMask + 0.035);
    } else {
      motionMask = Math.max(0.0, motionMask - 0.012);
    }
    if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));

    // 4. Autonomous Look Switcher (10s morphing transitions)
    if (now >= autoLookTimer) {
      const pool = LOOKS.filter((l) => l.id !== look);
      const next = pool[Math.floor(Math.random() * pool.length)];
      if (next) {
        setLook(next.id, true, true, 10000);
        autoLookTimer = now + (20000 + Math.random() * 12000);
      }
    }

    // 5. Autonomous Camera Director (Mix modes & crossfades)
    if (now >= autoCamTimer) {
      const modes = ["auto", "crossfade", "pip_a", "pip_b", "split"];
      const nextCam = modes[Math.floor(Math.random() * modes.length)];
      setCamMode(nextCam, true);
      if (nextCam === "crossfade") {
        setCamMix(Math.random() > 0.5 ? 0.25 : 0.75, true);
      }
      autoCamTimer = now + (16000 + Math.random() * 14000);
    }

    // 6. Multi-Phone Camera Switcher (Cycles between connected phones)
    if (remoteCams.size > 1 && now >= autoPhoneTimer) {
      const peerIds = Array.from(remoteCams.keys());
      const currentIndex = peerIds.indexOf(activePhoneId);
      const nextIndex = (currentIndex + 1) % peerIds.length;
      activePhoneId = peerIds[nextIndex];
      updateCamUi();
      autoPhoneTimer = now + 16000;
    }
  } else if (rotateOn && source !== "none") {
    const lfo = Math.sin(t * 0.75) * 0.5 + 0.5;
    const kickBoost = Math.max(audio.bass * 0.65, audio.beat) * 0.35;
    const wave = Math.min(1.0, Math.max(0.0, lfo * 0.72 + kickBoost));
    activeIntensity = 0.60 + 0.40 * wave;
    if (intensityEl) {
      intensityEl.value = String(Math.round(activeIntensity * 100));
    }
  }

  renderer.setParams({
    time: t,
    intensity: activeIntensity,
    bass: audio.bass,
    beat: audio.beat,
    bassReact,
    bassFlash,
    bassShake,
    bassZoom,
    bassRgb,
    hueShift,
    bpm: audio.bpm,
    beatPhase: audio.beatPhase,
    camMode,
    camMix,
    motionMask,
  });

  const phoneVideo = getActivePhoneVideo();
  const readyA = Boolean(camStreamA && videoA.readyState >= 2);
  const readyB = Boolean(phoneVideo && phoneVideo.readyState >= 2);
  if (readyA || readyB) {
    renderer.draw(readyA ? videoA : null, readyB ? phoneVideo : null);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
