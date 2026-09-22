export function cameraContext() {
  return {
    secure: window.isSecureContext,
    protocol: location.protocol,
    host: location.host,
    supported: Boolean(navigator.mediaDevices?.getUserMedia),
  };
}

export function cameraErrorText(err) {
  const ctx = cameraContext();
  if (!ctx.supported || !ctx.secure) {
    return {
      title: "O browser bloqueia a câmara neste link",
      body: "A câmara do PC só funciona em http://localhost:4242 no Chrome ou Edge. A câmara do telemóvel precisa do QR HTTPS (porta 4243): Avançado → continuar para o site.",
    };
  }

  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return {
      title: "Permissão da câmara recusada",
      body: "No Chrome/Edge: ícone de cadeado ao lado do URL → Câmara → Permitir. Se aparecer “bloqueado”, abre as definições do site e permite. No Windows: Definições → Privacidade e segurança → Câmara → permitir o browser. Fecha este separador, volta a abrir, e toca outra vez.",
    };
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return {
      title: "Nenhuma câmara neste aparelho",
      body: "Este PC/telemóvel não expõe câmara ao browser. No PC, liga a webcam USB e usa o QR para filmar com o telemóvel. No telemóvel, confirma que o Safari/Chrome tem permissão de câmara nas definições do sistema.",
    };
  }
  if (name === "NotReadableError" || name === "TrackStartError" || name === "AbortError") {
    return {
      title: "Câmara ocupada",
      body: "Fecha Zoom, Teams, OBS, Discord ou outra app que esteja a usar a câmara e tenta outra vez.",
    };
  }
  if (name === "SecurityError") {
    return {
      title: "Contexto inseguro",
      body: "Abre o palco em http://localhost:4242 no Chrome ou Edge (não no preview do Cursor). No telemóvel usa o QR HTTPS e aceita o certificado local.",
    };
  }
  if (name === "OverconstrainedError") {
    return {
      title: "A câmara recusou as definições",
      body: "Tenta outra vez — vamos pedir o modo mais simples da câmara.",
    };
  }
  return {
    title: "Não foi possível abrir a câmara",
    body: err?.message || String(err || "erro desconhecido"),
  };
}

export async function openCamera({ deviceId, facingMode } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    const err = new Error("getUserMedia indisponível");
    err.name = "SecurityError";
    throw err;
  }

  const tries = [];
  if (deviceId) {
    tries.push({ audio: false, video: { deviceId: { exact: deviceId } } });
  } else if (facingMode) {
    tries.push({
      audio: false,
      video: {
        facingMode: { ideal: facingMode },
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });
    tries.push({ audio: false, video: { facingMode } });
  } else {
    tries.push({
      audio: false,
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  }
  tries.push({ audio: false, video: true });

  let lastErr;
  for (const constraints of tries) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      lastErr = err;
      if (err?.name === "NotAllowedError" || err?.name === "PermissionDeniedError" || err?.name === "SecurityError") {
        throw err;
      }
    }
  }
  throw lastErr;
}

export function bindVideo(el, stream) {
  el.srcObject = stream;
  el.muted = true;
  el.playsInline = true;
  el.setAttribute("playsinline", "");
  el.setAttribute("webkit-playsinline", "");
  return el.play();
}
