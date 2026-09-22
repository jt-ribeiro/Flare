import { bindVideo, cameraContext, cameraErrorText, openCamera } from "./camera.js";
import { CATEGORIES, LOOKS, RANDOM_MODES, lookById, randomModeById } from "./looks.js";
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
const btnAuto = document.querySelector("#btnAuto");

const net = connect();
let myPeerId = "peer_" + Math.random().toString(36).slice(2, 9);
let autoModeOn = false;
let look = DEFAULTS.look;
let currentCategory = "all";
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
  if (motionMaskSlider) motionMaskSlider.value = String(Math.round(motionMask * 100));
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

function syncModUi() {
  for (const btn of document.querySelectorAll("#bassChips .chip")) {
    const on = { bassFlash, bassShake, bassZoom, bassRgb }[btn.dataset.bass];
    btn.classList.toggle("active", Boolean(on));
  }
  btnRotate.classList.toggle("active", rotateOn);
  rotateMinsEl.value = String(rotateSec);
  rotateEtaEl.textContent = rotateOn ? `A trocar de ${rotateSec} em ${rotateSec} segundos` : "";
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
}

function applyMods(msg, broadcast) {
  if (Number.isFinite(msg.bassReact)) {
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

  syncModUi();
  if (broadcast) {
    net.send({
      type: "setMods",
      bassReact: Number(bassAmountEl.value) / 100,
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
    });
  }
}

fillCategories();
fillRandomModes();
fillLooks();

intensityEl.addEventListener("input", () => {
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

camFader?.addEventListener("input", () => {
  if (!applying) setCamMix(Number(camFader.value) / 100, true);
});

if (camModeChips) {
  for (const chip of camModeChips.querySelectorAll(".chip")) {
    chip.addEventListener("click", () => setCamMode(chip.dataset.cam, true));
  }
}

bassAmountEl.addEventListener("input", () => {
  if (!applying) applyMods({ bassReact: Number(bassAmountEl.value) / 100 }, true);
});

for (const btn of document.querySelectorAll("#bassChips .chip")) {
  btn.addEventListener("click", () => {
    const key = btn.dataset.bass;
    applyMods({ [key]: !{ bassFlash, bassShake, bassZoom, bassRgb }[key] }, true);
  });
}

btnRotate.addEventListener("click", () => applyMods({ rotate: !rotateOn }, true));
rotateMinsEl.addEventListener("change", () => applyMods({ rotateSec: Number(rotateMinsEl.value) }, true));

document.querySelector("#btnPulse").addEventListener("click", () => {
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
});
net.onClose(() => {
  statusEl.textContent = "a reconectar…";
});

net.on(async (msg) => {
  if (
    msg.type === "state" ||
    msg.type === "setLook" ||
    msg.type === "setIntensity" ||
    msg.type === "setHue" ||
    msg.type === "setBpm" ||
    msg.type === "setRandomMode" ||
    msg.type === "setCamMode" ||
    msg.type === "setCamMix" ||
    msg.type === "setMotionMask" ||
    msg.type === "setMods"
  ) {
    applying = true;
    if (msg.look || msg.id) setLook(msg.look || msg.id, false);
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
    if (msg.source) {
      const hasA = msg.source === "camera" || msg.source === "dual";
      const hasB = msg.source === "phone" || msg.source === "dual";
      badgeCamA?.classList.toggle("live", hasA);
      badgeCamB?.classList.toggle("live", hasB);
    }
    if (msg.type === "init" && msg.id) {
      myPeerId = msg.id;
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
      await pc.setRemoteDescription(msg.sdp);
      while (iceQueue.length > 0) {
        const cand = iceQueue.shift();
        try {
          await pc.addIceCandidate(cand);
        } catch {}
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
  gateError.hidden = true;
  camStream?.getTracks().forEach((t) => t.stop());
  pc?.close();
  pc = null;
  iceQueue = [];

  camStream = await openCamera({ facingMode });
  bindVideo(preview, camStream).catch(() => {});
  requestWakeLock();
  badgeCamB?.classList.add("live");

  pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
  for (const track of camStream.getTracks()) pc.addTrack(track, camStream);
  pc.onicecandidate = (ev) => {
    if (ev.candidate) net.send({ type: "ice", from: myPeerId, to: "stage", candidate: ev.candidate });
  };
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  net.send({ type: "offer", from: myPeerId, to: "stage", sdp: pc.localDescription });
  camGate.hidden = true;
  app.hidden = false;
}

btnGrantCam.addEventListener("click", () => {
  startSending().catch(showGateError);
});

document.querySelector("#btnFlip").addEventListener("click", () => {
  facingMode = facingMode === "environment" ? "user" : "environment";
  startSending().catch(showGateError);
});

document.querySelector("#btnStopCam").addEventListener("click", () => {
  camStream?.getTracks().forEach((t) => t.stop());
  pc?.close();
  pc = null;
  badgeCamB?.classList.remove("live");
  net.send({ type: "stopCam", from: myPeerId });
  app.hidden = true;
  camGate.hidden = false;
});

btnAuto?.addEventListener("click", () => {
  autoModeOn = !autoModeOn;
  btnAuto.classList.toggle("active", autoModeOn);
  net.send({ type: "setAuto", enabled: autoModeOn });
});

syncModUi();
