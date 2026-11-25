import { useMemo } from 'react';
import type { Language, SkillControllerPayload, SkillSummary } from '../types/api';
import { ControllerTrainerStage } from '../modules/gamepad/sdk/ControllerTrainerStage';
import type { DemoPreset, DeviceType } from '../modules/gamepad/types/trainer';

interface ControllerGuideStageProps {
  skill: SkillSummary;
  controllerPayload: SkillControllerPayload | null;
  language: Language;
  device: DeviceType;
  mode: 'demo' | 'practice';
  onChangeDevice: (device: DeviceType) => void;
  onChangeMode: (mode: 'demo' | 'practice') => void;
}

/**
 * 100% API-driven Petros-gamepad 3D WebGL Controller Trainer Stage.
 * Strict hidden-until-ready: returns null until API controllerPayload.sequences is ready.
 */
export function ControllerGuideStage({
  skill,
  controllerPayload,
  device,
  mode,
  onChangeDevice,
}: ControllerGuideStageProps) {
  const sequences = controllerPayload?.sequences ?? null;

  const skillPresets = useMemo<Partial<Record<DeviceType, DemoPreset[]>>>(() => {
    if (!sequences) return {};
    const devices: DeviceType[] = ['ps5', 'xbox', 'pc', 'ipad'];
    const map: Partial<Record<DeviceType, DemoPreset[]>> = {};
    for (const dev of devices) {
      const seq = sequences[dev];
      if (!seq) continue;
      map[dev] = [
        {
          id: `${skill.id}-${dev}`,
          shortLabel: `${skill.code} · ${seq.title}`,
          sequence: seq,
        },
      ];
    }
    return map;
  }, [sequences, skill.id, skill.code]);

  if (!sequences) {
    return null;
  }

  return (
    <div
      data-testid="controller-guide-stage"
      data-device={device}
      data-skill-id={skill.id}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-[#090C12]"
    >
      <ControllerTrainerStage
        initialDevice={device}
        initialMode={mode}
        sequences={sequences}
        models={controllerPayload?.models}
        presets={skillPresets}
        autoPlay={true}
        onDeviceChange={onChangeDevice}
        className="h-full w-full"
      />
    </div>
  );
}
