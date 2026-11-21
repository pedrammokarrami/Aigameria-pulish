export type Hologram3DGameId = 'FC27' | 'WARZONE' | 'CS2' | 'GTA' | 'RDR2' | 'APEX';

export type TournamentGameId =
  | 'FC27'
  | 'NBA2K'
  | 'FORTNITE'
  | 'DOTA2'
  | 'F1'
  | 'WARZONE'
  | 'CS2'
  | 'GTA'
  | 'RDR2'
  | 'APEX';

export interface TurntableVideoPin {
  label: string;
  top: string;
  left?: string;
  right?: string;
  accent: 'primary' | 'secondary';
}

export interface TurntableVideoConfig {
  src: string;
  ariaLabelFa: string;
  pins: TurntableVideoPin[];
}

export interface SquadRoleSlot {
  id: string;
  roleLabel: string;
  isLtrRole?: boolean;
  memberHandle?: string;
  memberNameFa?: string;
  emptyLabel?: string;
  filled: boolean;
}

export interface TournamentMetricItem {
  id: string;
  labelFa: string;
  valueDisplay: string;
  subHintFa?: string;
  isLtrValue?: boolean;
  highlight?: boolean;
}

export interface TournamentStandingRow {
  rank: number;
  nameFa: string;
  tag: string;
  statPrimary: string;
  statSecondary: string;
  score: string;
  isUserTeam?: boolean;
}

export interface GameThemeConfig {
  id: TournamentGameId;
  shortLabel: string;
  fullTitleFa: string;
  subtitleFa: string;
  lobbyCountFa: string;
  hologramTitleFa: string;
  hologramSubtitleFa: string;
  roomLabelFa: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    roomBg: string;
    roomFog: string;
    hudSurface: string;
    hudBorder: string;
    ctaText: string;
    primaryRgb: string;
    secondaryRgb: string;
    accentRgb: string;
  };
  threeLighting: {
    keyHex: number;
    fillSkyHex: number;
    fillGroundHex: number;
    rimHex: number;
    hologramPrimaryHex: number;
    hologramSecondaryHex: number;
    hologramAccentHex: number;
    pedestalTrimHex: number;
    bloomStrength: number;
  };
  fonts: {
    display: string;
    numeral: string;
    persian: string;
    persianHeading: string;
  };
  shapeStyle: 'sleek' | 'tactical' | 'sharp' | 'neon' | 'frontier' | 'scifi';
  roster: {
    groupLabelFa: string;
    filledCount: number;
    totalCount: number;
    inviteCandidateHandle: string;
    inviteCandidateNameFa: string;
    slots: SquadRoleSlot[];
  };
  metrics: [TournamentMetricItem, TournamentMetricItem, TournamentMetricItem];
  primaryCtaFa: string;
  readyCtaFa: string;
  readyToastFa: string;
  standingsHeaders: {
    teamColFa: string;
    stat1ColFa: string;
    stat2ColFa: string;
    scoreColFa: string;
    ruleBadgeFa: string;
  };
  turntableVideo?: TurntableVideoConfig;
  standings: TournamentStandingRow[];
}

export const HOLOGRAM_3D_GAME_IDS: Hologram3DGameId[] = [
  'FC27',
  'WARZONE',
  'CS2',
  'GTA',
  'RDR2',
  'APEX',
];

export const TOURNAMENT_GAME_ORDER: TournamentGameId[] = [
  'FC27',
  'NBA2K',
  'FORTNITE',
  'DOTA2',
  'F1',
  'WARZONE',
  'CS2',
  'GTA',
  'RDR2',
  'APEX',
];

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianNum(value: number | string): string {
  return String(value).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export const GAME_THEMES: Record<TournamentGameId, GameThemeConfig> = {
  FC27: {
    id: 'FC27',
    shortLabel: 'FC 27',
    fullTitleFa: 'لیگ قهرمانان FC 27',
    subtitleFa: 'پرشیا یونایتد vs آتلتیکو پارس',
    lobbyCountFa: '۱۶ باشگاه در لیگ',
    hologramTitleFa: 'زمین تاکتیکی استادیوم',
    hologramSubtitleFa: 'پرشیا یونایتد vs آتلتیکو پارس',
    roomLabelFa: 'رختکن بارانی استادیوم',
    colors: {
      primary: '#00E676',
      secondary: '#FFFFFF',
      accent: '#FACC15',
      roomBg: '#04110B',
      roomFog: '#04120C',
      hudSurface: 'rgba(5, 19, 13, 0.82)',
      hudBorder: 'rgba(0, 230, 118, 0.34)',
      ctaText: '#03120A',
      primaryRgb: '0, 230, 118',
      secondaryRgb: '255, 255, 255',
      accentRgb: '250, 204, 21',
    },
    threeLighting: {
      keyHex: 0xeafff4,
      fillSkyHex: 0x00e676,
      fillGroundHex: 0x04110b,
      rimHex: 0xfacc15,
      hologramPrimaryHex: 0x00e676,
      hologramSecondaryHex: 0xffffff,
      hologramAccentHex: 0xfacc15,
      pedestalTrimHex: 0x00e676,
      bloomStrength: 0.42,
    },
    fonts: {
      display: "'Barlow Condensed', 'Oswald', sans-serif",
      numeral: "'Barlow Condensed', 'Oswald', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'sleek',
    roster: {
      groupLabelFa: 'باشگاه شما',
      filledCount: 10,
      totalCount: 11,
      inviteCandidateHandle: '@saeed_gk1',
      inviteCandidateNameFa: 'سعید (دروازه‌بان)',
      slots: [
        { id: 'fc-st', roleLabel: 'ST', isLtrRole: true, memberHandle: '@parsa_fc', memberNameFa: 'پارسا', filled: true },
        { id: 'fc-cam', roleLabel: 'CAM', isLtrRole: true, memberHandle: '@aria_10', memberNameFa: 'آریا', filled: true },
        { id: 'fc-cb', roleLabel: 'CB', isLtrRole: true, memberHandle: '@kian_cb', memberNameFa: 'کیان', filled: true },
        { id: 'fc-gk', roleLabel: 'GK', isLtrRole: true, emptyLabel: '+ GK خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'pts', labelFa: 'امتیاز کل', valueDisplay: '27', isLtrValue: true },
      { id: 'gd', labelFa: 'تفاضل گل', valueDisplay: '+14', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به رختکن مسابقه',
    readyCtaFa: 'حاضر در رختکن • آماده سوت آغاز',
    readyToastFa: 'ترکیب باشگاه در رختکن FC 27 ثبت شد.',
    standingsHeaders: {
      teamColFa: 'باشگاه',
      stat1ColFa: 'برد',
      stat2ColFa: 'تفاضل',
      scoreColFa: 'امتیاز',
      ruleBadgeFa: '۱۶ باشگاه در لیگ • صعود ۴ تیم برتر به پلی‌آف',
    },
    turntableVideo: {
      src: '/assets/aistudio/gemini_generated_video_9528C2CF_39592eeb.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی استادیوم FC 27 — برای چرخش افقی بکشید',
      pins: [
        { label: 'ST · PENALTY BOX', top: '38%', right: '26%', accent: 'primary' },
        { label: 'CAM · BUILD-UP', top: '47%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'آتلتیکو پارس', tag: 'ATP', statPrimary: '9', statSecondary: '+18', score: '29' },
      { rank: 2, nameFa: 'پرشیا یونایتد', tag: 'PRU', statPrimary: '8', statSecondary: '+14', score: '27', isUserTeam: true },
      { rank: 3, nameFa: 'رویال تهران FC', tag: 'RTF', statPrimary: '8', statSecondary: '+11', score: '25' },
      { rank: 4, nameFa: 'زاگرس سیتی', tag: 'ZGC', statPrimary: '7', statSecondary: '+8', score: '23' },
      { rank: 5, nameFa: 'خلیج استارز', tag: 'KHS', statPrimary: '6', statSecondary: '+4', score: '20' },
      { rank: 6, nameFa: 'البرز اتلتیک', tag: 'ALB', statPrimary: '6', statSecondary: '+2', score: '19' },
      { rank: 7, nameFa: 'کاسپین کلاب', tag: 'CSP', statPrimary: '5', statSecondary: '-1', score: '17' },
      { rank: 8, nameFa: 'آریا وولوز', tag: 'ARW', statPrimary: '4', statSecondary: '-5', score: '14' },
    ],
  },

  NBA2K: {
    id: 'NBA2K',
    shortLabel: 'NBA 2K',
    fullTitleFa: 'پلی‌آف پرو-ام NBA 2K',
    subtitleFa: 'تهران کینگز vs پارس لیکرز',
    lobbyCountFa: '۱۶ تیم در کنفرانس',
    hologramTitleFa: 'سالن مرکزی پلی‌آف NBA',
    hologramSubtitleFa: 'تهران کینگز vs پارس لیکرز',
    roomLabelFa: 'سالن نورپردازی‌شده پارکت',
    colors: {
      primary: '#F97316',
      secondary: '#A855F7',
      accent: '#FDE047',
      roomBg: '#090605',
      roomFog: '#0E0907',
      hudSurface: 'rgba(20, 13, 10, 0.84)',
      hudBorder: 'rgba(249, 115, 22, 0.38)',
      ctaText: '#140903',
      primaryRgb: '249, 115, 22',
      secondaryRgb: '168, 85, 247',
      accentRgb: '253, 224, 71',
    },
    threeLighting: {
      keyHex: 0xffedd5,
      fillSkyHex: 0xa855f7,
      fillGroundHex: 0x140b06,
      rimHex: 0xf97316,
      hologramPrimaryHex: 0xf97316,
      hologramSecondaryHex: 0xa855f7,
      hologramAccentHex: 0xfde047,
      pedestalTrimHex: 0xf97316,
      bloomStrength: 0.44,
    },
    fonts: {
      display: "'Oswald', 'Anton', sans-serif",
      numeral: "'Oswald', 'Anton', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'sleek',
    roster: {
      groupLabelFa: 'تیم پرو-ام شما',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@soheil_center',
      inviteCandidateNameFa: 'سهیل (سنتر)',
      slots: [
        { id: 'nba-pg', roleLabel: 'PG', isLtrRole: true, memberHandle: '@amir_pg', memberNameFa: 'امیر', filled: true },
        { id: 'nba-sg', roleLabel: 'SG', isLtrRole: true, memberHandle: '@sina_3pt', memberNameFa: 'سینا', filled: true },
        { id: 'nba-sf', roleLabel: 'SF', isLtrRole: true, memberHandle: '@parsa_sf', memberNameFa: 'پارسا', filled: true },
        { id: 'nba-pf', roleLabel: 'PF', isLtrRole: true, memberHandle: '@kian_pf', memberNameFa: 'کیان', filled: true },
        { id: 'nba-c', roleLabel: 'C', isLtrRole: true, emptyLabel: '+ C خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه کنفرانس', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'record', labelFa: 'برد-باخت', valueDisplay: '18-4', isLtrValue: true },
      { id: 'ppg', labelFa: 'میانگین امتیاز', valueDisplay: '94.6', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به زمین مسابقه',
    readyCtaFa: 'حاضر در زمین • آماده تیپ‌آف',
    readyToastFa: 'ترکیب ۵ نفره شما در سالن پرو-ام NBA 2K ثبت شد.',
    standingsHeaders: {
      teamColFa: 'تیم کنفرانس',
      stat1ColFa: 'برد-باخت',
      stat2ColFa: 'میانگین',
      scoreColFa: 'درصد برد',
      ruleBadgeFa: '۱۶ تیم در کنفرانس • سری پلی‌آف BO5 پرو-ام',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_18PM_3bc26c22.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی سالن بسکتبال NBA 2K — برای چرخش افقی بکشید',
      pins: [
        { label: '3PT · ARC ZONE', top: '42%', right: '24%', accent: 'primary' },
        { label: 'PAINT · POST-UP', top: '50%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'پارس لیکرز', tag: 'PLK', statPrimary: '19-3', statSecondary: '98.2', score: '86%' },
      { rank: 2, nameFa: 'تهران کینگز', tag: 'THK', statPrimary: '18-4', statSecondary: '94.6', score: '82%', isUserTeam: true },
      { rank: 3, nameFa: 'البرز باکس', tag: 'ALB', statPrimary: '16-6', statSecondary: '91.4', score: '73%' },
      { rank: 4, nameFa: 'کاسپین هیت', tag: 'CSH', statPrimary: '14-8', statSecondary: '89.0', score: '64%' },
      { rank: 5, nameFa: 'زاگرس سلتیکس', tag: 'ZGC', statPrimary: '12-10', statSecondary: '86.5', score: '55%' },
      { rank: 6, nameFa: 'آریا واریرز', tag: 'ARW', statPrimary: '10-12', statSecondary: '84.1', score: '45%' },
    ],
  },

  FORTNITE: {
    id: 'FORTNITE',
    shortLabel: 'FORTNITE',
    fullTitleFa: 'جام FNCS فورتنایت',
    subtitleFa: 'حلقه ۴ طوفان • قلعه مرکزی',
    lobbyCountFa: '۲۵ اسکواد در لابی',
    hologramTitleFa: 'جزیره شناور طوفان',
    hologramSubtitleFa: 'حلقه ۴ طوفان • نبرد ارتفاع',
    roomLabelFa: 'جزیره معلق بتل‌باس',
    colors: {
      primary: '#3B82F6',
      secondary: '#38BDF8',
      accent: '#FACC15',
      roomBg: '#080C1A',
      roomFog: '#0B1124',
      hudSurface: 'rgba(13, 20, 40, 0.84)',
      hudBorder: 'rgba(59, 130, 246, 0.42)',
      ctaText: '#FFFFFF',
      primaryRgb: '59, 130, 246',
      secondaryRgb: '56, 189, 248',
      accentRgb: '250, 204, 21',
    },
    threeLighting: {
      keyHex: 0xe0f2fe,
      fillSkyHex: 0x3b82f6,
      fillGroundHex: 0x0b1124,
      rimHex: 0x38bdf8,
      hologramPrimaryHex: 0x3b82f6,
      hologramSecondaryHex: 0x38bdf8,
      hologramAccentHex: 0xfacc15,
      pedestalTrimHex: 0x3b82f6,
      bloomStrength: 0.48,
    },
    fonts: {
      display: "'Anton', 'Bebas Neue', sans-serif",
      numeral: "'Anton', 'Bebas Neue', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'neon',
    roster: {
      groupLabelFa: 'اسکواد شما',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@omid_tarp',
      inviteCandidateNameFa: 'امید (Support)',
      slots: [
        { id: 'fn-igl', roleLabel: 'IGL', isLtrRole: true, memberHandle: '@aria_edit', memberNameFa: 'آریا', filled: true },
        { id: 'fn-frg', roleLabel: 'Fragger', isLtrRole: true, memberHandle: '@nima_pump', memberNameFa: 'نیما', filled: true },
        { id: 'fn-bld', roleLabel: 'Builder', isLtrRole: true, memberHandle: '@reza_90s', memberNameFa: 'رضا', filled: true },
        { id: 'fn-sup', roleLabel: 'Support', isLtrRole: true, emptyLabel: '+ Support خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه جام', valueDisplay: '#1', isLtrValue: true, highlight: true },
      { id: 'vr', labelFa: 'ویکتوری رویال', valueDisplay: '4 VR', isLtrValue: true },
      { id: 'pts', labelFa: 'امتیاز FNCS', valueDisplay: '284', isLtrValue: true },
    ],
    primaryCtaFa: 'پرش از بتل‌باس',
    readyCtaFa: 'اسکواد آماده است • مسیر فرود قفل شد',
    readyToastFa: 'نقطه فرود قلعه مرکزی برای اسکواد فورتنایت ثبت شد.',
    standingsHeaders: {
      teamColFa: 'اسکواد FNCS',
      stat1ColFa: 'ویکتوری',
      stat2ColFa: 'حذف',
      scoreColFa: 'امتیاز',
      ruleBadgeFa: '۲۵ اسکواد در لابی • سیستم امتیازدهی رسمی FNCS',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_22PM_7c7ceebc.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی جزیره طوفان FORTNITE — برای چرخش افقی بکشید',
      pins: [
        { label: 'STORM · ZONE 4', top: '37%', right: '23%', accent: 'primary' },
        { label: 'HIGH GROUND · KEEP', top: '46%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'طوفان آبی', tag: 'BST', statPrimary: '4 VR', statSecondary: '42', score: '284', isUserTeam: true },
      { rank: 2, nameFa: 'نوا بیلدرز', tag: 'NVB', statPrimary: '3 VR', statSecondary: '37', score: '261' },
      { rank: 3, nameFa: 'تهران کراون', tag: 'THC', statPrimary: '2 VR', statSecondary: '33', score: '240' },
      { rank: 4, nameFa: 'ریفت واکرز', tag: 'RFW', statPrimary: '2 VR', statSecondary: '29', score: '218' },
      { rank: 5, nameFa: 'اسکای بیس', tag: 'SKB', statPrimary: '1 VR', statSecondary: '24', score: '195' },
      { rank: 6, nameFa: 'پارس لاما', tag: 'PLM', statPrimary: '1 VR', statSecondary: '19', score: '172' },
    ],
  },

  DOTA2: {
    id: 'DOTA2',
    shortLabel: 'DOTA 2',
    fullTitleFa: 'تورنمنت بین‌المللی DOTA 2',
    subtitleFa: 'نبرد رودخانه • دفاع از انشنت',
    lobbyCountFa: '۸ تیم در پلی‌آف',
    hologramTitleFa: 'نقشه سه‌لاین انشنت',
    hologramSubtitleFa: 'کنترل رودخانه و برج‌های میانی',
    roomLabelFa: 'تالار باستانی کریستال',
    colors: {
      primary: '#0EA5E9',
      secondary: '#F59E0B',
      accent: '#38BDF8',
      roomBg: '#040C15',
      roomFog: '#06111E',
      hudSurface: 'rgba(7, 17, 29, 0.86)',
      hudBorder: 'rgba(14, 165, 233, 0.38)',
      ctaText: '#031019',
      primaryRgb: '14, 165, 233',
      secondaryRgb: '245, 158, 11',
      accentRgb: '56, 189, 248',
    },
    threeLighting: {
      keyHex: 0xe0f2fe,
      fillSkyHex: 0x0ea5e9,
      fillGroundHex: 0x040c15,
      rimHex: 0xf59e0b,
      hologramPrimaryHex: 0x0ea5e9,
      hologramSecondaryHex: 0xf59e0b,
      hologramAccentHex: 0x38bdf8,
      pedestalTrimHex: 0x0ea5e9,
      bloomStrength: 0.44,
    },
    fonts: {
      display: "'Cormorant Garamond', 'Cinzel', serif",
      numeral: "'Cormorant Garamond', 'Cinzel', serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'frontier',
    roster: {
      groupLabelFa: 'تیم درفت شما',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@behzad_pos5',
      inviteCandidateNameFa: 'بهزاد (Hard Sup)',
      slots: [
        { id: 'dota-p1', roleLabel: 'Carry', isLtrRole: true, memberHandle: '@kaveh1', memberNameFa: 'کاوه', filled: true },
        { id: 'dota-p2', roleLabel: 'Mid', isLtrRole: true, memberHandle: '@dorsa2', memberNameFa: 'درسا', filled: true },
        { id: 'dota-p3', roleLabel: 'Offlane', isLtrRole: true, memberHandle: '@mahdi3', memberNameFa: 'مهدی', filled: true },
        { id: 'dota-p4', roleLabel: 'Pos 4', isLtrRole: true, memberHandle: '@tara4', memberNameFa: 'تارا', filled: true },
        { id: 'dota-p5', roleLabel: 'Pos 5', isLtrRole: true, emptyLabel: '+ P5 خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه براکت', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'kda', labelFa: 'میانگین KDA', valueDisplay: '5.4', isLtrValue: true },
      { id: 'prize', labelFa: 'جایزه کل', valueDisplay: '$5,000', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به درفت هیرو',
    readyCtaFa: 'درفت قفل شد • آماده نبرد انشنت',
    readyToastFa: 'تیم شما وارد فاز انتخاب هیرو (Captains Mode) شد.',
    standingsHeaders: {
      teamColFa: 'تیم پلی‌آف',
      stat1ColFa: 'برد-باخت',
      stat2ColFa: 'میانگین KDA',
      scoreColFa: 'امتیاز DPC',
      ruleBadgeFa: '۸ تیم در پلی‌آف • فرمت Captains Mode BO3',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_20PM_52aa0d65.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی جزیره انشنت DOTA 2 — برای چرخش افقی بکشید',
      pins: [
        { label: 'ANCIENT · CRYSTAL', top: '32%', right: '26%', accent: 'primary' },
        { label: 'MID · RIVER RUNE', top: '48%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'اژدهای رادیانت', tag: 'RDR', statPrimary: '7-1', statSecondary: '6.1', score: '1,420' },
      { rank: 2, nameFa: 'نگهبانان انشنت', tag: 'ANG', statPrimary: '6-2', statSecondary: '5.4', score: '1,290', isUserTeam: true },
      { rank: 3, nameFa: 'شوالیه‌های دایر', tag: 'DRK', statPrimary: '5-3', statSecondary: '4.9', score: '1,150' },
      { rank: 4, nameFa: 'طوفان رونه', tag: 'RNS', statPrimary: '4-4', statSecondary: '4.3', score: '980' },
      { rank: 5, nameFa: 'پارس روشان', tag: 'PRS', statPrimary: '3-5', statSecondary: '3.8', score: '840' },
      { rank: 6, nameFa: 'سایه میدلاین', tag: 'SMD', statPrimary: '2-6', statSecondary: '3.2', score: '690' },
    ],
  },

  F1: {
    id: 'F1',
    shortLabel: 'F1',
    fullTitleFa: 'گرندپری شبانه F1',
    subtitleFa: 'پیست بارانی • پیت‌لین مرکزی',
    lobbyCountFa: '۱۰ تیم در گرندپری',
    hologramTitleFa: 'مدار مسابقه و گاراژ F1',
    hologramSubtitleFa: 'پیچ ۱ بارانی • استراتژی پیت‌استاپ',
    roomLabelFa: 'گاراژ پیت‌لین شبانه',
    colors: {
      primary: '#FF1E00',
      secondary: '#E2E8F0',
      accent: '#38BDF8',
      roomBg: '#06080C',
      roomFog: '#0A0D14',
      hudSurface: 'rgba(12, 16, 24, 0.86)',
      hudBorder: 'rgba(255, 30, 0, 0.40)',
      ctaText: '#FFFFFF',
      primaryRgb: '255, 30, 0',
      secondaryRgb: '226, 232, 240',
      accentRgb: '56, 189, 248',
    },
    threeLighting: {
      keyHex: 0xf8fafc,
      fillSkyHex: 0x38bdf8,
      fillGroundHex: 0x090c12,
      rimHex: 0xff1e00,
      hologramPrimaryHex: 0xff1e00,
      hologramSecondaryHex: 0xe2e8f0,
      hologramAccentHex: 0x38bdf8,
      pedestalTrimHex: 0xff1e00,
      bloomStrength: 0.42,
    },
    fonts: {
      display: "'Rajdhani', 'JetBrains Mono', sans-serif",
      numeral: "'Rajdhani', 'JetBrains Mono', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'sharp',
    roster: {
      groupLabelFa: 'تیم ریسینگ شما',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@sina_tele',
      inviteCandidateNameFa: 'سینا (تله‌متری)',
      slots: [
        { id: 'f1-d1', roleLabel: 'Driver 1', isLtrRole: true, memberHandle: '@parsa_f1', memberNameFa: 'پارسا', filled: true },
        { id: 'f1-d2', roleLabel: 'Driver 2', isLtrRole: true, memberHandle: '@aria_apex', memberNameFa: 'آریا', filled: true },
        { id: 'f1-eng', roleLabel: 'Race Eng', isLtrRole: true, memberHandle: '@nima_pit', memberNameFa: 'نیما', filled: true },
        { id: 'f1-tel', roleLabel: 'Telemetry', isLtrRole: true, emptyLabel: '+ Tele خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'pos', labelFa: 'جایگاه استارت', valueDisplay: 'P1', isLtrValue: true, highlight: true },
      { id: 'lap', labelFa: 'سریع‌ترین دور', valueDisplay: '1:18.4', isLtrValue: true },
      { id: 'pts', labelFa: 'امتیاز تیم', valueDisplay: '412', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به پیت‌لین مسابقه',
    readyCtaFa: 'لاستیک بارانی نصب شد • آماده استارت',
    readyToastFa: 'استراتژی پیت‌استاپ دوگانه برای گرندپری ثبت شد.',
    standingsHeaders: {
      teamColFa: 'تیم سازنده',
      stat1ColFa: 'برد',
      stat2ColFa: 'سریع‌ترین دور',
      scoreColFa: 'امتیاز',
      ruleBadgeFa: '۱۰ تیم در گرندپری • ۵۸ دور در پیست بارانی',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_17PM_e04c8376.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی پیست و گاراژ F1 — برای چرخش افقی بکشید',
      pins: [
        { label: 'PIT LANE · BOX', top: '41%', right: '25%', accent: 'primary' },
        { label: 'APEX · WET KERB', top: '53%', left: '26%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'پرشیا موتوراسپورت', tag: 'PMS', statPrimary: '7', statSecondary: '1:18.4', score: '412', isUserTeam: true },
      { rank: 2, nameFa: 'اسکودریا پارس', tag: 'SCP', statPrimary: '6', statSecondary: '1:18.9', score: '389' },
      { rank: 3, nameFa: 'سیلور ارو تهران', tag: 'SAT', statPrimary: '4', statSecondary: '1:19.2', score: '348' },
      { rank: 4, nameFa: 'البرز توربو', tag: 'ALT', statPrimary: '3', statSecondary: '1:19.6', score: '304' },
      { rank: 5, nameFa: 'کاسپین جی‌تی', tag: 'CGT', statPrimary: '1', statSecondary: '1:20.1', score: '256' },
      { rank: 6, nameFa: 'زاگرس ایرو', tag: 'ZGA', statPrimary: '0', statSecondary: '1:20.7', score: '211' },
    ],
  },

  WARZONE: {
    id: 'WARZONE',
    shortLabel: 'WARZONE',
    fullTitleFa: 'عملیات تاکتیکی WARZONE',
    subtitleFa: 'نقطه فرود: Superstore',
    lobbyCountFa: '۱۲ اسکواد در لابی',
    hologramTitleFa: 'نقشه عملیاتی Urzikstan',
    hologramSubtitleFa: 'نقطه فرود: Superstore',
    roomLabelFa: 'اتاق تسلیحات عملیات ویژه',
    colors: {
      primary: '#F59E0B',
      secondary: '#EA580C',
      accent: '#374151',
      roomBg: '#0E0C08',
      roomFog: '#120E09',
      hudSurface: 'rgba(22, 18, 13, 0.86)',
      hudBorder: 'rgba(245, 158, 11, 0.36)',
      ctaText: '#140D04',
      primaryRgb: '245, 158, 11',
      secondaryRgb: '234, 88, 12',
      accentRgb: '55, 65, 81',
    },
    threeLighting: {
      keyHex: 0xffe4b8,
      fillSkyHex: 0xf59e0b,
      fillGroundHex: 0x161411,
      rimHex: 0xea580c,
      hologramPrimaryHex: 0xf59e0b,
      hologramSecondaryHex: 0xea580c,
      hologramAccentHex: 0x9ca3af,
      pedestalTrimHex: 0xf59e0b,
      bloomStrength: 0.45,
    },
    fonts: {
      display: "'Chakra Petch', 'Rajdhani', sans-serif",
      numeral: "'Chakra Petch', 'Rajdhani', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'tactical',
    roster: {
      groupLabelFa: 'اسکواد شما',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@omid_medic',
      inviteCandidateNameFa: 'امید (ساپورت)',
      slots: [
        { id: 'wz-cmd', roleLabel: 'فرمانده', memberHandle: '@nima_ops', memberNameFa: 'نیما', filled: true },
        { id: 'wz-snp', roleLabel: 'اسنایپر', memberHandle: '@sina_kar98', memberNameFa: 'سینا', filled: true },
        { id: 'wz-rsh', roleLabel: 'راشر', memberHandle: '@reza_smg', memberNameFa: 'رضا', filled: true },
        { id: 'wz-sup', roleLabel: 'ساپورت', emptyLabel: '+ ساپورت خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی', valueDisplay: '#3', isLtrValue: true, highlight: true },
      { id: 'pts', labelFa: 'امتیاز کل', valueDisplay: '48', isLtrValue: true },
      { id: 'rule', labelFa: 'قانون: هر کیل ۱ امتیاز', valueDisplay: '19 KILLS', isLtrValue: true },
    ],
    primaryCtaFa: 'استقرار اسکواد در لابی',
    readyCtaFa: 'اسکواد مستقر شد • آماده پرش',
    readyToastFa: 'مختصات Superstore برای اسکواد ارسال شد.',
    standingsHeaders: {
      teamColFa: 'اسکواد',
      stat1ColFa: 'کیل',
      stat2ColFa: 'بقا',
      scoreColFa: 'امتیاز کل',
      ruleBadgeFa: '۱۲ اسکواد در لابی • قانون: هر کیل ۱ امتیاز + امتیاز بقا',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_08PM_3cc65f72.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی منطقه Superstore وارزون — برای چرخش افقی بکشید',
      pins: [
        { label: 'SUPERSTORE · ROOF', top: '38%', right: '26%', accent: 'primary' },
        { label: 'LOADOUT · DROP', top: '48%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'تاسک‌فورس آلفا', tag: 'TFA', statPrimary: '24', statSecondary: '1st', score: '56' },
      { rank: 2, nameFa: 'شبح صحرا', tag: 'DSG', statPrimary: '21', statSecondary: '2nd', score: '51' },
      { rank: 3, nameFa: 'اسکواد طوفان', tag: 'STM', statPrimary: '19', statSecondary: '3rd', score: '48', isUserTeam: true },
      { rank: 4, nameFa: 'گرگ‌های شب', tag: 'NWV', statPrimary: '17', statSecondary: '4th', score: '43' },
      { rank: 5, nameFa: 'دلتا ۹۹', tag: 'D99', statPrimary: '14', statSecondary: '5th', score: '37' },
      { rank: 6, nameFa: 'کبرا تاکتیکال', tag: 'CBR', statPrimary: '12', statSecondary: '6th', score: '31' },
      { rank: 7, nameFa: 'سایه‌های ریبیرث', tag: 'RBS', statPrimary: '10', statSecondary: '7th', score: '26' },
    ],
  },

  CS2: {
    id: 'CS2',
    shortLabel: 'CS2',
    fullTitleFa: 'تورنمنت پریمیر CS2',
    subtitleFa: 'هدف تاکتیکی: سایت A',
    lobbyCountFa: '۸ تیم در براکت',
    hologramTitleFa: 'نقشه تاکتیکی Mirage',
    hologramSubtitleFa: 'هدف تاکتیکی: سایت A',
    roomLabelFa: 'اتاق بریفینگ ای‌اسپورتس',
    colors: {
      primary: '#DE6B24',
      secondary: '#38BDF8',
      accent: '#0F172A',
      roomBg: '#070C16',
      roomFog: '#09101E',
      hudSurface: 'rgba(11, 18, 32, 0.86)',
      hudBorder: 'rgba(222, 107, 36, 0.38)',
      ctaText: '#FFFFFF',
      primaryRgb: '222, 107, 36',
      secondaryRgb: '56, 189, 248',
      accentRgb: '15, 23, 42',
    },
    threeLighting: {
      keyHex: 0xdbeafe,
      fillSkyHex: 0x38bdf8,
      fillGroundHex: 0x0f172a,
      rimHex: 0xde6b24,
      hologramPrimaryHex: 0xde6b24,
      hologramSecondaryHex: 0x38bdf8,
      hologramAccentHex: 0xe2e8f0,
      pedestalTrimHex: 0x38bdf8,
      bloomStrength: 0.44,
    },
    fonts: {
      display: "'Teko', 'Inter', sans-serif",
      numeral: "'Teko', 'Inter', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'sharp',
    roster: {
      groupLabelFa: 'تیم شما',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@soheil_lrk',
      inviteCandidateNameFa: 'سهیل (Lurker)',
      slots: [
        { id: 'cs-igl', roleLabel: 'IGL', isLtrRole: true, memberHandle: '@artin_igl', memberNameFa: 'آرتین', filled: true },
        { id: 'cs-awp', roleLabel: 'AWPer', isLtrRole: true, memberHandle: '@nima_awp', memberNameFa: 'نیما', filled: true },
        { id: 'cs-ent', roleLabel: 'Entry', isLtrRole: true, memberHandle: '@dorsa_ak', memberNameFa: 'درسا', filled: true },
        { id: 'cs-sup', roleLabel: 'Support', isLtrRole: true, memberHandle: '@amir_util', memberNameFa: 'امیر', filled: true },
        { id: 'cs-lrk', roleLabel: 'Lurker', isLtrRole: true, emptyLabel: '+ Lurker خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی', valueDisplay: '#1', isLtrValue: true, highlight: true },
      { id: 'streak', labelFa: 'برد متوالی', valueDisplay: '6W', isLtrValue: true },
      { id: 'prize', labelFa: 'جایزه', valueDisplay: '$2,500', isLtrValue: true },
    ],
    primaryCtaFa: 'آماده ورود به مچ',
    readyCtaFa: 'تایید شد • در انتظار وتو مپ',
    readyToastFa: 'تیم برای اجرای استراتژی A-Site میراژ آماده شد.',
    standingsHeaders: {
      teamColFa: 'تیم براکت',
      stat1ColFa: 'برد-باخت',
      stat2ColFa: 'راند',
      scoreColFa: 'امتیاز',
      ruleBadgeFa: '۸ تیم در براکت • فرمت BO3 پریمیر',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_15PM_673d3703.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی سایت A تاکتیکی CS2 — برای چرخش افقی بکشید',
      pins: [
        { label: 'SITE A · PLANT', top: '39%', right: '26%', accent: 'primary' },
        { label: 'CLOCK TOWER · CT', top: '35%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'سایبر وایپرز', tag: 'CVP', statPrimary: '6-0', statSecondary: '+34', score: '24,800', isUserTeam: true },
      { rank: 2, nameFa: 'اینفرنو کارتل', tag: 'INF', statPrimary: '5-1', statSecondary: '+21', score: '23,150' },
      { rank: 3, nameFa: 'میراژ فانتوم', tag: 'MPH', statPrimary: '4-2', statSecondary: '+12', score: '21,400' },
      { rank: 4, nameFa: 'انوبیس الیت', tag: 'ANB', statPrimary: '4-2', statSecondary: '+6', score: '20,650' },
      { rank: 5, nameFa: 'تهران ایم', tag: 'THN', statPrimary: '3-3', statSecondary: '-2', score: '19,200' },
      { rank: 6, nameFa: 'زیرو پیک', tag: 'ZPK', statPrimary: '2-4', statSecondary: '-11', score: '17,900' },
      { rank: 7, nameFa: 'دابل دورز', tag: 'DDR', statPrimary: '1-5', statSecondary: '-24', score: '16,100' },
      { rank: 8, nameFa: 'فلش‌بنگ پرو', tag: 'FBP', statPrimary: '0-6', statSecondary: '-36', score: '14,800' },
    ],
  },

  GTA: {
    id: 'GTA',
    shortLabel: 'GTA',
    fullTitleFa: 'رقابت کروهای GTA',
    subtitleFa: 'هدف: سرقت کازینو',
    lobbyCountFa: '۶ کرو در رقابت',
    hologramTitleFa: 'نقشه منطقه کازینو وایس‌سیتی',
    hologramSubtitleFa: 'هدف: سرقت کازینو',
    roomLabelFa: 'پنت‌هاوس نئونی بارانی',
    colors: {
      primary: '#EC4899',
      secondary: '#06B6D4',
      accent: '#8B5CF6',
      roomBg: '#0D0614',
      roomFog: '#12071C',
      hudSurface: 'rgba(19, 9, 30, 0.84)',
      hudBorder: 'rgba(236, 72, 153, 0.42)',
      ctaText: '#FFFFFF',
      primaryRgb: '236, 72, 153',
      secondaryRgb: '6, 182, 212',
      accentRgb: '139, 92, 246',
    },
    threeLighting: {
      keyHex: 0xf9a8d4,
      fillSkyHex: 0x06b6d4,
      fillGroundHex: 0x1e0b36,
      rimHex: 0xec4899,
      hologramPrimaryHex: 0xec4899,
      hologramSecondaryHex: 0x06b6d4,
      hologramAccentHex: 0x8b5cf6,
      pedestalTrimHex: 0xec4899,
      bloomStrength: 0.52,
    },
    fonts: {
      display: "'Bebas Neue', 'Anton', sans-serif",
      numeral: "'Bebas Neue', 'Anton', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'neon',
    roster: {
      groupLabelFa: 'کرو شما',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@pouya_gunner',
      inviteCandidateNameFa: 'پویا (تیرانداز)',
      slots: [
        { id: 'gta-mm', roleLabel: 'مغز متفکر', memberHandle: '@parsa_vice', memberNameFa: 'پارسا', filled: true },
        { id: 'gta-drv', roleLabel: 'راننده', memberHandle: '@mahdi_gt', memberNameFa: 'مهدی', filled: true },
        { id: 'gta-hck', roleLabel: 'هکر', memberHandle: '@sara_net', memberNameFa: 'سارا', filled: true },
        { id: 'gta-gun', roleLabel: 'تیرانداز', emptyLabel: '+ تیرانداز خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه کرو', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'share', labelFa: 'سهم جایزه', valueDisplay: '$4.2M', isLtrValue: true },
      { id: 'wanted', labelFa: 'سطح تحت تعقیب', valueDisplay: '★★★★☆', isLtrValue: true },
    ],
    primaryCtaFa: 'شروع عملیات کرو',
    readyCtaFa: 'عملیات فعال شد • مسیر فرار باز است',
    readyToastFa: 'نقشه گاوصندوق کازینو برای اعضای کرو همگام شد.',
    standingsHeaders: {
      teamColFa: 'کرو',
      stat1ColFa: 'تعقیب',
      stat2ColFa: 'سهم',
      scoreColFa: 'اعتبار REP',
      ruleBadgeFa: '۶ کرو در رقابت • سریع‌ترین فرار با بیشترین غنیمت',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_10PM_c43d137b.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی کازینو وایس‌سیتی GTA — برای چرخش افقی بکشید',
      pins: [
        { label: 'HELIPAD · EXFIL', top: '36%', left: '24%', accent: 'secondary' },
        { label: 'CASINO · VAULT', top: '46%', right: '25%', accent: 'primary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'سندیکای نئون', tag: 'NSY', statPrimary: '★★★★★', statSecondary: '$4.8M', score: '18,900' },
      { rank: 2, nameFa: 'وایس فانتومز', tag: 'VPH', statPrimary: '★★★★☆', statSecondary: '$4.2M', score: '17,450', isUserTeam: true },
      { rank: 3, nameFa: 'کارتل واین‌وود', tag: 'VWC', statPrimary: '★★★★☆', statSecondary: '$3.7M', score: '15,820' },
      { rank: 4, nameFa: 'شب‌روهای دل‌پرو', tag: 'DPR', statPrimary: '★★★☆☆', statSecondary: '$3.1M', score: '14,100' },
      { rank: 5, nameFa: 'میدنایت کلاب', tag: 'MNC', statPrimary: '★★★☆☆', statSecondary: '$2.6M', score: '12,550' },
      { rank: 6, nameFa: 'پنت‌هاوس اکس', tag: 'PHX', statPrimary: '★★☆☆☆', statSecondary: '$2.1M', score: '10,900' },
    ],
  },

  RDR2: {
    id: 'RDR2',
    shortLabel: 'RDR2',
    fullTitleFa: 'دوئل دسته‌های RDR2',
    subtitleFa: 'منطقه: Valentine',
    lobbyCountFa: '۸ دسته در رقابت',
    hologramTitleFa: 'نقشه قلمرو دره Valentine',
    hologramSubtitleFa: 'منطقه: Valentine',
    roomLabelFa: 'میز فرماندهی گرگ‌ومیش سرحد',
    colors: {
      primary: '#B91C1C',
      secondary: '#D97706',
      accent: '#F5E6C8',
      roomBg: '#120A07',
      roomFog: '#180D08',
      hudSurface: 'rgba(26, 15, 10, 0.88)',
      hudBorder: 'rgba(217, 119, 6, 0.42)',
      ctaText: '#F5E6C8',
      primaryRgb: '185, 28, 28',
      secondaryRgb: '217, 119, 6',
      accentRgb: '245, 230, 200',
    },
    threeLighting: {
      keyHex: 0xfde68a,
      fillSkyHex: 0xd97706,
      fillGroundHex: 0x1c0f0a,
      rimHex: 0xb91c1c,
      hologramPrimaryHex: 0xd97706,
      hologramSecondaryHex: 0xb91c1c,
      hologramAccentHex: 0xf5e6c8,
      pedestalTrimHex: 0xd97706,
      bloomStrength: 0.36,
    },
    fonts: {
      display: "'Cinzel', Georgia, serif",
      numeral: "'Cinzel', Georgia, serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Lalezar', 'Vazirmatn', serif",
    },
    shapeStyle: 'frontier',
    roster: {
      groupLabelFa: 'دسته شما',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@behzad_rider',
      inviteCandidateNameFa: 'بهزاد (سوارکار)',
      slots: [
        { id: 'rdr-ldr', roleLabel: 'رهبر', memberHandle: '@tara_outlaw', memberNameFa: 'تارا', filled: true },
        { id: 'rdr-shp', roleLabel: 'تکتیرانداز', memberHandle: '@arash_deadeye', memberNameFa: 'آرش', filled: true },
        { id: 'rdr-trk', roleLabel: 'ردیاب', memberHandle: '@milad_trail', memberNameFa: 'میلاد', filled: true },
        { id: 'rdr-rdr', roleLabel: 'سوارکار', emptyLabel: '+ سوارکار خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه دسته', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'bounty', labelFa: 'باونتی', valueDisplay: '$1,850', isLtrValue: true },
      { id: 'honor', labelFa: 'افتخار', valueDisplay: 'شرافتمند', isLtrValue: false },
    ],
    primaryCtaFa: 'ورود به دوئل دسته',
    readyCtaFa: 'زین آماده است • ورود به Valentine',
    readyToastFa: 'دسته شما برای تصرف قلمرو Valentine اعلام آمادگی کرد.',
    standingsHeaders: {
      teamColFa: 'دسته',
      stat1ColFa: 'افتخار',
      stat2ColFa: 'باونتی',
      scoreColFa: 'قلمرو',
      ruleBadgeFa: '۸ دسته در رقابت • کنترل مناطق Valentine و Blackwater',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_11PM_edf6640f.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی شهرک سالون ولنتاین RDR2 — برای چرخش افقی بکشید',
      pins: [
        { label: 'SALOON · DUEL', top: '39%', right: '26%', accent: 'primary' },
        { label: 'CANYON · TRAIL', top: '49%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'سواران بلک‌واتر', tag: 'BWR', statPrimary: 'یاغی', statSecondary: '$2,400', score: '940' },
      { rank: 2, nameFa: 'دسته عقاب سرخ', tag: 'RDE', statPrimary: 'شرافتمند', statSecondary: '$1,850', score: '890', isUserTeam: true },
      { rank: 3, nameFa: 'نگهبانان هارتلند', tag: 'HLG', statPrimary: 'شرافتمند', statSecondary: '$1,520', score: '815' },
      { rank: 4, nameFa: 'گرگ‌های آمبارینو', tag: 'AMW', statPrimary: 'میانه', statSecondary: '$1,390', score: '760' },
      { rank: 5, nameFa: 'یاغیان رودز', tag: 'RHO', statPrimary: 'یاغی', statSecondary: '$1,180', score: '705' },
      { rank: 6, nameFa: 'کابوی‌های سنت‌دنیس', tag: 'SDC', statPrimary: 'شرافتمند', statSecondary: '$980', score: '640' },
    ],
  },

  APEX: {
    id: 'APEX',
    shortLabel: 'APEX',
    fullTitleFa: 'لیگ قهرمانی APEX',
    subtitleFa: 'حلقه ۳ • ۲۰ اسکواد',
    lobbyCountFa: '۲۰ اسکواد در مچ',
    hologramTitleFa: "نقشه حلقه World's Edge",
    hologramSubtitleFa: 'حلقه ۳ • ۲۰ اسکواد',
    roomLabelFa: 'میز فرماندهی سفینه پرش',
    colors: {
      primary: '#DA292A',
      secondary: '#F3F4F6',
      accent: '#1F2937',
      roomBg: '#090B10',
      roomFog: '#0E1118',
      hudSurface: 'rgba(17, 21, 29, 0.86)',
      hudBorder: 'rgba(218, 41, 42, 0.42)',
      ctaText: '#FFFFFF',
      primaryRgb: '218, 41, 42',
      secondaryRgb: '243, 244, 246',
      accentRgb: '31, 41, 55',
    },
    threeLighting: {
      keyHex: 0xf3f4f6,
      fillSkyHex: 0xd1d5db,
      fillGroundHex: 0x1f2937,
      rimHex: 0xda292a,
      hologramPrimaryHex: 0xda292a,
      hologramSecondaryHex: 0xf3f4f6,
      hologramAccentHex: 0x9ca3af,
      pedestalTrimHex: 0xda292a,
      bloomStrength: 0.46,
    },
    fonts: {
      display: "'Orbitron', 'Teko', sans-serif",
      numeral: "'Orbitron', 'Teko', sans-serif",
      persian: "'Vazirmatn', system-ui, sans-serif",
      persianHeading: "'Vazirmatn', system-ui, sans-serif",
    },
    shapeStyle: 'scifi',
    roster: {
      groupLabelFa: 'اسکواد شما',
      filledCount: 2,
      totalCount: 3,
      inviteCandidateHandle: '@eli_lifeline',
      inviteCandidateNameFa: 'الی (Support)',
      slots: [
        { id: 'apx-aslt', roleLabel: 'Assault', isLtrRole: true, memberHandle: '@kaveh_wraith', memberNameFa: 'کاوه', filled: true },
        { id: 'apx-rcn', roleLabel: 'Recon', isLtrRole: true, memberHandle: '@mina_seer', memberNameFa: 'مینا', filled: true },
        { id: 'apx-sup', roleLabel: 'Support', isLtrRole: true, emptyLabel: '+ Support خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی', valueDisplay: '#4', isLtrValue: true, highlight: true },
      { id: 'rp', labelFa: 'امتیاز RP', valueDisplay: '14,820', isLtrValue: true },
      { id: 'dmg', labelFa: 'آسیب کل', valueDisplay: '3,460', isLtrValue: true },
    ],
    primaryCtaFa: 'آماده پرش (Drop)',
    readyCtaFa: 'جامپ‌مستر تایید شد • آماده پرش',
    readyToastFa: 'مسیر فرود به Fragment East در سفینه ثبت شد.',
    standingsHeaders: {
      teamColFa: 'اسکواد',
      stat1ColFa: 'آسیب',
      stat2ColFa: 'حذف',
      scoreColFa: 'امتیاز RP',
      ruleBadgeFa: 'حلقه ۳ • ۲۰ اسکواد در مچ • سیستم امتیازدهی ALGS',
    },
    turntableVideo: {
      src: '/assets/aistudio/Generated_Video_November_19__2026_-_7_12PM_50a21d7a.mp4',
      ariaLabelFa: "نمای سه‌بعدی تعاملی برج هاروستر World's Edge در APEX — برای چرخش افقی بکشید",
      pins: [
        { label: 'HARVESTER · BEAM', top: '34%', right: '26%', accent: 'primary' },
        { label: 'RING 3 · LAVA', top: '49%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'والکیری اکس', tag: 'VLX', statPrimary: '4,290', statSecondary: '14', score: '16,450' },
      { rank: 2, nameFa: 'اسکارلت اپکس', tag: 'SCA', statPrimary: '3,980', statSecondary: '12', score: '15,910' },
      { rank: 3, nameFa: 'استورم پوینت', tag: 'STP', statPrimary: '3,740', statSecondary: '11', score: '15,280' },
      { rank: 4, nameFa: 'تایتان اسکواد', tag: 'TTN', statPrimary: '3,460', statSecondary: '10', score: '14,820', isUserTeam: true },
      { rank: 5, nameFa: 'فرگمنت وایپرز', tag: 'FGV', statPrimary: '3,110', statSecondary: '8', score: '14,190' },
      { rank: 6, nameFa: 'نوا دراپ', tag: 'NVD', statPrimary: '2,890', statSecondary: '7', score: '13,640' },
      { rank: 7, nameFa: 'هوریزون بلید', tag: 'HZB', statPrimary: '2,650', statSecondary: '6', score: '12,990' },
    ],
  },
};

export function resolveTournamentGameFromLobby(
  lobbyGameId?: string | null
): TournamentGameId {
  const norm = (lobbyGameId ?? '').toUpperCase().trim();
  if (norm === 'NBA2K' || norm === 'NBA') return 'NBA2K';
  if (norm === 'FORTNITE' || norm === 'FN') return 'FORTNITE';
  if (norm === 'DOTA2' || norm === 'DOTA' || norm === 'LOL' || norm === 'MOBA') return 'DOTA2';
  if (norm === 'F1' || norm === 'RACING' || norm === 'MOTORSPORT') return 'F1';
  if (norm === 'WARZONE' || norm === 'COD') return 'WARZONE';
  if (norm === 'CS2') return 'CS2';
  if (norm === 'GTA') return 'GTA';
  if (norm === 'RDR2') return 'RDR2';
  if (norm === 'APEX' || norm === 'VALORANT') return 'APEX';
  return 'FC27';
}

export function getRosterCountDisplay(
  theme: GameThemeConfig,
  filledEmptySlotIds: Record<string, boolean>
): { filled: number; total: number; headerTextFa: string } {
  const extraFilled = theme.roster.slots.filter(
    (s) => !s.filled && Boolean(filledEmptySlotIds[s.id])
  ).length;
  const filled = Math.min(theme.roster.totalCount, theme.roster.filledCount + extraFilled);
  return {
    filled,
    total: theme.roster.totalCount,
    headerTextFa: `${theme.roster.groupLabelFa} (${toPersianNum(filled)} از ${toPersianNum(theme.roster.totalCount)})`,
  };
}
