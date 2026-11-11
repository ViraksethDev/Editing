import { TimelineClip } from '../types/editor';

export interface SnapResult {
  snappedTime: number;
  didSnap: boolean;
  snapPoint?: number;
  snapType?: 'clip' | 'playhead' | 'origin' | 'grid';
}

/**
 * Calculates snapped timestamp for moving or trimming clips on timeline
 */
export function calculateSnap(
  targetTime: number,
  clipDuration: number,
  allClips: TimelineClip[],
  currentClipId: string,
  currentTime: number,
  zoom: number,
  gridInterval = 0.5,
  isSnapEnabled = true
): SnapResult {
  if (!isSnapEnabled) {
    return { snappedTime: Math.max(0, targetTime), didSnap: false };
  }

  // Snap tolerance: ~10 pixels converted to seconds
  const thresholdSec = Math.max(0.08, Math.min(0.3, 10 / zoom));
  const targetEndTime = targetTime + clipDuration;

  // 1. Gather high-priority snap targets: 0 origin, playhead, and other clips' boundaries
  const keyTargets: { time: number; type: 'origin' | 'playhead' | 'clip' }[] = [
    { time: 0, type: 'origin' },
    { time: currentTime, type: 'playhead' }
  ];

  for (const c of allClips) {
    if (c.id === currentClipId) continue;
    keyTargets.push({ time: c.startTime, type: 'clip' });
    keyTargets.push({ time: c.startTime + c.duration, type: 'clip' });
  }

  // Check start edge against key targets
  let bestDist = thresholdSec;
  let snappedTime = targetTime;
  let didSnap = false;
  let snapPoint: number | undefined;
  let snapType: 'clip' | 'playhead' | 'origin' | 'grid' | undefined;

  for (const target of keyTargets) {
    const distStart = Math.abs(targetTime - target.time);
    if (distStart < bestDist) {
      bestDist = distStart;
      snappedTime = target.time;
      didSnap = true;
      snapPoint = target.time;
      snapType = target.type;
    }

    // Check end edge against key targets
    const distEnd = Math.abs(targetEndTime - target.time);
    if (distEnd < bestDist) {
      bestDist = distEnd;
      snappedTime = target.time - clipDuration;
      didSnap = true;
      snapPoint = target.time;
      snapType = target.type;
    }
  }

  // 2. If no key targets matched, snap to grid interval lines (e.g. 0.5s or 1.0s)
  if (!didSnap && gridInterval > 0) {
    const nearestGridStart = Math.round(targetTime / gridInterval) * gridInterval;
    const distGridStart = Math.abs(targetTime - nearestGridStart);

    if (distGridStart < thresholdSec) {
      return {
        snappedTime: Math.max(0, nearestGridStart),
        didSnap: true,
        snapPoint: nearestGridStart,
        snapType: 'grid'
      };
    }

    const nearestGridEnd = Math.round(targetEndTime / gridInterval) * gridInterval;
    const distGridEnd = Math.abs(targetEndTime - nearestGridEnd);

    if (distGridEnd < thresholdSec) {
      return {
        snappedTime: Math.max(0, nearestGridEnd - clipDuration),
        didSnap: true,
        snapPoint: nearestGridEnd,
        snapType: 'grid'
      };
    }
  }

  return {
    snappedTime: Math.max(0, snappedTime),
    didSnap,
    snapPoint,
    snapType
  };
}

/**
 * Calculates snapped timestamp specifically for trimming an edge
 */
export function calculateTrimSnap(
  targetTime: number,
  allClips: TimelineClip[],
  currentClipId: string,
  currentTime: number,
  zoom: number,
  gridInterval = 0.5,
  isSnapEnabled = true
): SnapResult {
  if (!isSnapEnabled) {
    return { snappedTime: Math.max(0, targetTime), didSnap: false };
  }

  const thresholdSec = Math.max(0.08, Math.min(0.3, 10 / zoom));
  const keyTargets: { time: number; type: 'origin' | 'playhead' | 'clip' }[] = [
    { time: 0, type: 'origin' },
    { time: currentTime, type: 'playhead' }
  ];

  for (const c of allClips) {
    if (c.id === currentClipId) continue;
    keyTargets.push({ time: c.startTime, type: 'clip' });
    keyTargets.push({ time: c.startTime + c.duration, type: 'clip' });
  }

  let bestDist = thresholdSec;
  let snappedTime = targetTime;
  let didSnap = false;
  let snapPoint: number | undefined;
  let snapType: 'clip' | 'playhead' | 'origin' | 'grid' | undefined;

  for (const target of keyTargets) {
    const dist = Math.abs(targetTime - target.time);
    if (dist < bestDist) {
      bestDist = dist;
      snappedTime = target.time;
      didSnap = true;
      snapPoint = target.time;
      snapType = target.type;
    }
  }

  if (!didSnap && gridInterval > 0) {
    const nearestGrid = Math.round(targetTime / gridInterval) * gridInterval;
    if (Math.abs(targetTime - nearestGrid) < thresholdSec) {
      return {
        snappedTime: Math.max(0, nearestGrid),
        didSnap: true,
        snapPoint: nearestGrid,
        snapType: 'grid'
      };
    }
  }

  return {
    snappedTime: Math.max(0, snappedTime),
    didSnap,
    snapPoint,
    snapType
  };
}
