import { bindVideo, cameraContext, cameraErrorText, openCamera } from "./camera.js";
import { CATEGORIES, LOOKS, RANDOM_MODES, lookById, randomModeById, filterLooks, is3DLook } from "./looks.js";
import { connect } from "./net.js";
import { DEFAULTS } from "./settings.js";

const looksEl = document.querySelector("#looks");
const catBar = document.querySelector("#catBar");
const vibeBadge = document.querySelector("#vibeBadge");
const randomModeSelect = document.querySelector("#randomModeSelect");
const intensityEl = document.querySelector("#intensity");
const hueShiftEl = document.querySelector("#hueShift");
const btnTap = document.querySelector("#btnTap");
const bpmVal = document.querySelector("#bpmVal");
const statusEl = document.querySelector("#status");
const camGate = document.querySelector("#camGate");
const app = document.querySelector("#app");
const preview = document.querySelector("#preview");
const gateError = document.querySelector("#gateError");
const gateLead = document.querySelector("#gateLead");
const btnGrantCam = document.querySelector("#btnGrantCam");
const bassAmountEl = document.querySelector("#bassAmount");
const btnRotate = document.querySelector("#btnRotate");
const rotateMinsEl = document.querySelector("#rotateMins");
const rotateEtaEl = document.querySelector("#rotateEta");

const badgeCamA = document.querySelector("#badgeCamA");
const badgeCamB = document.querySelector("#badgeCamB");
const camModeChips = document.querySelector("#camModeChips");
const camFader = document.querySelector("#camFader");
const motionMaskSlider = document.querySelector("#motionMaskSlider");
const btnMotionMaskToggle = document.querySelector("#btnMotionMaskToggle");
const btnAuto = document.querySelector("#btnAuto");
const dimBar = document.querySelector("#dimBar");
const sessionSlotsBox = document.querySelector("#sessionSlotsBox");
const sessionCountText = document.querySelector("#sessionCountText");
const sessionPlayersList = document.querySelector("#sessionPlayersList");
const playerNameInput = document.querySelector("#playerNameInput");
const userBadge = document.querySelector("#userBadge");

const net = connect();
let myPeerId = "peer_" + Math.random().toString(36).slice(2, 9);
let myPlayerName = (localStorage.getItem("flare_player_name") || "").trim().slice(0, 18);
let activeSessions = [];
let maxSessions = 4;
let joinedSession = false;
let currentSendAttempt = 0;

if (playerNameInput && myPlayerName) {
  playerNameInput.value = myPlayerName;
}

let autoModeOn = false;
let look = DEFAULTS.look;
let currentCategory = "all";
let dimension = DEFAULTS.dimension || "all";
let autoScope = DEFAULTS.autoScope || "all";
let randomMode = DEFAULTS.randomMode || "free_tekno";
let camMode = DEFAULTS.camMode || "auto";
let camMix = DEFAULTS.camMix ?? 0.5;
let motionMask = DEFAULTS.motionMask ?? 0.0;
let pc = null;
let camStream = null;
let iceQueue = [];
let applying = false;
let facingMode = "environment";
let bassFlash = DEFAULTS.bassFlash;
let bassShake = DEFAULTS.bassShake;
let bassZoom = DEFAULTS.bassZoom;
let bassRgb = DEFAULTS.bassRgb;
let rotateOn = DEFAULTS.rotate;
let rotateSec = DEFAULTS.rotateSec;
let hueShift = DEFAULTS.hueShift ?? 0;
let wakeLock = null;

function renderSessionsGate(sessions, max = 4) {
  activeSessions = Array.isArray(sessions) ? sessions : [];
  maxSessions = max || 4;
  if (sessionCountText) {
    sessionCountText.textContent = `${activeSessions.length} / ${maxSessions} lugares ocupados`;
  }
  if (sessionPlayersList) {
    sessionPlayersList.innerHTML = "";
    if (activeSessions.length === 0) {
      const empty = document.createElement("span");
      empty.className = "session-player-pill empty";
      empty.textContent = "Nenhum telemóvel ligado";
      sessionPlayersList.append(empty);
    } else {
      for (const s of activeSessions) {
        const pill = document.createElement("span");
        pill.className = "session-player-pill";
        pill.textContent = `👤 ${s.name}${s.id === myPeerId ? " (tu)" : ""}`;
        sessionPlayersList.append(pill);
      }
    }
  }
  const alreadyIn = activeSessions.some((s) => s.id === myPeerId);
  const isFull = activeSessions.length >= maxSessions && !alreadyIn;
  sessionSlotsBox?.classList.toggle("is-full", isFull);
  if (btnGrantCam && cameraContext().secure) {
    btnGrantCam.disabled = isFull;
    btnGrantCam.textContent = isFull ? `Sessão Cheia (${maxSessions}/${maxSessions})` : "Entrar & Ligar Câmara";
  }
}

function setCamMode(mode, broadcast = true) {
  camMode = mode;
  if (camModeChips) {
    for (const chip of camModeChips.querySelectorAll(".chip")) {
      chip.classList.toggle("active", chip.dataset.cam === camMode);
    }
  }
  if (broadcast) {
    if (navigator.vibrate) navigator.vibrate(15);
    net.send({ type: "setCamMode", mode: camMode });
  }
}

function setCamMix(val, broadcast = true) {
  camMix = Math.min(1, Math.max(0, val));
  if (camFader) camFader.value = String(Math.round(camMix * 100));
  if (broadcast) net.send({ type: "setCamMix", value: camMix });
}

function setMotionMask(val, broadcast = true) {
  motionMask = Math.min(1, Math.max(0, val));
  const isOn = motionMask > 0.05;
  if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));
  if (btnMotionMaskToggle) {
    btnMotionMaskToggle.classList.toggle("active", isOn);
    btnMotionMaskToggle.textContent = isOn ? "👤 IA CORPO: ON" : "👤 IA CORPO";
  }
  if (broadcast) net.send({ type: "setMotionMask", value: motionMask });
}

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

function showCustomGateError(title, body) {
  gateError.hidden = false;
  gateError.replaceChildren();
  const strong = document.createElement("strong");
  strong.textContent = title;
  const span = document.createElement("span");
  span.textContent = body;
  gateError.append(strong, span);
}

function showGateError(err) {
  const { title, body } = cameraErrorText(err);
  showCustomGateError(title, body);
}

function setLook(id, broadcast = true) {
  look = id;
  for (const btn of looksEl.querySelectorAll("button")) {
    btn.classList.toggle("active", btn.dataset.id === look);
  }
  if (broadcast) {
    if (navigator.vibrate) navigator.vibrate(15);
    net.send({ type: "setLook", id: look });
  }
}

function setRandomMode(id, broadcast = true) {
  randomMode = randomModeById(id).id;
  if (randomModeSelect) randomModeSelect.value = randomMode;
  if (vibeBadge) vibeBadge.textContent = randomModeById(randomMode).badge;
  if (broadcast) net.send({ type: "setRandomMode", id: randomMode });
}

function setDimension(dim, broadcast = true) {
  dimension = dim || "all";
  autoScope = dimension;
  if (dimBar) {
    for (const chip of dimBar.querySelectorAll(".dim-chip")) {
      chip.classList.toggle("active", chip.dataset.dim === dimension);
    }
  }

  const is3D = is3DLook(look);
  const mismatch = (dimension === "3d" && !is3D) || (dimension === "2d" && is3D);
  if (mismatch) {
    const pool = filterLooks(dimension, "all");
    if (pool.length > 0) {
      setLook(pool[0].id, broadcast);
    }
  }

  if (dimension === "3d" && randomMode !== "random_3d") {
    setRandomMode("random_3d", false);
  } else if (dimension === "2d" && (randomMode === "random_3d" || randomMode === "random_all")) {
    setRandomMode("random_2d", false);
  } else if (dimension === "all" && (randomMode === "random_3d" || randomMode === "random_2d")) {
    setRandomMode("random_all", false);
  }

  fillCategories();
  fillLooks();

  if (broadcast) {
    if (navigator.vibrate) navigator.vibrate(15);
    net.send({ type: "setDimension", dimension });
  }
}

function fillCategories() {
  if (!catBar) return;
  catBar.innerHTML = "";
  catBar.hidden = dimension === "3d";

  const available = CATEGORIES.filter((cat) => {
    if (cat.id === "all") return true;
    if (dimension === "3d") return cat.id === "lidar";
    if (dimension === "2d") return cat.id !== "lidar";
    return true;
  });

  if (!available.some((c) => c.id === currentCategory)) {
    currentCategory = "all";
  }

  for (const cat of available) {
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
    const val = randomModeSelect.value;
    setRandomMode(val, true);
    if (val === "random_3d") setDimension("3d", true);
    else if (val === "random_2d") setDimension("2d", true);
    else if (val === "random_all") setDimension("all", true);
  });
}

function fillLooks() {
  looksEl.innerHTML = "";
  const list = filterLooks(dimension, currentCategory);
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

function syncModUi() {
  for (const btn of document.querySelectorAll("#bassChips .chip")) {
    const on = { bassFlash, bassShake, bassZoom, bassRgb }[btn.dataset.bass];
    btn.classList.toggle("active", Boolean(on));
  }
  btnRotate?.classList.toggle("active", rotateOn);
  if (rotateMinsEl) rotateMinsEl.value = String(rotateSec);
  if (rotateEtaEl) rotateEtaEl.textContent = rotateOn ? `A trocar de ${rotateSec} em ${rotateSec} segundos` : "";
  if (hueShiftEl) hueShiftEl.value = String(Math.round(hueShift * 100));
  if (randomModeSelect) randomModeSelect.value = randomMode;
  if (vibeBadge) vibeBadge.textContent = randomModeById(randomMode).badge;

  if (camModeChips) {
    for (const chip of camModeChips.querySelectorAll(".chip")) {
      chip.classList.toggle("active", chip.dataset.cam === camMode);
    }
  }
  if (camFader) camFader.value = String(Math.round(camMix * 100));
  if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));
  if (btnMotionMaskToggle) {
    const isOn = motionMask > 0.05;
    btnMotionMaskToggle.classList.toggle("active", isOn);
    btnMotionMaskToggle.textContent = isOn ? "👤 IA CORPO: ON" : "👤 IA CORPO";
  }
  if (dimBar) {
    for (const chip of dimBar.querySelectorAll(".dim-chip")) {
      chip.classList.toggle("active", chip.dataset.dim === dimension);
    }
  }
}

function applyMods(msg, broadcast) {
  if (Number.isFinite(msg.bassReact) && bassAmountEl) {
    bassAmountEl.value = String(Math.round(msg.bassReact * 100));
  }
  if (typeof msg.bassFlash === "boolean") bassFlash = msg.bassFlash;
  if (typeof msg.bassShake === "boolean") bassShake = msg.bassShake;
  if (typeof msg.bassZoom === "boolean") bassZoom = msg.bassZoom;
  if (typeof msg.bassRgb === "boolean") bassRgb = msg.bassRgb;
  if (typeof msg.rotate === "boolean") rotateOn = msg.rotate;
  if (Number.isFinite(msg.rotateSec)) rotateSec = msg.rotateSec;
  if (typeof msg.randomMode === "string") randomMode = msg.randomMode;
  if (Number.isFinite(msg.hueShift)) hueShift = Math.min(1, Math.max(0, msg.hueShift));
  if (Number.isFinite(msg.bpm) && bpmVal) bpmVal.textContent = String(Math.round(msg.bpm));
  if (typeof msg.camMode === "string") camMode = msg.camMode;
  if (Number.isFinite(msg.camMix)) camMix = Math.min(1, Math.max(0, msg.camMix));
  if (Number.isFinite(msg.motionMask)) motionMask = Math.min(1, Math.max(0, msg.motionMask));
  if (typeof msg.dimension === "string") {
    dimension = msg.dimension;
    autoScope = msg.autoScope || msg.dimension;
    fillCategories();
    fillLooks();
  }
  if (typeof msg.autoScope === "string") autoScope = msg.autoScope;

  syncModUi();
  if (broadcast) {
    net.send({
      type: "setMods",
      bassReact: bassAmountEl ? Number(bassAmountEl.value) / 100 : 0.75,
      bassFlash,
      bassShake,
      bassZoom,
      bassRgb,
      rotate: rotateOn,
      rotateSec,
      randomMode,
      hueShift,
      camMode,
      camMix,
      motionMask,
      dimension,
      autoScope,
    });
  }
}

fillCategories();
fillRandomModes();
fillLooks();
setDimension(dimension, false);

intensityEl?.addEventListener("input", () => {
  if (!applying) net.send({ type: "setIntensity", value: Number(intensityEl.value) / 100 });
});

hueShiftEl?.addEventListener("input", () => {
  if (!applying) {
    hueShift = Number(hueShiftEl.value) / 100;
    net.send({ type: "setHue", value: hueShift });
  }
});

motionMaskSlider?.addEventListener("input", () => {
  if (!applying) setMotionMask(Number(motionMaskSlider.value) / 100, true);
});

btnMotionMaskToggle?.addEventListener("click", () => {
  if (navigator.vibrate) navigator.vibrate(20);
  setMotionMask(motionMask > 0.05 ? 0.0 : 0.9, true);
});

camFader?.addEventListener("input", () => {
  if (!applying) setCamMix(Number(camFader.value) / 100, true);
});

if (camModeChips) {
  for (const chip of camModeChips.querySelectorAll(".chip")) {
    chip.addEventListener("click", () => setCamMode(chip.dataset.cam, true));
  }
}

bassAmountEl?.addEventListener("input", () => {
  if (!applying) applyMods({ bassReact: Number(bassAmountEl.value) / 100 }, true);
});

for (const btn of document.querySelectorAll("#bassChips .chip")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.bass;
    applyMods({ [key]: !{ bassFlash, bassShake, bassZoom, bassRgb }[key] }, true);
  });
}

btnRotate?.addEventListener("click", () => applyMods({ rotate: !rotateOn }, true));
rotateMinsEl?.addEventListener("change", () => applyMods({ rotateSec: Number(rotateMinsEl.value) }, true));

document.querySelector("#btnPulse")?.addEventListener("click", () => {
  if (navigator.vibrate) navigator.vibrate(30);
  net.send({ type: "pulse" });
});

btnTap?.addEventListener("click", () => {
  if (navigator.vibrate) navigator.vibrate(20);
  btnTap.classList.add("pulse");
  setTimeout(() => btnTap.classList.remove("pulse"), 130);
  net.send({ type: "tap" });
});

net.onOpen(() => {
  statusEl.textContent = "ligado ao palco";
  if (joinedSession && myPlayerName) {
    net.send({ type: "joinSession", name: myPlayerName, camActive: Boolean(camStream) });
  }
});
net.onClose(() => {
  statusEl.textContent = "a reconectar…";
});

net.on(async (msg) => {
  if (msg.type === "init") {
    if (msg.id) myPeerId = msg.id;
    if (Array.isArray(msg.sessions)) renderSessionsGate(msg.sessions, msg.maxSessions);
  }
  if (msg.type === "sessionsUpdate") {
    renderSessionsGate(msg.sessions, msg.maxSessions);
  }
  if (msg.type === "joinAccepted") {
    if (msg.id) myPeerId = msg.id;
    joinedSession = true;
    myPlayerName = msg.name || myPlayerName;
    if (userBadge) {
      userBadge.textContent = `👤 ${myPlayerName}`;
      userBadge.hidden = false;
    }
    if (Array.isArray(msg.sessions)) renderSessionsGate(msg.sessions, msg.maxSessions);
    startSending().catch(showGateError);
  }
  if (msg.type === "joinRejected") {
    joinedSession = false;
    if (Array.isArray(msg.sessions)) renderSessionsGate(msg.sessions, msg.maxSessions);
    showCustomGateError("Sessão indisponível", msg.reason || "A sessão está cheia (máximo 4 pessoas).");
  }
  if (msg.type === "kicked") {
    joinedSession = false;
    currentSendAttempt++;
    camStream?.getTracks().forEach((t) => t.stop());
    camStream = null;
    pc?.close();
    pc = null;
    badgeCamB?.classList.remove("live");
    app.hidden = true;
    camGate.hidden = false;
    showCustomGateError("Sessão terminada", msg.reason || "O palco desligou a tua sessão.");
  }
  if (
    msg.type === "init" ||
    msg.type === "state" ||
    msg.type === "setLook" ||
    msg.type === "setIntensity" ||
    msg.type === "setHue" ||
    msg.type === "setBpm" ||
    msg.type === "setRandomMode" ||
    msg.type === "setCamMode" ||
    msg.type === "setCamMix" ||
    msg.type === "setMotionMask" ||
    msg.type === "setDimension" ||
    msg.type === "setAutoScope" ||
    msg.type === "setMods"
  ) {
    applying = true;
    if (msg.look || (msg.type === "setLook" && msg.id)) setLook(msg.look || msg.id, false);
    if (Number.isFinite(msg.intensity) || (msg.type === "setIntensity" && Number.isFinite(msg.value))) {
      const val = Number.isFinite(msg.intensity) ? msg.intensity : msg.value;
      intensityEl.value = String(Math.round(val * 100));
    }
    if (Number.isFinite(msg.hueShift) || (msg.type === "setHue" && Number.isFinite(msg.value))) {
      hueShift = Number.isFinite(msg.hueShift) ? msg.hueShift : msg.value;
      if (hueShiftEl) hueShiftEl.value = String(Math.round(hueShift * 100));
    }
    if (Number.isFinite(msg.bpm) || (msg.type === "setBpm" && Number.isFinite(msg.value))) {
      const b = Number.isFinite(msg.bpm) ? msg.bpm : msg.value;
      if (bpmVal) bpmVal.textContent = String(Math.round(b));
    }
    if (typeof msg.randomMode === "string" || (msg.type === "setRandomMode" && typeof msg.id === "string")) {
      setRandomMode(msg.randomMode || msg.id, false);
    }
    if (typeof msg.camMode === "string" || (msg.type === "setCamMode" && typeof msg.mode === "string")) {
      setCamMode(msg.camMode || msg.mode, false);
    }
    if (Number.isFinite(msg.camMix) || (msg.type === "setCamMix" && Number.isFinite(msg.value))) {
      const val = Number.isFinite(msg.camMix) ? msg.camMix : msg.value;
      setCamMix(val, false);
    }
    if (Number.isFinite(msg.motionMask) || (msg.type === "setMotionMask" && Number.isFinite(msg.value))) {
      const val = Number.isFinite(msg.motionMask) ? msg.motionMask : msg.value;
      setMotionMask(val, false);
    }
    if (typeof msg.dimension === "string") {
      setDimension(msg.dimension, false);
    }
    if (typeof msg.autoScope === "string" || (msg.type === "setAutoScope" && typeof msg.scope === "string")) {
      autoScope = msg.autoScope || msg.scope;
    }
    if (msg.source) {
      const hasA = msg.source === "camera" || msg.source === "dual";
      const hasB = msg.source === "phone" || msg.source === "dual";
      badgeCamA?.classList.toggle("live", hasA);
      badgeCamB?.classList.toggle("live", hasB);
    }
    if (typeof msg.auto === "boolean") {
      autoModeOn = msg.auto;
      btnAuto?.classList.toggle("active", autoModeOn);
    }
    applyMods(msg, false);
    applying = false;
  }
  if (msg.type === "tap") {
    if (Number.isFinite(msg.bpm) && bpmVal) bpmVal.textContent = String(Math.round(msg.bpm));
    btnTap?.classList.add("pulse");
    setTimeout(() => btnTap?.classList.remove("pulse"), 130);
  }
  if (msg.type === "answer" && msg.sdp && pc) {
    if (!msg.to || msg.to === myPeerId) {
      try {
        if (pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(msg.sdp);
        }
        while (iceQueue.length > 0) {
          const cand = iceQueue.shift();
          try {
            await pc.addIceCandidate(cand);
          } catch {}
        }
      } catch (err) {
        console.warn("Erro ao aplicar answer WebRTC:", err);
      }
    }
  }
  if (msg.type === "ice" && msg.candidate) {
    if (!msg.to || msg.to === myPeerId) {
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(msg.candidate);
        } catch {}
      } else {
        iceQueue.push(msg.candidate);
      }
    }
  }
  if (msg.type === "peers") {
    statusEl.textContent = msg.count > 1 ? "a enviar para o palco" : "à espera do palco";
  }
});

if (!cameraContext().secure) {
  showGateError({ name: "SecurityError" });
  btnGrantCam.hidden = true;
  gateLead.textContent =
    "Este link é HTTP. No PC arranca com npm start, e no telemóvel abre o QR HTTPS do palco.";
}

async function startSending() {
  const attemptId = ++currentSendAttempt;
  gateError.hidden = true;
  camStream?.getTracks().forEach((t) => t.stop());
  pc?.close();
  pc = null;
  iceQueue = [];

  const stream = await openCamera({ facingMode });
  if (attemptId !== currentSendAttempt) {
    stream.getTracks().forEach((t) => t.stop());
    return;
  }
  camStream = stream;
  bindVideo(preview, camStream).catch(() => {});
  requestWakeLock();
  badgeCamB?.classList.add("live");

  const localPc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  pc = localPc;

  for (const track of camStream.getTracks()) {
    localPc.addTrack(track, camStream);
  }

  localPc.onicecandidate = (ev) => {
    if (localPc === pc && ev.candidate) {
      net.send({ type: "ice", from: myPeerId, name: myPlayerName, to: "stage", candidate: ev.candidate });
    }
  };

  try {
    await localPc.setLocalDescription();
  } catch {
    const offer = await localPc.createOffer();
    if (attemptId !== currentSendAttempt || localPc !== pc) {
      localPc.close();
      return;
    }
    await localPc.setLocalDescription(offer);
  }

  if (attemptId !== currentSendAttempt || localPc !== pc) {
    localPc.close();
    return;
  }

  net.send({
    type: "offer",
    from: myPeerId,
    name: myPlayerName,
    to: "stage",
    sdp: localPc.localDescription,
  });

  camGate.hidden = true;
  app.hidden = false;
}

function handleRequestJoin() {
  const nameVal = (playerNameInput?.value || "").trim().slice(0, 18);
  if (!nameVal) {
    showCustomGateError(
      "Nome obrigatório",
      "Por favor escreve o teu nome ou alcunha (máx. 4 pessoas na sessão) antes de entrar."
    );
    playerNameInput?.focus();
    return;
  }
  myPlayerName = nameVal;
  localStorage.setItem("flare_player_name", myPlayerName);
  gateError.hidden = true;
  net.send({ type: "joinSession", name: myPlayerName, camActive: true });
}

btnGrantCam.addEventListener("click", handleRequestJoin);
playerNameInput?.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    ev.preventDefault();
    handleRequestJoin();
  }
});

document.querySelector("#btnFlip").addEventListener("click", () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  startSending().catch(showGateError);
});

document.querySelector("#btnStopCam").addEventListener("click", () => {
  currentSendAttempt++;
  joinedSession = false;
  camStream?.getTracks().forEach((t) => t.stop());
  camStream = null;
  pc?.close();
  pc = null;
  badgeCamB?.classList.remove("live");
  net.send({ type: "stopCam", from: myPeerId });
  net.send({ type: "leaveSession", from: myPeerId });
  app.hidden = true;
  camGate.hidden = false;
});

btnAuto?.addEventListener("click", () => {
  autoModeOn = !autoModeOn;
  btnAuto.classList.toggle("active", autoModeOn);
  net.send({ type: "setAuto", enabled: autoModeOn });
});

if (dimBar) {
  for (const chip of dimBar.querySelectorAll(".dim-chip")) {
    chip.addEventListener("click", () => setDimension(chip.dataset.dim, true));
  }
}

syncModUi();
