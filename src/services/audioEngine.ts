import { AudioClip } from '../types/editor';

class AudioEngineManager {
  private ctx: AudioContext | null = null;
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private activeSources: Map<string, AudioBufferSourceNode> = new Map();
  private gainNodes: Map<string, GainNode> = new Map();
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;
  private volume: number = 1.0;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  async loadAudio(url: string): Promise<AudioBuffer> {
    this.initContext();
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);
    this.audioBuffers.set(url, audioBuffer);
    return audioBuffer;
  }

  getAudioContext(): AudioContext {
    this.initContext();
    return this.ctx!;
  }

  getMasterDestination(): GainNode {
    this.initContext();
    return this.masterGain!;
  }

  setMasterVolume(val: number) {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
    }
  }

  stopAll() {
    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeSources.clear();
    this.gainNodes.clear();
  }

  async syncAndPlayAudioClips(clips: AudioClip[], currentTime: number) {
    this.initContext();
    this.stopAll();

    for (const clip of clips) {
      if (clip.isMuted) continue;

      const clipStart = clip.startTime;
      const clipEnd = clip.startTime + clip.duration;

      // Check if clip is active at current time
      if (currentTime >= clipStart && currentTime < clipEnd) {
        try {
          const buffer = await this.loadAudio(clip.audioUrl);
          if (!this.ctx || !this.masterGain) return;

          const source = this.ctx.createBufferSource();
          source.buffer = buffer;
          source.playbackRate.value = clip.speed || 1;

          const gain = this.ctx.createGain();
          const targetVol = (clip.volume ?? 1);
          
          // Compute fade in and fade out
          const elapsedInClip = currentTime - clipStart;
          const remainingInClip = clipEnd - currentTime;
          let currentVol = targetVol;

          if (clip.fadeIn > 0 && elapsedInClip < clip.fadeIn) {
            currentVol = targetVol * (elapsedInClip / clip.fadeIn);
          } else if (clip.fadeOut > 0 && remainingInClip < clip.fadeOut) {
            currentVol = targetVol * (remainingInClip / clip.fadeOut);
          }

          gain.gain.setValueAtTime(currentVol, this.ctx.currentTime);

          source.connect(gain);
          gain.connect(this.masterGain);

          const offsetInSource = (clip.sourceOffset || 0) + elapsedInClip * (clip.speed || 1);
          const durationToPlay = remainingInClip / (clip.speed || 1);

          source.start(0, Math.max(0, offsetInSource), durationToPlay);

          this.activeSources.set(clip.id, source);
          this.gainNodes.set(clip.id, gain);
        } catch (err) {
          console.warn('Failed to play audio clip:', clip.id, err);
        }
      }
    }
  }

  async playSoundEffect(url: string, volume = 0.8) {
    try {
      this.initContext();
      const buffer = await this.loadAudio(url);
      if (!this.ctx || !this.masterGain) return;
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume * (this.isMuted ? 0 : this.volume), this.ctx.currentTime);
      source.connect(gain);
      gain.connect(this.ctx.destination);
      source.start();
    } catch (e) {
      console.warn('Could not play sfx', e);
    }
  }
}

export const audioEngine = new AudioEngineManager();
