# FLARE · Real-Time Rave Visuals & Live Multi-Cam FX Engine

> **Live restyle para eventos e música eletrónica:** processamento de vídeo 100% na GPU (WebGL2), suporte para múltiplas câmaras em simultâneo (Webcam + Telemóveis via WebRTC), isolamento de silhuetas na pista e modo de espetáculo autónomo (*Showtime AUTO*).

---

## ⚡ Destaques e Funcionalidades

* **🎨 30 Shaders de Efeitos em 5 Categorias:**
  * **Tekno Rave:** *Tekno Strobe, Gabber Flash, Tunnel Vision, Laser Grid, Rave Strobe, Acid Core*
  * **Acid Warp:** *Acid Wash, Liquid Psy, Feedback Loop, Liquid Chrome, Plasma Coil, Biohazard*
  * **Glitch & Datamosh:** *Datamosh, CRT Terminal, VCR Tape, Broken Code, Digital Decay, Pixel Sorter*
  * **Retro Industrial:** *Industrial Heat, Night Vision, Thermal Ghost, Asphalt Noir, Blueprint, Rust Chamber*
  * **Minimal Sub:** *Sub Bass Scan, Minimal Smoke, Echo Shadow, Audio Sine, Void Pulse, Dark Wave*
* **📹 Mistura de Câmaras em Direto (Dual & Multi-Camera Realization):**
  * Suporta a **webcam local do PC (Câmara A)** e **múltiplos telemóveis ligados via WebRTC (Câmara B)** em simultâneo.
  * Modos de realização: `AUTO`, `PC (A)`, `TEL (B)`, `Fader A/B`, `PIP DJ`, `PIP Pista` e `Split 50/50`.
  * Rotação automática entre múltiplos telemóveis ligados na pista.
* **👤 Isolamento de Silhuetas dos Dançarinos (GPU Motion Mask):**
  * Deteção de movimento temporal contínua diretamente nos fragment shaders.
  * Mantém as paredes e o espaço em tons asfálticos escuros, destacando apenas quem está a dançar com luminosidade e cor fluorescente de alto contraste.
* **⚡ Modo Mestre "AUTO" (Showtime Autónomo Fullscreen):**
  * Ecrã inteiro com 1 clique, ocultando totalmente a interface do utilizador.
  * Botão de saída discreto (`✕`) no canto superior direito com opacidade reduzida (`0.25`), impercetível para o público na tela do projetor.
  * Modulação orgânica contínua: intensidade entre 60% e 100%, transições morphing suaves de 10s entre visuais a cada 20–30s, rotação de câmaras e deslocamento subtil de paleta de cores.
* **🔊 Reação ao Baixo & Tap Tempo BPM:**
  * Analisador de áudio Web Audio API (FFT) em tempo real com deteção de frequências sub-bass.
  * Modulações reativas à batida: *Flash*, *Vibração (Shake)*, *Zoom*, e *Aberração Cromática RGB*.
  * Botão de Tap Tempo para sincronizar rotações com o compasso 4/4 da música eletrónica.
* **📱 Comando e Câmara Remota sem Aplicação:**
  * Basta ler o código QR no telemóvel para ligar a câmara em direto via WebRTC ou controlar visuais, faders e presets sem fios.

---

## 🚀 Como Iniciar

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o servidor
npm start
```

Abre o **Chrome ou Edge** em `http://localhost:4242`:

1. Clica em **"Permitir câmara deste PC"** para autorizar a webcam.
2. No telemóvel (ligado à mesma rede Wi-Fi):
   * Lê o código QR apresentado no ecrã.
   * O endereço utiliza HTTPS local na porta `4243` (obrigatório para iOS/Android autorizarem a câmara WebRTC).
   * No aviso de segurança de certificado local: **Avançado → Continuar**.
   * Toca em **"Ligar câmara"**.

---

## ⌨️ Atalhos de Teclado no Palco

| Tecla | Ação |
|---|---|
| `F` | Alternar Modo Ecrã Inteiro (Fullscreen) |
| `H` | Esconder / Mostrar Interface (HUD) |
| `T` | Tap Tempo BPM (compasso 4/4) |
| `Espaço` | Pulso manual de impacto |
| `1–9` | Seleção rápida de looks visuais |
| `[` e `]` | Diminuir / Aumentar intensidade |
| `Esc` | Sair do modo AUTO ou ecrã inteiro |

---

## 🛠️ Stack Tecnológica

* **Frontend:** Vanilla JavaScript (ES Modules nativos, sem bundlers ou frameworks pesados).
* **Gráficos:** WebGL2 com shaders GLSL customizados e framebuffers de pós-processamento.
* **Comunicação em Tempo Real:** WebSockets (`ws`) e WebRTC (`RTCPeerConnection`).
* **Backend:** Node.js (servidor dual HTTP + HTTPS com geração automática de certificados locais).
