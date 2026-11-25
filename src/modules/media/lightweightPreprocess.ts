/**
 * Lightweight client-side TV/Monitor pre-pass for user-uploaded photos and short videos.
 * Performs downscaling, contrast enhancement, optional screen-crop, and video keyframe
 * selection strictly in browser memory without retaining heavy video files locally.
 */

import type {
  LightweightKeyframe,
  LightweightMediaPayload,
  ScreenCropPresetId,
  ScreenCropRect,
} from '../../types/api';

export const MAX_IMAGE_EDGE_PX = 960;
export const MAX_VIDEO_FRAME_EDGE_PX = 640;
export const IMAGE_JPEG_QUALITY = 0.78;
export const VIDEO_FRAME_JPEG_QUALITY = 0.72;
export const DEFAULT_TV_CONTRAST_FACTOR = 1.18;

export interface PreprocessOptions {
  contrastEnhanced?: boolean;
  cropPreset?: ScreenCropPresetId;
  cropRect?: ScreenCropRect;
  maxEdgePx?: number;
}

export function getCropRectForPreset(
  preset: ScreenCropPresetId,
  sourceWidth: number,
  sourceHeight: number,
): ScreenCropRect {
  if (preset === 'center-focus') {
    return { x: 0.16, y: 0.16, w: 0.68, h: 0.68 };
  }
  if (preset === 'tv-16-9') {
    // Center 16:9 TV screen crop inside a phone photo (typically 4:3 or 9:16 portrait)
    const safeW = Math.max(1, sourceWidth);
    const safeH = Math.max(1, sourceHeight);
    const targetAspect = 16 / 9;
    const currentAspect = safeW / safeH;
    if (currentAspect < targetAspect) {
      // Portrait or 4:3 photo -> trim top & bottom glare/bezel to isolate 16:9 TV
      const cropH = Math.min(0.86, (safeW / targetAspect) / safeH);
      const cropW = 0.92;
      return {
        x: Number(((1 - cropW) / 2).toFixed(4)),
        y: Number(((1 - cropH) / 2).toFixed(4)),
        w: Number(cropW.toFixed(4)),
        h: Number(cropH.toFixed(4)),
      };
    }
    const cropW = Math.min(0.9, (safeH * targetAspect) / safeW);
    return {
      x: Number(((1 - cropW) / 2).toFixed(4)),
      y: 0.06,
      w: Number(cropW.toFixed(4)),
      h: 0.88,
    };
  }
  return { x: 0, y: 0, w: 1, h: 1 };
}

export function computeTargetDimensions(
  sourceWidth: number,
  sourceHeight: number,
  maxEdge: number,
): { width: number; height: number } {
  const safeW = Math.max(1, Math.round(sourceWidth));
  const safeH = Math.max(1, Math.round(sourceHeight));
  const longest = Math.max(safeW, safeH);
  if (longest <= maxEdge) {
    return { width: safeW, height: safeH };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(safeW * scale)),
    height: Math.max(1, Math.round(safeH * scale)),
  };
}

/**
 * Pure RGBA pixel-buffer contrast enhancement pass tuned for photographed TV/monitor screens.
 * Lifts dimmed symbols/glyphs against room glare without clipping highlights.
 */
export function applyTvContrastPass(
  rgba: Uint8ClampedArray,
  contrastFactor = DEFAULT_TV_CONTRAST_FACTOR,
): Uint8ClampedArray {
  if (contrastFactor === 1) return rgba;
  const midpoint = 128;
  for (let i = 0; i < rgba.length; i += 4) {
    rgba[i] = Math.min(255, Math.max(0, Math.round((rgba[i] - midpoint) * contrastFactor + midpoint)));
    rgba[i + 1] = Math.min(
      255,
      Math.max(0, Math.round((rgba[i + 1] - midpoint) * contrastFactor + midpoint)),
    );
    rgba[i + 2] = Math.min(
      255,
      Math.max(0, Math.round((rgba[i + 2] - midpoint) * contrastFactor + midpoint)),
    );
  }
  return rgba;
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const commaIdx = dataUrl.indexOf(',');
  const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
  return Math.round((base64.length * 3) / 4);
}

function drawPreprocessedFrame(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  cropRect: ScreenCropRect,
  maxEdge: number,
  contrastEnhanced: boolean,
  quality: number,
): { width: number; height: number; dataUrl: string; approxBytes: number } {
  const sx = Math.max(0, Math.round(cropRect.x * sourceWidth));
  const sy = Math.max(0, Math.round(cropRect.y * sourceHeight));
  const sw = Math.max(1, Math.round(cropRect.w * sourceWidth));
  const sh = Math.max(1, Math.round(cropRect.h * sourceHeight));

  const target = computeTargetDimensions(sw, sh, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: contrastEnhanced });
  if (!ctx) throw new Error('Canvas 2D context unavailable.');

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, target.width, target.height);

  if (contrastEnhanced) {
    try {
      const imageData = ctx.getImageData(0, 0, target.width, target.height);
      applyTvContrastPass(imageData.data, DEFAULT_TV_CONTRAST_FACTOR);
      ctx.putImageData(imageData, 0, 0);
    } catch {
      // Fallback gracefully if canvas pixels are unreadable
    }
  }

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return {
    width: target.width,
    height: target.height,
    dataUrl,
    approxBytes: estimateDataUrlBytes(dataUrl),
  };
}

/** Downscales, crops, and contrast-enhances an uploaded TV/monitor photo in browser memory. */
export async function preprocessImageFile(
  file: File,
  options: PreprocessOptions = {},
): Promise<LightweightMediaPayload> {
  const contrastEnhanced = options.contrastEnhanced ?? true;
  const cropPreset = options.cropPreset ?? 'full';
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not decode uploaded image.'));
      el.src = objectUrl;
    });

    const natW = img.naturalWidth || img.width;
    const natH = img.naturalHeight || img.height;
    const cropRect = options.cropRect ?? getCropRectForPreset(cropPreset, natW, natH);

    const frame = drawPreprocessedFrame(
      img,
      natW,
      natH,
      cropRect,
      options.maxEdgePx ?? MAX_IMAGE_EDGE_PX,
      contrastEnhanced,
      IMAGE_JPEG_QUALITY,
    );

    return {
      mediaType: 'image',
      fileName: file.name,
      mimeType: 'image/jpeg',
      originalBytes: file.size,
      processedBytes: frame.approxBytes,
      width: frame.width,
      height: frame.height,
      contrastEnhanced,
      cropPreset,
      cropRect,
      keyframes: [
        {
          timestampSec: 0,
          width: frame.width,
          height: frame.height,
          dataUrl: frame.dataUrl,
          approxBytes: frame.approxBytes,
        },
      ],
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Extracts 3 lightweight keyframe candidates (with optional crop + TV contrast enhancement)
 * from a short video strictly in memory and revokes the temporary objectURL immediately
 * so zero heavy video files are retained locally.
 */
export async function preprocessVideoFile(
  file: File,
  options: PreprocessOptions = {},
): Promise<LightweightMediaPayload> {
  const contrastEnhanced = options.contrastEnhanced ?? true;
  const cropPreset = options.cropPreset ?? 'full';
  const objectUrl = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'metadata';
  video.muted = true;
  video.playsInline = true;

  try {
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(new Error('Timed out reading video metadata.')),
        10000,
      );
      video.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve();
      };
      video.onerror = () => {
        window.clearTimeout(timeout);
        reject(new Error('Could not decode uploaded video metadata.'));
      };
      video.src = objectUrl;
    });

    const durationSec = Number.isFinite(video.duration) ? video.duration : 0;
    const vidW = video.videoWidth || 640;
    const vidH = video.videoHeight || 360;
    const cropRect = options.cropRect ?? getCropRectForPreset(cropPreset, vidW, vidH);

    const sampleFractions = durationSec >= 2 ? [0.15, 0.5, 0.82] : [0];
    const keyframes: LightweightKeyframe[] = [];

    for (const frac of sampleFractions) {
      const ts = Math.max(0, Math.min(Math.max(0, durationSec - 0.1), durationSec * frac));
      await new Promise<void>((resolve) => {
        const timeout = window.setTimeout(() => resolve(), 2500);
        video.onseeked = () => {
          window.clearTimeout(timeout);
          resolve();
        };
        try {
          video.currentTime = ts;
        } catch {
          window.clearTimeout(timeout);
          resolve();
        }
      });

      const frame = drawPreprocessedFrame(
        video,
        vidW,
        vidH,
        cropRect,
        options.maxEdgePx ?? MAX_VIDEO_FRAME_EDGE_PX,
        contrastEnhanced,
        VIDEO_FRAME_JPEG_QUALITY,
      );

      keyframes.push({
        timestampSec: Number(ts.toFixed(2)),
        width: frame.width,
        height: frame.height,
        dataUrl: frame.dataUrl,
        approxBytes: frame.approxBytes,
      });
    }

    const processedBytes = keyframes.reduce((sum, kf) => sum + kf.approxBytes, 0);
    const first = keyframes[0];

    return {
      mediaType: 'video',
      fileName: file.name,
      mimeType: file.type || 'video/mp4',
      originalBytes: file.size,
      processedBytes,
      width: first?.width ?? 640,
      height: first?.height ?? 360,
      durationSec: Number(durationSec.toFixed(2)),
      contrastEnhanced,
      cropPreset,
      cropRect,
      keyframes,
    };
  } finally {
    video.removeAttribute('src');
    video.load();
    URL.revokeObjectURL(objectUrl);
  }
}

export async function preprocessUploadedMedia(
  file: File,
  options: PreprocessOptions = {},
): Promise<LightweightMediaPayload> {
  if (file.type.startsWith('image/')) {
    return preprocessImageFile(file, options);
  }
  return preprocessVideoFile(file, options);
}
