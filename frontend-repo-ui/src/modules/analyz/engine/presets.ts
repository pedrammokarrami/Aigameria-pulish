import type {
  AttachmentSlot,
  WeaponAttachment,
  WeaponChassisId,
  WeaponStats,
} from './types';

/* ─── Weapon Base Stats & Modular Attachment Math Helpers ──────────────── */
export const WEAPON_BASE_STATS: Record<
  WeaponChassisId,
  {
    base: WeaponStats;
  }
> = {
  m4a1: {
    base: { damage: 64, accuracy: 68, fireRate: 74, mobility: 66, control: 65 },
  },
  vx9: {
    base: { damage: 48, accuracy: 56, fireRate: 92, mobility: 86, control: 62 },
  },
  m200: {
    base: { damage: 94, accuracy: 88, fireRate: 28, mobility: 38, control: 58 },
  },
};

export const ATTACHMENT_CATALOG: Record<AttachmentSlot, WeaponAttachment[]> = {
  optic: [
    {
      id: 'holo-exps3',
      name: 'EXPS3 Holographic',
      slot: 'optic',
      variant: 'holo',
      statDelta: { accuracy: 7, mobility: -1 },
      calloutNote: '1.0x Parallax-Free',
    },
    {
      id: 'reflex-micro',
      name: 'Micro Reflex Sight',
      slot: 'optic',
      variant: 'reflex',
      statDelta: { accuracy: 4, mobility: 3 },
      calloutNote: 'Fast ADS Acquisition',
    },
    {
      id: 'acog-4x',
      name: 'TA31 4x Optical',
      slot: 'optic',
      variant: 'acog',
      statDelta: { accuracy: 12, control: 3, mobility: -5 },
      calloutNote: 'Mid-Range BDC Reticle',
    },
    {
      id: 'sniper-8x',
      name: 'Nightforce 8x Variable',
      slot: 'optic',
      variant: 'scope',
      statDelta: { accuracy: 10, damage: 3, mobility: -7 },
      calloutNote: 'Zero-Stop Elevation',
    },
  ],
  muzzle: [
    {
      id: 'suppressor-mono',
      name: 'Monolithic Suppressor',
      slot: 'muzzle',
      variant: 'suppressor',
      statDelta: { damage: 4, accuracy: 6, control: 5, mobility: -4 },
      calloutNote: 'Sound & Velocity Boost',
    },
    {
      id: 'comp-ported',
      name: 'Ported Compensator',
      slot: 'muzzle',
      variant: 'compensator',
      statDelta: { control: 10, accuracy: 3, mobility: -1 },
      calloutNote: 'Vertical Climb Reduction',
    },
    {
      id: 'brake-heavy',
      name: 'Tri-Chamber Brake',
      slot: 'muzzle',
      variant: 'brake',
      statDelta: { control: 12, damage: 2, mobility: -4 },
      calloutNote: 'High-Caliber Recoil Vent',
    },
  ],
  barrel: [
    {
      id: 'barrel-fluted',
      name: '14.5" Corvus Custom',
      slot: 'barrel',
      variant: 'standard',
      statDelta: { damage: 5, accuracy: 5, mobility: -2 },
      calloutNote: 'Meta Range & Velocity',
    },
    {
      id: 'barrel-cqb',
      name: '7.5" CQB Shroud',
      slot: 'barrel',
      variant: 'short',
      statDelta: { mobility: 8, fireRate: 4, accuracy: -4 },
      calloutNote: 'Close-Quarters Handling',
    },
    {
      id: 'barrel-match',
      name: '26" Match Free-Float',
      slot: 'barrel',
      variant: 'long',
      statDelta: { damage: 6, accuracy: 9, control: 4, mobility: -8 },
      calloutNote: 'Sub-MOA Rifling',
    },
  ],
  underbarrel: [
    {
      id: 'grip-angled',
      name: 'Commando Foregrip',
      slot: 'underbarrel',
      variant: 'angled',
      statDelta: { mobility: 4, control: 6 },
      calloutNote: 'Recoil Stabilization',
    },
    {
      id: 'grip-vertical',
      name: 'Merc Vertical Grip',
      slot: 'underbarrel',
      variant: 'vertical',
      statDelta: { control: 11, accuracy: 3, mobility: -3 },
      calloutNote: 'Sustained Burst Control',
    },
    {
      id: 'bipod-tactical',
      name: 'Carbon Tactical Bipod',
      slot: 'underbarrel',
      variant: 'bipod',
      statDelta: { accuracy: 8, control: 10, mobility: -6 },
      calloutNote: 'Prone Recoil Anchor',
    },
  ],
  magazine: [
    {
      id: 'mag-40rd',
      name: '60-Rd Polymer Mag',
      slot: 'magazine',
      variant: 'extended',
      statDelta: { fireRate: 2, mobility: -2 },
      calloutNote: 'Squad Wipe Capacity',
    },
    {
      id: 'mag-50drum',
      name: '50-Rd Compact Drum',
      slot: 'magazine',
      variant: 'drum',
      statDelta: { fireRate: 3, mobility: -6, control: 2 },
      calloutNote: 'High-Capacity Suppress',
    },
    {
      id: 'mag-match7',
      name: '7-Rd Match AP Mag',
      slot: 'magazine',
      variant: 'compact',
      statDelta: { damage: 4, accuracy: 3, mobility: 2 },
      calloutNote: 'Armor-Piercing Load',
    },
  ],
  stock: [
    {
      id: 'stock-crane',
      name: 'Tactical Crane Stock',
      slot: 'stock',
      variant: 'crane',
      statDelta: { control: 6, accuracy: 3, mobility: 1 },
      calloutNote: 'Ergonomic Cheek Weld',
    },
    {
      id: 'stock-skeleton',
      name: 'Folding Skeleton Stock',
      slot: 'stock',
      variant: 'skeleton',
      statDelta: { mobility: 9, control: -2 },
      calloutNote: 'Ultralight Sprint-to-Fire',
    },
    {
      id: 'stock-precision',
      name: 'Precision Cheek Rest',
      slot: 'stock',
      variant: 'heavy',
      statDelta: { accuracy: 6, control: 8, mobility: -5 },
      calloutNote: 'Weighted Recoil Damper',
    },
  ],
};

export function calculateWeaponStats(
  chassis: WeaponChassisId,
  attachments: Record<AttachmentSlot, WeaponAttachment>,
): WeaponStats {
  const base = WEAPON_BASE_STATS[chassis]?.base ?? WEAPON_BASE_STATS.m4a1.base;
  const sum: WeaponStats = { ...base };
  (Object.keys(attachments) as AttachmentSlot[]).forEach((slot) => {
    const delta = attachments[slot]?.statDelta;
    if (!delta) return;
    if (delta.damage) sum.damage += delta.damage;
    if (delta.accuracy) sum.accuracy += delta.accuracy;
    if (delta.fireRate) sum.fireRate += delta.fireRate;
    if (delta.mobility) sum.mobility += delta.mobility;
    if (delta.control) sum.control += delta.control;
  });
  return {
    damage: Math.max(5, Math.min(100, Math.round(sum.damage))),
    accuracy: Math.max(5, Math.min(100, Math.round(sum.accuracy))),
    fireRate: Math.max(5, Math.min(100, Math.round(sum.fireRate))),
    mobility: Math.max(5, Math.min(100, Math.round(sum.mobility))),
    control: Math.max(5, Math.min(100, Math.round(sum.control))),
  };
}
