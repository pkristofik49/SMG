/* Quiet, locally synthesised effects; the audio context is created only on opt-in. */
(function (root) {
  'use strict';
  root.createArcadeAudio = function () {
    let context = null, enabled = false, revision = 0, slideBuffer = null;
    const voices = new Set();
    function stop() {
      if (!context) return;
      for (const voice of voices) {
        const now = context.currentTime;
        voice.gain.gain.cancelScheduledValues(now);
        voice.gain.gain.setTargetAtTime(0, now, 0.005);
        voice.source.stop(now + 0.025);
      }
    }
    async function setEnabled(value) {
      const currentRevision = ++revision;
      enabled = Boolean(value);
      if (!enabled) { stop(); return false; }
      try {
        const AudioContext = root.AudioContext || root.webkitAudioContext;
        if (!AudioContext) { enabled = false; return false; }
        if (!context) context = new AudioContext();
        if (context.state === 'suspended') await context.resume();
        if (currentRevision !== revision) return enabled;
        enabled = context.state === 'running';
      } catch {
        if (currentRevision === revision) enabled = false;
      }
      return enabled;
    }
    function playSource(source, gain, start, duration, extraNodes = []) {
      const voice = { source, gain };
      voices.add(voice);
      source.onended = () => {
        voices.delete(voice);
        source.disconnect(); gain.disconnect();
        extraNodes.forEach(node => node.disconnect());
      };
      source.start(start);
      source.stop(start + duration + 0.01);
    }
    function slide() {
      if (!enabled || !context || context.state !== 'running' || document.hidden) return;
      const duration = 0.14;
      if (!slideBuffer) {
        slideBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * duration), context.sampleRate);
        const samples = slideBuffer.getChannelData(0);
        // Generate repeatable noise without affecting the game's random tile generator.
        let seed = 0x12345678;
        let smoothSample = 0;
        for (let i = 0; i < samples.length; i++) {
          seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
          const noise = (seed >>> 0) / 2147483648 - 1;
          smoothSample = smoothSample * 0.82 + noise * 0.18;
          samples[i] = smoothSample;
        }
      }
      const start = context.currentTime;
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = slideBuffer;
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(0.5, start);
      filter.frequency.setValueAtTime(1200, start);
      filter.frequency.exponentialRampToValueAtTime(650, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.055, start + 0.035);
      gain.gain.linearRampToValueAtTime(0.025, start + 0.085);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      source.connect(filter); filter.connect(gain); gain.connect(context.destination);
      playSource(source, gain, start, duration, [filter]);
    }
    function tone(frequency, endFrequency, duration, volume, delay = 0, waveform = 'sine') {
      if (!enabled || !context || context.state !== 'running' || document.hidden) return;
      const start = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = waveform;
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(volume, start + 0.008);
      gain.gain.setValueAtTime(volume, start + duration * 0.3);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      playSource(oscillator, gain, start, duration);
    }
    return {
      setEnabled,
      move: slide,
      blocked() {
        stop();
        tone(420, 360, 0.080, 0.120, 0, 'triangle');
        tone(340, 290, 0.080, 0.100, 0.095, 'triangle');
      },
      merge() { tone(420, 380, 0.12, 0.095); tone(630, 570, 0.14, 0.075, 0.035); },
      stop,
      dispose() {
        revision++; enabled = false; stop();
        if (context) { context.close().catch(() => {}); context = null; }
        slideBuffer = null;
      }
    };
  };
})(globalThis);
