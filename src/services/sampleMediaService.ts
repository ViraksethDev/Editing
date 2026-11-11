import { MediaAsset } from '../types/editor';

// Helper to generate procedural canvas videos as real WebM/MP4 blobs
export function generateProceduralVideoBlob(
  type: 'sunset' | 'cyber' | 'coffee' | 'fitness' | 'nature',
  durationSec = 5,
  width = 720,
  height = 1280
): Promise<Blob> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    const stream = canvas.captureStream(30);
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = '';
      }
    }

    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    const actualMime = recorder.mimeType || mimeType || 'video/webm';
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: actualMime });
      resolve(blob);
    };

    recorder.start();

    const fps = 30;
    const totalFrames = durationSec * fps;
    let frame = 0;

    const render = () => {
      const t = frame / fps;
      renderProceduralScene(ctx, type, width, height, t);

      frame++;
      if (frame < totalFrames) {
        requestAnimationFrame(render);
      } else {
        recorder.stop();
      }
    };

    render();
  });
}

// Reusable 60 FPS procedural scene renderer for real-time preview and export
export function renderProceduralScene(
  ctx: CanvasRenderingContext2D,
  type: string,
  width: number,
  height: number,
  t: number
): void {
  ctx.clearRect(0, 0, width, height);

  if (type === 'sunset' || type.includes('sunset')) {
    // Sunset gradient
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#1e1b4b');
    grad.addColorStop(0.3, '#701a75');
    grad.addColorStop(0.6, '#ea580c');
    grad.addColorStop(0.85, '#f59e0b');
    grad.addColorStop(1, '#fef08a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Sun
    const sunY = height * 0.65 + Math.sin(t * 0.5) * 20;
    const sunGrad = ctx.createRadialGradient(width / 2, sunY, 10, width / 2, sunY, 180);
    sunGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.8)');
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(width / 2, sunY, 180, 0, Math.PI * 2);
    ctx.fill();

    // Water reflection / horizon
    const waterY = height * 0.72;
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(0, waterY, width, height - waterY);

    // Shimmer lines
    ctx.fillStyle = 'rgba(253, 224, 71, 0.4)';
    for (let i = 0; i < 15; i++) {
      const lineY = waterY + i * 28 + Math.sin(t * 3 + i) * 3;
      const lineWidth = Math.max(20, (15 - i) * 16 + Math.cos(t * 2 + i) * 20);
      ctx.fillRect(width / 2 - lineWidth / 2, lineY, lineWidth, 4);
    }

    // Animated Birds
    ctx.strokeStyle = '#312e81';
    ctx.lineWidth = 3;
    for (let b = 0; b < 3; b++) {
      const bx = ((width * 0.2 + b * 110 + t * 45) % (width + 60)) - 30;
      const by = height * 0.35 + b * 40 + Math.sin(t * 4 + b) * 8;
      ctx.beginPath();
      ctx.moveTo(bx - 12, by);
      ctx.quadraticCurveTo(bx - 6, by - 10 + Math.sin(t * 8) * 5, bx, by);
      ctx.quadraticCurveTo(bx + 6, by - 10 + Math.sin(t * 8) * 5, bx + 12, by);
      ctx.stroke();
    }
  } else if (type === 'cyber' || type.includes('cyber')) {
    // Cyberpunk dark grid & neon
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, width, height);

    // Neon horizon glow
    const horizonY = height * 0.55;
    const glow = ctx.createRadialGradient(width / 2, horizonY, 10, width / 2, horizonY, 350);
    glow.addColorStop(0, 'rgba(236, 72, 153, 0.6)');
    glow.addColorStop(0.5, 'rgba(147, 51, 234, 0.3)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    // Perspective grid lines
    ctx.strokeStyle = '#d946ef';
    ctx.lineWidth = 1.5;
    for (let x = -width; x < width * 2; x += 60) {
      ctx.beginPath();
      ctx.moveTo(width / 2, horizonY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal moving grid lines
    for (let y = 0; y < 12; y++) {
      const depth = (y + ((t * 0.8) % 1)) / 12;
      const lineY = horizonY + Math.pow(depth, 2) * (height - horizonY);
      ctx.strokeStyle = `rgba(6, 182, 212, ${0.2 + depth * 0.7})`;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
    }

    // Neon retro wireframe sun
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(width / 2, horizonY - 40, 110, Math.PI, 0);
    ctx.stroke();
  } else if (type === 'coffee' || type.includes('coffee')) {
    // Cozy cafe warm aesthetics
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#291d17');
    grad.addColorStop(0.5, '#452b1f');
    grad.addColorStop(1, '#1b120c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Cup silhouette
    const cupX = width / 2;
    const cupY = height * 0.6;
    ctx.fillStyle = '#e5d5c5';
    ctx.beginPath();
    ctx.roundRect(cupX - 70, cupY - 40, 140, 100, [0, 0, 30, 30]);
    ctx.fill();

    // Latte art inside
    ctx.fillStyle = '#6b4423';
    ctx.beginPath();
    ctx.ellipse(cupX, cupY - 40, 68, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#faf5ef';
    ctx.beginPath();
    ctx.arc(cupX, cupY - 40, 12 + Math.sin(t * 2) * 2, 0, Math.PI * 2);
    ctx.fill();

    // Rising steam swirls
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 3;
    for (let s = 0; s < 3; s++) {
      const sx = cupX - 30 + s * 30;
      ctx.beginPath();
      ctx.moveTo(sx, cupY - 50);
      for (let step = 0; step < 80; step += 10) {
        const wave = Math.sin((t * 4) + s + step * 0.1) * 14;
        ctx.lineTo(sx + wave, cupY - 50 - step * 2.5);
      }
      ctx.stroke();
    }
  } else if (type === 'fitness' || type.includes('fitness')) {
    // High energy energetic visuals
    const hue = (t * 50) % 360;
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Dynamic sound/beat rings
    for (let r = 0; r < 5; r++) {
      const rad = ((t * 120 + r * 60) % 350) + 30;
      const alpha = 1 - rad / 380;
      ctx.strokeStyle = `hsla(${hue + r * 30}, 90%, 55%, ${alpha})`;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, rad, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Center pulse icon
    const pulse = 1 + Math.sin(t * 8) * 0.15;
    ctx.fillStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(pulse, pulse);
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // Nature forest dust particles & verdant tones
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, '#064e3b');
    grad.addColorStop(0.6, '#022c22');
    grad.addColorStop(1, '#021812');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Floating sunbeam particles
    for (let p = 0; p < 40; p++) {
      const px = ((p * 47 + t * 25) % width);
      const py = ((p * 83 + t * 40) % height);
      const size = (p % 4) + 2;
      ctx.fillStyle = `rgba(167, 243, 208, ${0.3 + 0.4 * Math.sin(t * 3 + p)})`;
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Generate procedurally synthesized audio buffer as WAV Blob
export function generateSynthesizedAudioBlob(
  type: 'lofi' | 'energetic' | 'ambient' | 'sfx_swoosh' | 'sfx_pop' | 'sfx_ding',
  durationSec = 6
): Blob {
  const sampleRate = 44100;
  const numFrames = Math.floor(sampleRate * durationSec);
  const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  const buffer = audioContext.createBuffer(2, numFrames, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  if (type === 'lofi') {
    // Warm lo-fi chords + gentle rhythm
    const chordFrequencies = [261.63, 329.63, 392.0, 523.25]; // C major 7
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      let sample = 0;
      chordFrequencies.forEach((freq, idx) => {
        const beatTime = t % 1.5;
        const envelope = Math.exp(-beatTime * 1.8);
        sample += Math.sin(2 * Math.PI * freq * t + Math.sin(t * 1.5) * 0.1) * envelope * 0.15;
      });
      // Vinyl crackle
      const crackle = Math.random() > 0.992 ? (Math.random() - 0.5) * 0.1 : 0;
      const val = Math.max(-1, Math.min(1, sample + crackle));
      left[i] = val;
      right[i] = val;
    }
  } else if (type === 'energetic') {
    // Upbeat kick & electronic synth arp
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const beat = (t * 2) % 1; // 120 bpm kick
      const kickFreq = 150 * Math.exp(-beat * 25) + 40;
      const kick = Math.sin(2 * Math.PI * kickFreq * beat) * Math.exp(-beat * 6) * 0.4;
      
      // Arpeggio
      const notes = [440, 554.37, 659.25, 880];
      const noteIdx = Math.floor((t * 8) % notes.length);
      const noteFreq = notes[noteIdx];
      const noteBeat = (t * 8) % 1;
      const synth = Math.sin(2 * Math.PI * noteFreq * t) * Math.exp(-noteBeat * 5) * 0.2;

      const val = Math.max(-1, Math.min(1, kick + synth));
      left[i] = val;
      right[i] = val;
    }
  } else if (type === 'sfx_swoosh') {
    // Quick swoosh transition
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const progress = t / durationSec;
      const freq = 1200 * Math.sin(progress * Math.PI) + 100;
      const noise = (Math.random() * 2 - 1) * Math.sin(progress * Math.PI);
      const val = (Math.sin(2 * Math.PI * freq * t) * 0.3 + noise * 0.4) * Math.sin(progress * Math.PI);
      left[i] = val;
      right[i] = val;
    }
  } else if (type === 'sfx_pop') {
    // Bubble pop sound
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      if (t > 0.2) {
        left[i] = 0;
        right[i] = 0;
        continue;
      }
      const freq = 800 - t * 2500;
      const val = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 25);
      left[i] = val;
      right[i] = val;
    }
  } else if (type === 'sfx_ding') {
    // Bell chime ding
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const freq1 = 1760; // A6
      const freq2 = 2640; // E7
      const val = (Math.sin(2 * Math.PI * freq1 * t) * 0.3 + Math.sin(2 * Math.PI * freq2 * t) * 0.15) * Math.exp(-t * 2);
      left[i] = val;
      right[i] = val;
    }
  } else {
    // Ambient calm drone
    for (let i = 0; i < numFrames; i++) {
      const t = i / sampleRate;
      const val = (Math.sin(2 * Math.PI * 130.81 * t) * 0.2 +
                   Math.sin(2 * Math.PI * 196.00 * t) * 0.15 +
                   Math.sin(2 * Math.PI * 261.63 * t) * 0.1) * (0.8 + 0.2 * Math.sin(t * 0.5));
      left[i] = val;
      right[i] = val;
    }
  }

  // Convert AudioBuffer to WAV Blob
  return audioBufferToWavBlob(buffer);
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  let pos = 0;

  function writeString(str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(pos++, str.charCodeAt(i));
    }
  }

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF header
  writeString('RIFF');
  setUint32(length - 8);
  writeString('WAVE');
  writeString('fmt ');
  setUint32(16); // subchunk 1 size
  setUint16(1); // PCM
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample
  writeString('data');
  setUint32(length - pos - 4);

  // Write interleaved PCM samples
  const channels: Float32Array[] = [];
  for (let i = 0; i < numOfChan; i++) {
    channels.push(buffer.getChannelData(i));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numOfChan; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i]));
      out.setInt16(pos, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      pos += 2;
    }
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

// Generate thumbnail image data url for media
export function generateVideoThumbnail(videoElement: HTMLVideoElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  }
  return '';
}

export interface PresetStockItem {
  id: string;
  name: string;
  category: 'video' | 'audio' | 'sfx' | 'sticker' | 'caption';
  type: string;
  duration?: number;
  description: string;
  thumbnailColor: string;
  iconName: string;
}

export const STOCK_VIDEOS_METADATA: PresetStockItem[] = [
  {
    id: 'stock-sunset',
    name: 'Golden Hour Sunset',
    category: 'video',
    type: 'sunset',
    duration: 6,
    description: 'Dreamy ocean sunset with golden reflection and bird flight',
    thumbnailColor: 'from-amber-500 to-purple-800',
    iconName: 'Sun'
  },
  {
    id: 'stock-cyber',
    name: 'Cyberpunk Neon City',
    category: 'video',
    type: 'cyber',
    duration: 6,
    description: 'Futuristic synthwave grid with neon sunset lines',
    thumbnailColor: 'from-fuchsia-600 to-cyan-500',
    iconName: 'Zap'
  },
  {
    id: 'stock-coffee',
    name: 'Aesthetic Coffee Shop',
    category: 'video',
    type: 'coffee',
    duration: 5,
    description: 'Warm cafe ambiance with latte art and rising steam',
    thumbnailColor: 'from-amber-800 to-stone-900',
    iconName: 'Coffee'
  },
  {
    id: 'stock-fitness',
    name: 'High-Energy Pulse',
    category: 'video',
    type: 'fitness',
    duration: 5,
    description: 'Energetic beat pulses and workout motion graphic',
    thumbnailColor: 'from-red-600 to-yellow-500',
    iconName: 'Activity'
  },
  {
    id: 'stock-nature',
    name: 'Emerald Forest Sunbeam',
    category: 'video',
    type: 'nature',
    duration: 6,
    description: 'Serene verdant foliage with dancing light particles',
    thumbnailColor: 'from-emerald-700 to-teal-950',
    iconName: 'Trees'
  }
];

export const STOCK_AUDIO_METADATA: PresetStockItem[] = [
  {
    id: 'audio-lofi',
    name: 'Chill Lo-Fi Afternoon',
    category: 'audio',
    type: 'lofi',
    duration: 8,
    description: 'Warm vinyl chords and relaxed aesthetic beat',
    thumbnailColor: 'from-purple-900 to-indigo-950',
    iconName: 'Headphones'
  },
  {
    id: 'audio-energetic',
    name: 'Viral Dance Electro',
    category: 'audio',
    type: 'energetic',
    duration: 8,
    description: 'Punchy kick with synth arpeggios for dynamic edits',
    thumbnailColor: 'from-pink-600 to-rose-950',
    iconName: 'Music'
  },
  {
    id: 'audio-ambient',
    name: 'Deep Calm Ambience',
    category: 'audio',
    type: 'ambient',
    duration: 8,
    description: 'Meditative peaceful soundscape for cinematic reels',
    thumbnailColor: 'from-sky-900 to-cyan-950',
    iconName: 'Radio'
  },
  {
    id: 'sfx-swoosh',
    name: 'Dynamic Swoosh',
    category: 'sfx',
    type: 'sfx_swoosh',
    duration: 1,
    description: 'Fast whoosh transition sound effect',
    thumbnailColor: 'from-blue-600 to-indigo-900',
    iconName: 'Wind'
  },
  {
    id: 'sfx-pop',
    name: 'Bubble Pop',
    category: 'sfx',
    type: 'sfx_pop',
    duration: 0.5,
    description: 'Crisp tactile pop for sticker and text appearances',
    thumbnailColor: 'from-teal-600 to-emerald-900',
    iconName: 'Sparkles'
  },
  {
    id: 'sfx-ding',
    name: 'Success Bell Chime',
    category: 'sfx',
    type: 'sfx_ding',
    duration: 1.5,
    description: 'Bright pleasant bell ding for highlights',
    thumbnailColor: 'from-amber-500 to-yellow-800',
    iconName: 'Bell'
  }
];

export const INSTAGRAM_STICKER_PRESETS = [
  { id: 'stk-link', title: 'LINK IN BIO', bg: 'bg-gradient-to-r from-purple-600 to-pink-600', text: '🔗 LINK IN BIO' },
  { id: 'stk-new', title: 'NEW POST', bg: 'bg-gradient-to-r from-red-500 via-pink-500 to-yellow-500', text: '✨ NEW POST' },
  { id: 'stk-watch', title: 'WATCH TILL END', bg: 'bg-black/80 border border-white/30', text: '👀 WATCH TO THE END' },
  { id: 'stk-double', title: 'DOUBLE TAP', bg: 'bg-rose-600', text: '❤️ DOUBLE TAP' },
  { id: 'stk-sound', title: 'SOUND ON', bg: 'bg-emerald-600', text: '🔊 SOUND ON' },
  { id: 'stk-question', title: 'ASK ME A QUESTION', bg: 'bg-white text-black', text: '💬 Ask me anything...' },
  { id: 'stk-follow', title: 'FOLLOW FOR MORE', bg: 'bg-gradient-to-r from-blue-600 to-indigo-600', text: '🚀 FOLLOW FOR MORE' },
  { id: 'stk-sale', title: 'LIMITED DROP', bg: 'bg-amber-500 text-black font-extrabold', text: '⚡ LIMITED DROP' }
];

export const EMOJI_STICKER_PRESETS = ['🔥', '✨', '⚡', '💯', '❤️', '🙌', '😍', '👀', '🎯', '🚀', '⭐', '🌈', '🎉', '💥', '🍕', '☕'];
