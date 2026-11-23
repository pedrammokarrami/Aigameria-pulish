/**
 * Gamepad / controller button tutorial data — adapted from the user's
 * Petros-gamepad repo (آسترو ترینر سه‌بعدی) with English twins added for the
 * zero-Persian-in-English-UI mandate. Grouped reference for the coach-room
 * bottom tutorial dock.
 */

export type GamepadDeviceId = 'ps5' | 'xbox' | 'pc';

export interface GamepadPlatformMeta {
  id: GamepadDeviceId;
  brandName: string;
  subtitleFa: string;
  subtitleEn: string;
  accentHex: string;
}

export interface GamepadButtonSpec {
  id: string;
  labelFa: string;
  labelEn: string;
  groupFa: string;
  groupEn: string;
}

export const GAMEPAD_PLATFORMS: GamepadPlatformMeta[] = [
  { id: 'ps5', brandName: 'PS5', subtitleFa: 'دسته DualSense', subtitleEn: 'DualSense controller', accentHex: '#38bdf8' },
  { id: 'xbox', brandName: 'Xbox', subtitleFa: 'دسته Series X', subtitleEn: 'Series X controller', accentHex: '#4ade80' },
  { id: 'pc', brandName: 'KB & Mouse', subtitleFa: 'کیبورد و ماوس', subtitleEn: 'Keyboard & mouse', accentHex: '#a78bfa' },
];

export const GAMEPAD_BUTTONS: Record<GamepadDeviceId, GamepadButtonSpec[]> = {
  ps5: [
    { id: 'BTN_CROSS', labelFa: 'ضربدر (Cross)', labelEn: 'Cross ✕', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_CIRCLE', labelFa: 'دایره (Circle)', labelEn: 'Circle ◯', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_SQUARE', labelFa: 'مربع (Square)', labelEn: 'Square ▢', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_TRIANGLE', labelFa: 'مثلث (Triangle)', labelEn: 'Triangle △', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_L1', labelFa: 'بامپر چپ (L1)', labelEn: 'Bumper L1', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_R1', labelFa: 'بامپر راست (R1)', labelEn: 'Bumper R1', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_L2', labelFa: 'ماشه چپ (L2)', labelEn: 'Trigger L2', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_R2', labelFa: 'ماشه راست (R2)', labelEn: 'Trigger R2', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_DPAD_UP', labelFa: 'جهت بالا', labelEn: 'D-pad up', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_DOWN', labelFa: 'جهت پایین', labelEn: 'D-pad down', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_LEFT', labelFa: 'جهت چپ', labelEn: 'D-pad left', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_RIGHT', labelFa: 'جهت راست', labelEn: 'D-pad right', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_L3', labelFa: 'آنالوگ چپ (L3)', labelEn: 'Left stick (L3)', groupFa: 'آنالوگ', groupEn: 'Analog sticks' },
    { id: 'BTN_R3', labelFa: 'آنالوگ راست (R3)', labelEn: 'Right stick (R3)', groupFa: 'آنالوگ', groupEn: 'Analog sticks' },
    { id: 'BTN_TOUCHPAD', labelFa: 'تاچ‌پد مرکزی', labelEn: 'Center touchpad', groupFa: 'سیستم', groupEn: 'System' },
    { id: 'BTN_PS', labelFa: 'دکمه PlayStation', labelEn: 'PlayStation button', groupFa: 'سیستم', groupEn: 'System' },
    { id: 'BTN_SHARE', labelFa: 'دکمه Create', labelEn: 'Create button', groupFa: 'سیستم', groupEn: 'System' },
    { id: 'BTN_OPTIONS', labelFa: 'دکمه Options', labelEn: 'Options button', groupFa: 'سیستم', groupEn: 'System' },
  ],
  xbox: [
    { id: 'BTN_A', labelFa: 'دکمه A', labelEn: 'A button', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_B', labelFa: 'دکمه B', labelEn: 'B button', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_X', labelFa: 'دکمه X', labelEn: 'X button', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_Y', labelFa: 'دکمه Y', labelEn: 'Y button', groupFa: 'دکمه‌های اصلی', groupEn: 'Face buttons' },
    { id: 'BTN_LB', labelFa: 'بامپر چپ (LB)', labelEn: 'Bumper LB', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_RB', labelFa: 'بامپر راست (RB)', labelEn: 'Bumper RB', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_LT', labelFa: 'ماشه چپ (LT)', labelEn: 'Trigger LT', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_RT', labelFa: 'ماشه راست (RT)', labelEn: 'Trigger RT', groupFa: 'شانه‌ای و ماشه', groupEn: 'Bumpers & triggers' },
    { id: 'BTN_DPAD_UP', labelFa: 'جهت بالا', labelEn: 'D-pad up', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_DOWN', labelFa: 'جهت پایین', labelEn: 'D-pad down', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_LEFT', labelFa: 'جهت چپ', labelEn: 'D-pad left', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_DPAD_RIGHT', labelFa: 'جهت راست', labelEn: 'D-pad right', groupFa: 'جهت‌نما', groupEn: 'D-pad' },
    { id: 'BTN_LS', labelFa: 'آنالوگ چپ (LS)', labelEn: 'Left stick (LS)', groupFa: 'آنالوگ', groupEn: 'Analog sticks' },
    { id: 'BTN_RS', labelFa: 'آنالوگ راست (RS)', labelEn: 'Right stick (RS)', groupFa: 'آنالوگ', groupEn: 'Analog sticks' },
    { id: 'BTN_XBOX', labelFa: 'دکمه Xbox', labelEn: 'Xbox button', groupFa: 'سیستم', groupEn: 'System' },
    { id: 'BTN_VIEW', labelFa: 'دکمه View', labelEn: 'View button', groupFa: 'سیستم', groupEn: 'System' },
    { id: 'BTN_MENU', labelFa: 'دکمه Menu', labelEn: 'Menu button', groupFa: 'سیستم', groupEn: 'System' },
  ],
  pc: [
    { id: 'BTN_LMB', labelFa: 'کلیک چپ ماوس (شلیک)', labelEn: 'Mouse left (fire)', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'BTN_RMB', labelFa: 'کلیک راست ماوس (نشانه‌گیری)', labelEn: 'Mouse right (aim)', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'BTN_MMB', labelFa: 'اسکرول وسط ماوس (پینگ)', labelEn: 'Mouse middle (ping)', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'BTN_SIDE_1', labelFa: 'دکمه کناری جلو ماوس', labelEn: 'Mouse side button (front)', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'BTN_SIDE_2', labelFa: 'دکمه کناری عقب ماوس', labelEn: 'Mouse side button (back)', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'BTN_DPI', labelFa: 'تنظیم دقت ماوس (DPI)', labelEn: 'Mouse DPI switch', groupFa: 'ماوس', groupEn: 'Mouse' },
    { id: 'KEY_W', labelFa: 'کلید W (جلو)', labelEn: 'W key (forward)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_A', labelFa: 'کلید A (چپ)', labelEn: 'A key (left)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_S', labelFa: 'کلید S (عقب)', labelEn: 'S key (back)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_D', labelFa: 'کلید D (راست)', labelEn: 'D key (right)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_SPACE', labelFa: 'کلید Space (پرش)', labelEn: 'Space (jump)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_SHIFT', labelFa: 'کلید Shift (دویدن)', labelEn: 'Shift (sprint)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_CTRL', labelFa: 'کلید Ctrl (نشستن)', labelEn: 'Ctrl (crouch)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_Q', labelFa: 'کلید Q (توانایی اول)', labelEn: 'Q (ability 1)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_E', labelFa: 'کلید E (تعامل)', labelEn: 'E (interact)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_R', labelFa: 'کلید R (خشاب‌گذاری)', labelEn: 'R (reload)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_F', labelFa: 'کلید F (ضربه نزدیک)', labelEn: 'F (melee)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_TAB', labelFa: 'کلید Tab (نقشه)', labelEn: 'Tab (map)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_ESC', labelFa: 'کلید Esc (منو)', labelEn: 'Esc (menu)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_1', labelFa: 'کلید 1 (سلاح اصلی)', labelEn: '1 (primary weapon)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
    { id: 'KEY_2', labelFa: 'کلید 2 (سلاح دوم)', labelEn: '2 (secondary weapon)', groupFa: 'کیبورد', groupEn: 'Keyboard' },
  ],
};

/** Buttons mentioned by the active combo (tokens like [L1+R1+△] / CTRL+SHIFT). */
export function activeGamepadButtons(comboTokens: string[]): Set<string> {
  const hay = comboTokens.join(' ').toUpperCase();
  const hits = new Set<string>();
  const byDevice = GAMEPAD_BUTTONS;
  for (const device of Object.keys(byDevice) as GamepadDeviceId[]) {
    for (const btn of byDevice[device]) {
      const symbol = btn.labelEn.replace(/\s*\(.*\)$/, '').toUpperCase();
      const raw = btn.id.replace(/^BTN_|^KEY_/, '');
      if (hay.includes(symbol) || hay.includes(raw)) hits.add(btn.id);
    }
  }
  return hits;
}
