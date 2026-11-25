import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { subscribeAssetUpdates } from '../engine/assetResolver';
import type { AttachmentSlot, StageCommand, StageMode } from '../engine/types';
import { createBasketballMemory, renderBasketballStage } from './basketballRenderer';
import { createFootballMemory, renderFootballStage } from './footballRenderer';
import { createMapMemory, renderMapStage } from './mapRenderer';
import { easeOutCubic } from './math';
import { createStrategyMemory, renderStrategyStage } from './strategyRenderer';
import { renderWeaponStage, type WeaponPinHitbox } from './weaponRenderer';

interface TacticalCanvasProps {
  command: StageCommand;
  isPlaying: boolean;
  replayNonce: number;
  onCycleWeaponSlot?: (slot: AttachmentSlot) => void;
}

export function TacticalCanvas({
  command,
  isPlaying,
  replayNonce,
  onCycleWeaponSlot,
}: TacticalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const commandRef = useRef<StageCommand>(command);
  const isPlayingRef = useRef<boolean>(isPlaying);
  const prevModeRef = useRef<StageMode>(command.mode);
  const transitionStartRef = useRef<number>(performance.now());
  const simTimeRef = useRef<number>(0);
  const kickLoopRef = useRef<(() => void) | null>(null);
  const drawOnceRef = useRef<(() => void) | null>(null);
  const pointerNormRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const weaponHitboxesRef = useRef<WeaponPinHitbox[]>([]);
  const [hoveredSlot, setHoveredSlot] = useState<AttachmentSlot | null>(null);

  useEffect(() => {
    const modeChanged = prevModeRef.current !== command.mode;
    commandRef.current = command;
    if (modeChanged) {
      prevModeRef.current = command.mode;
      transitionStartRef.current = performance.now();
      simTimeRef.current = 0;
      weaponHitboxesRef.current = [];
      setHoveredSlot(null);
    } else {
      // Allow smooth interpolation settle after intra-mode preset change
      transitionStartRef.current = performance.now();
    }
    kickLoopRef.current?.();
  }, [command]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      kickLoopRef.current?.();
    }
  }, [isPlaying]);

  useEffect(() => {
    simTimeRef.current = 0;
    transitionStartRef.current = performance.now();
    kickLoopRef.current?.();
  }, [replayNonce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const footballMemory = createFootballMemory();
    const basketballMemory = createBasketballMemory();
    const mapMemory = createMapMemory();
    const strategyMemory = createStrategyMemory();

    let width = container.clientWidth || 1280;
    let height = container.clientHeight || 720;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    let rafId = 0;
    let timerId = 0;
    let running = false;
    let disposed = false;
    let lastFrame = performance.now();

    const drawSingleFrame = (now: number) => {
      const frameStart = performance.now();
      const dt = Math.min(0.05, Math.max(0.001, (now - lastFrame) / 1000));
      lastFrame = now;

      if (isPlayingRef.current) {
        simTimeRef.current += dt;
      }

      const cmd = commandRef.current;
      const morphElapsed = (now - transitionStartRef.current) / 420;
      const morphProgress = easeOutCubic(Math.min(1, morphElapsed));

      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      if (morphProgress < 1) {
        const scale = 0.968 + 0.032 * morphProgress;
        ctx.globalAlpha = 0.4 + 0.6 * morphProgress;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale, scale);
        ctx.translate(-width / 2, -height / 2);
      }

      if (cmd.mode === 'football') {
        weaponHitboxesRef.current = [];
        renderFootballStage(
          ctx,
          width,
          height,
          cmd.payload,
          footballMemory,
          simTimeRef.current,
          dt,
        );
      } else if (cmd.mode === 'basketball') {
        weaponHitboxesRef.current = [];
        renderBasketballStage(
          ctx,
          width,
          height,
          cmd.payload,
          basketballMemory,
          simTimeRef.current,
          dt,
        );
      } else if (cmd.mode === 'weapon') {
        weaponHitboxesRef.current = renderWeaponStage(
          ctx,
          width,
          height,
          cmd.payload,
          simTimeRef.current,
          pointerNormRef.current,
        );
      } else if (cmd.mode === 'map') {
        weaponHitboxesRef.current = [];
        renderMapStage(ctx, width, height, cmd.payload, mapMemory, simTimeRef.current, dt);
      } else if (cmd.mode === 'strategy') {
        weaponHitboxesRef.current = [];
        renderStrategyStage(
          ctx,
          width,
          height,
          cmd.payload,
          strategyMemory,
          simTimeRef.current,
          dt,
        );
      }

      ctx.restore();

      const drawMs = performance.now() - frameStart;
      const settling = morphElapsed < 1.8;

      if (!disposed && (isPlayingRef.current || settling)) {
        // Native 60fps on hardware GPUs; brief yield on slow software compositors
        if (drawMs > 10) {
          timerId = window.setTimeout(() => {
            if (!disposed) rafId = window.requestAnimationFrame(drawSingleFrame);
          }, 28);
        } else {
          rafId = window.requestAnimationFrame(drawSingleFrame);
        }
      } else {
        running = false;
      }
    };

    const kickLoop = () => {
      if (disposed || running) return;
      running = true;
      lastFrame = performance.now();
      rafId = window.requestAnimationFrame(drawSingleFrame);
    };

    const drawOnce = () => {
      if (disposed) return;
      if (running) return;
      drawSingleFrame(performance.now());
    };

    kickLoopRef.current = kickLoop;
    drawOnceRef.current = drawOnce;

    const unsubscribeAssets = subscribeAssetUpdates(() => {
      if (disposed) return;
      if (isPlayingRef.current) {
        kickLoop();
      } else {
        drawOnce();
      }
    });

    const resize = () => {
      width = Math.max(240, container.clientWidth);
      height = Math.max(180, container.clientHeight);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      if (!running) {
        drawSingleFrame(performance.now());
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    kickLoop();

    return () => {
      disposed = true;
      kickLoopRef.current = null;
      drawOnceRef.current = null;
      unsubscribeAssets();
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      ro.disconnect();
    };
  }, []);

  const findHitSlot = (e: MouseEvent<HTMLCanvasElement>): AttachmentSlot | null => {
    if (commandRef.current.mode !== 'weapon') return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (const box of weaponHitboxesRef.current) {
      const dx = x - box.x;
      const dy = y - box.y;
      if (dx * dx + dy * dy <= (box.radius + 8) * (box.radius + 8)) {
        return box.slot;
      }
    }
    return null;
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      pointerNormRef.current = {
        x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
        y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
      };
      if (commandRef.current.mode === 'weapon' && !isPlayingRef.current) {
        drawOnceRef.current?.();
      }
    }
    const hit = findHitSlot(e);
    if (hit !== hoveredSlot) {
      setHoveredSlot(hit);
    }
  };

  const handleMouseLeave = () => {
    pointerNormRef.current = { x: 0, y: 0 };
    if (hoveredSlot !== null) setHoveredSlot(null);
    if (commandRef.current.mode === 'weapon' && !isPlayingRef.current) {
      drawOnceRef.current?.();
    }
  };

  const handleClick = (e: MouseEvent<HTMLCanvasElement>) => {
    const hit = findHitSlot(e);
    if (hit && onCycleWeaponSlot) {
      onCycleWeaponSlot(hit);
    }
  };

  return (
    <div
      ref={containerRef}
      data-testid="tactical-stage-container"
      data-mode={command.mode}
      data-title={command.title}
      data-playing={isPlaying ? 'true' : 'false'}
      className="relative h-full w-full overflow-hidden select-none"
    >
      <canvas
        ref={canvasRef}
        data-testid="tactical-stage-canvas"
        aria-label={`Interactive tactical motion stage showing ${command.title}`}
        title={hoveredSlot ? `Click to cycle ${hoveredSlot} attachment` : undefined}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        className={`block h-full w-full ${hoveredSlot ? 'cursor-pointer' : 'cursor-default'}`}
      />
    </div>
  );
}
