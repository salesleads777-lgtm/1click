/**
 * Web Audio API synthesizer for luxury live lead notification chimes
 * Zero external audio files required - works completely offline and instantly
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playLiveLeadChime(volume = 0.6) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic multi-tone executive chime: high sparkle + warm gold fundamental tone
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.45, now);
    masterGain.connect(ctx.destination);

    // Tone 1: High crisp bell (880 Hz -> A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1046.5, now + 0.08); // slide to C6
    gain1.gain.setValueAtTime(0.7, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc1.connect(gain1);
    gain1.connect(masterGain);

    // Tone 2: Gold harmonic sparkle (1318.5 Hz -> E6)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1318.5, now + 0.06);
    gain2.gain.setValueAtTime(0.0, now);
    gain2.gain.setValueAtTime(0.6, now + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
    osc2.connect(gain2);
    gain2.connect(masterGain);

    // Tone 3: Rich executive resolution chime (1760 Hz -> A6)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(1760, now + 0.14);
    gain3.gain.setValueAtTime(0.0, now);
    gain3.gain.setValueAtTime(0.5, now + 0.14);
    gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.1);
    osc3.connect(gain3);
    gain3.connect(masterGain);

    osc1.start(now);
    osc1.stop(now + 0.7);

    osc2.start(now + 0.06);
    osc2.stop(now + 0.9);

    osc3.start(now + 0.14);
    osc3.stop(now + 1.2);
  } catch (e) {
    console.warn('Audio playback error', e);
  }
}
