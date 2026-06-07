const MIN_BPM = 60;
const MAX_BPM = 180;
const DEFAULT_BPM = 120;

function clampBpm(value: number): number {
  let bpm = value;
  while (bpm < MIN_BPM) bpm *= 2;
  while (bpm > MAX_BPM) bpm /= 2;
  return Math.round(Math.min(MAX_BPM, Math.max(MIN_BPM, bpm)));
}

export function detectBpmFromAudioBuffer(buffer: AudioBuffer): number {
  const channel = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const windowSize = Math.max(1, Math.floor(sampleRate * 0.05));
  const energies: number[] = [];

  for (let i = 0; i < channel.length; i += windowSize) {
    let sum = 0;
    const end = Math.min(i + windowSize, channel.length);
    for (let j = i; j < end; j += 1) {
      sum += channel[j] * channel[j];
    }
    energies.push(sum / (end - i));
  }

  if (energies.length < 4) return DEFAULT_BPM;

  const average = energies.reduce((sum, value) => sum + value, 0) / energies.length;
  const threshold = average * 1.35;
  const peaks: number[] = [];

  for (let i = 1; i < energies.length - 1; i += 1) {
    if (energies[i] > threshold && energies[i] > energies[i - 1] && energies[i] > energies[i + 1]) {
      peaks.push(i);
    }
  }

  if (peaks.length < 2) return DEFAULT_BPM;

  const intervals: number[] = [];
  for (let i = 1; i < peaks.length; i += 1) {
    intervals.push(peaks[i] - peaks[i - 1]);
  }

  intervals.sort((a, b) => a - b);
  const medianInterval = intervals[Math.floor(intervals.length / 2)];
  if (!medianInterval) return DEFAULT_BPM;

  const secondsPerBeat = (medianInterval * windowSize) / sampleRate;
  if (!secondsPerBeat) return DEFAULT_BPM;

  return clampBpm(60 / secondsPerBeat);
}

export async function detectBpmFromFile(file: File): Promise<number> {
  if (typeof window === "undefined") return DEFAULT_BPM;

  const arrayBuffer = await file.arrayBuffer();
  const audioContext = new AudioContext();

  try {
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
    return detectBpmFromAudioBuffer(audioBuffer);
  } catch {
    return DEFAULT_BPM;
  } finally {
    await audioContext.close().catch(() => undefined);
  }
}

export function beatIntervalMs(bpm: number, beatsPerSlide: number): number {
  const safeBpm = bpm > 0 ? bpm : DEFAULT_BPM;
  const beats = beatsPerSlide > 0 ? beatsPerSlide : 4;
  return (60_000 / safeBpm) * beats;
}
