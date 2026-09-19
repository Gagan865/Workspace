// Tiny Web Audio chime generator — a distinct two-note tone per teammate, so a
// notification's sound tells you who acted. No audio files needed.
let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

// A pleasant spread of notes; each teammate maps to one by their colour index.
const NOTES = [
  523.25, 587.33, 659.25, 698.46, 783.99, 880.0, 987.77, 1046.5, 1174.66, 1318.51, 1396.91, 1567.98,
];

export function playChime(seed: number) {
  const c = getCtx();
  if (!c) return;
  const idx = ((seed % NOTES.length) + NOTES.length) % NOTES.length;
  const base = NOTES[idx]!;
  const wave: OscillatorType = seed % 2 === 0 ? "sine" : "triangle";
  const now = c.currentTime;
  [base, base * 1.5].forEach((freq, i) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = wave;
    osc.frequency.value = freq;
    const t = now + i * 0.12;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

// Browsers block audio until a user gesture — resume the context on first click.
export function armAudio() {
  if (typeof window === "undefined") return;
  const resume = () => {
    getCtx();
    window.removeEventListener("pointerdown", resume);
  };
  window.addEventListener("pointerdown", resume, { once: true });
}
