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
  roleLabelEn?: string;
  isLtrRole?: boolean;
  memberHandle?: string;
  memberNameFa?: string;
  memberNameEn?: string;
  emptyLabel?: string;
  emptyLabelEn?: string;
  filled: boolean;
}

export interface TournamentMetricItem {
  id: string;
  labelFa: string;
  labelEn?: string;
  valueDisplay: string;
  valueDisplayEn?: string;
  subHintFa?: string;
  isLtrValue?: boolean;
  highlight?: boolean;
}

export interface TournamentStandingRow {
  rank: number;
  nameFa: string;
  nameEn?: string;
  tag: string;
  statPrimary: string;
  statPrimaryEn?: string;
  statSecondary: string;
  score: string;
  isUserTeam?: boolean;
}

export interface GameThemeConfig {
  id: TournamentGameId;
  shortLabel: string;
  fullTitleFa: string;
  fullTitleEn: string;
  subtitleFa: string;
  subtitleEn: string;
  lobbyCountFa: string;
  lobbyCountEn: string;
  hologramTitleFa: string;
  hologramTitleEn?: string;
  hologramSubtitleFa: string;
  hologramSubtitleEn: string;
  roomLabelFa: string;
  roomLabelEn: string;
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
      groupLabelEn?: string;
    filledCount: number;
    totalCount: number;
    inviteCandidateHandle: string;
    inviteCandidateNameFa: string;
      inviteCandidateNameEn?: string;
    slots: SquadRoleSlot[];
  };
  metrics: [TournamentMetricItem, TournamentMetricItem, TournamentMetricItem];
  primaryCtaFa: string;
  primaryCtaEn: string;
  readyCtaFa: string;
  readyCtaEn: string;
  readyToastFa: string;
  readyToastEn: string;
  standingsHeaders: {
    teamColFa: string;
    stat1ColFa: string;
    stat2ColFa: string;
    scoreColFa: string;
    ruleBadgeFa: string;
    teamColEn?: string;
    stat1ColEn?: string;
    stat2ColEn?: string;
    scoreColEn?: string;
    ruleBadgeEn?: string;
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
      fullTitleEn: 'FC 27 Champions League',
    subtitleFa: 'پرشیا یونایتد vs آتلتیکو پارس',
      subtitleEn: 'Persia United vs Atletico Pars',
    lobbyCountFa: '۱۶ باشگاه در لیگ',
      lobbyCountEn: '16 clubs in the league',
    hologramTitleFa: 'زمین تاکتیکی استادیوم',
      hologramTitleEn: 'Stadium Tactical Pitch',
    hologramSubtitleFa: 'پرشیا یونایتد vs آتلتیکو پارس',
      hologramSubtitleEn: 'Persia United vs Atletico Pars',
    roomLabelFa: 'رختکن بارانی استادیوم',
      roomLabelEn: 'Rainy Stadium Locker Room',
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
      groupLabelEn: 'Your Club',
      filledCount: 10,
      totalCount: 11,
      inviteCandidateHandle: '@saeed_gk1',
      inviteCandidateNameFa: 'سعید (دروازه‌بان)',
      inviteCandidateNameEn: 'Saeed (Goalkeeper)',
      slots: [
        { id: 'fc-st', roleLabel: 'ST', isLtrRole: true, memberHandle: '@parsa_fc', memberNameFa: 'پارسا',
        memberNameEn: 'Parsa', filled: true },
        { id: 'fc-cam', roleLabel: 'CAM', isLtrRole: true, memberHandle: '@aria_10', memberNameFa: 'آریا',
        memberNameEn: 'Arya', filled: true },
        { id: 'fc-cb', roleLabel: 'CB', isLtrRole: true, memberHandle: '@kian_cb', memberNameFa: 'کیان',
        memberNameEn: 'Kian', filled: true },
        { id: 'fc-gk', roleLabel: 'GK', isLtrRole: true, emptyLabel: '+ GK خالی', emptyLabelEn: '+ Free GK', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی',
        labelEn: 'Current rank', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'pts', labelFa: 'امتیاز کل',
        labelEn: 'Total points', valueDisplay: '27', isLtrValue: true },
      { id: 'gd', labelFa: 'تفاضل گل',
        labelEn: 'Goal difference', valueDisplay: '+14', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به رختکن مسابقه',
      primaryCtaEn: 'Enter the match locker room',
    readyCtaFa: 'حاضر در رختکن • آماده سوت آغاز',
      readyCtaEn: 'In the locker room - Ready for kickoff',
    readyToastFa: 'ترکیب باشگاه در رختکن FC 27 ثبت شد.',
      readyToastEn: 'Your FC 27 squad was registered in the locker room.',
    standingsHeaders: {
      teamColFa: 'باشگاه',
      teamColEn: 'Club',
      stat1ColFa: 'برد',
      stat1ColEn: 'Wins',
      stat2ColFa: 'تفاضل',
      stat2ColEn: 'GD',
      scoreColFa: 'امتیاز',
      scoreColEn: 'Points',
      ruleBadgeFa: '۱۶ باشگاه در لیگ • صعود ۴ تیم برتر به پلی‌آف',
      ruleBadgeEn: '16 clubs in the league - Top 4 advance to the play-off',
    },
    turntableVideo: {
      src: '/assets/aistudio/spatial_stadium_loop_9528C2CF_39592eeb.mp4',
      ariaLabelFa: 'نمای سه‌بعدی تعاملی استادیوم FC 27 — برای چرخش افقی بکشید',
      pins: [
        { label: 'ST · PENALTY BOX', top: '38%', right: '26%', accent: 'primary' },
        { label: 'CAM · BUILD-UP', top: '47%', left: '25%', accent: 'secondary' },
      ],
    },
    standings: [
      { rank: 1, nameFa: 'آتلتیکو پارس',
      nameEn: 'Atletico Pars', tag: 'ATP', statPrimary: '9', statSecondary: '+18', score: '29' },
      { rank: 2, nameFa: 'پرشیا یونایتد',
      nameEn: 'Persia United', tag: 'PRU', statPrimary: '8', statSecondary: '+14', score: '27', isUserTeam: true },
      { rank: 3, nameFa: 'رویال تهران FC',
      nameEn: 'Royal Tehran FC', tag: 'RTF', statPrimary: '8', statSecondary: '+11', score: '25' },
      { rank: 4, nameFa: 'زاگرس سیتی',
      nameEn: 'Zagros City', tag: 'ZGC', statPrimary: '7', statSecondary: '+8', score: '23' },
      { rank: 5, nameFa: 'خلیج استارز',
      nameEn: 'Gulf Stars', tag: 'KHS', statPrimary: '6', statSecondary: '+4', score: '20' },
      { rank: 6, nameFa: 'البرز اتلتیک',
      nameEn: 'Alborz Athletic', tag: 'ALB', statPrimary: '6', statSecondary: '+2', score: '19' },
      { rank: 7, nameFa: 'کاسپین کلاب',
      nameEn: 'Atletico Pars', tag: 'CSP', statPrimary: '5', statSecondary: '-1', score: '17' },
      { rank: 8, nameFa: 'آریا وولوز',
      nameEn: 'Persia United', tag: 'ARW', statPrimary: '4', statSecondary: '-5', score: '14' },
    ],
  },

  NBA2K: {
    id: 'NBA2K',
    shortLabel: 'NBA 2K',
    fullTitleFa: 'پلی‌آف پرو-ام NBA 2K',
      fullTitleEn: 'NBA 2K Pro-Am Playoffs',
    subtitleFa: 'تهران کینگز vs پارس لیکرز',
      subtitleEn: 'Tehran Kings vs Pars Lakers',
    lobbyCountFa: '۱۶ تیم در کنفرانس',
      lobbyCountEn: '16 teams in the conference',
    hologramTitleFa: 'سالن مرکزی پلی‌آف NBA',
      hologramTitleEn: 'NBA Playoffs Main Arena',
    hologramSubtitleFa: 'تهران کینگز vs پارس لیکرز',
      hologramSubtitleEn: 'Tehran Kings vs Pars Lakers',
    roomLabelFa: 'سالن نورپردازی‌شده پارکت',
      roomLabelEn: 'Lit Hardwood Arena',
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
      groupLabelEn: 'Your Pro-Am team',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@soheil_center',
      inviteCandidateNameFa: 'سهیل (سنتر)',
      inviteCandidateNameEn: 'Soheil (Center)',
      slots: [
        { id: 'nba-pg', roleLabel: 'PG', isLtrRole: true, memberHandle: '@amir_pg', memberNameFa: 'امیر',
        memberNameEn: 'Amir', filled: true },
        { id: 'nba-sg', roleLabel: 'SG', isLtrRole: true, memberHandle: '@sina_3pt', memberNameFa: 'سینا',
        memberNameEn: 'Sina', filled: true },
        { id: 'nba-sf', roleLabel: 'SF', isLtrRole: true, memberHandle: '@parsa_sf', memberNameFa: 'پارسا',
        memberNameEn: 'Parsa', filled: true },
        { id: 'nba-pf', roleLabel: 'PF', isLtrRole: true, memberHandle: '@kian_pf', memberNameFa: 'کیان',
        memberNameEn: 'Kian', filled: true },
        { id: 'nba-c', roleLabel: 'C', isLtrRole: true, emptyLabel: '+ C خالی', emptyLabelEn: '+ Free C', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه کنفرانس',
        labelEn: 'Conference rank', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'record', labelFa: 'برد-باخت',
        labelEn: 'W-L record', valueDisplay: '18-4', isLtrValue: true },
      { id: 'ppg', labelFa: 'میانگین امتیاز',
        labelEn: 'Avg points', valueDisplay: '94.6', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به زمین مسابقه',
      primaryCtaEn: 'Enter the match court',
    readyCtaFa: 'حاضر در زمین • آماده تیپ‌آف',
      readyCtaEn: 'On the court - Ready for tip-off',
    readyToastFa: 'ترکیب ۵ نفره شما در سالن پرو-ام NBA 2K ثبت شد.',
      readyToastEn: 'Your 5-player lineup was locked in the NBA 2K Pro-Am arena.',
    standingsHeaders: {
      teamColFa: 'تیم کنفرانس',
      teamColEn: 'Conference team',
      stat1ColFa: 'برد-باخت',
      stat1ColEn: 'W-L',
      stat2ColFa: 'میانگین',
      stat2ColEn: 'Avg',
      scoreColFa: 'درصد برد',
      scoreColEn: 'Win %',
      ruleBadgeFa: '۱۶ تیم در کنفرانس • سری پلی‌آف BO5 پرو-ام',
      ruleBadgeEn: '16 teams in the conference - Pro-Am BO5 play-off series',
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
      { rank: 1, nameFa: 'پارس لیکرز',
      nameEn: 'Pars Lakers', tag: 'PLK', statPrimary: '19-3', statSecondary: '98.2', score: '86%' },
      { rank: 2, nameFa: 'تهران کینگز',
      nameEn: 'Tehran Kings', tag: 'THK', statPrimary: '18-4', statSecondary: '94.6', score: '82%', isUserTeam: true },
      { rank: 3, nameFa: 'البرز باکس',
      nameEn: 'Alborz Box', tag: 'ALB', statPrimary: '16-6', statSecondary: '91.4', score: '73%' },
      { rank: 4, nameFa: 'کاسپین هیت',
      nameEn: 'Caspian Heat', tag: 'CSH', statPrimary: '14-8', statSecondary: '89.0', score: '64%' },
      { rank: 5, nameFa: 'زاگرس سلتیکس',
      nameEn: 'Zagros Celtics', tag: 'ZGC', statPrimary: '12-10', statSecondary: '86.5', score: '55%' },
      { rank: 6, nameFa: 'آریا واریرز',
      nameEn: 'Arya Warriors', tag: 'ARW', statPrimary: '10-12', statSecondary: '84.1', score: '45%' },
    ],
  },

  FORTNITE: {
    id: 'FORTNITE',
    shortLabel: 'FORTNITE',
    fullTitleFa: 'جام FNCS فورتنایت',
      fullTitleEn: 'Fortnite FNCS Cup',
    subtitleFa: 'حلقه ۴ طوفان • قلعه مرکزی',
      subtitleEn: 'Storm Ring 4 - Central Castle',
    lobbyCountFa: '۲۵ اسکواد در لابی',
      lobbyCountEn: '25 squads in the lobby',
    hologramTitleFa: 'جزیره شناور طوفان',
      hologramTitleEn: 'Floating Storm Island',
    hologramSubtitleFa: 'حلقه ۴ طوفان • نبرد ارتفاع',
      hologramSubtitleEn: 'Storm Ring 4 - High-ground fight',
    roomLabelFa: 'جزیره معلق بتل‌باس',
      roomLabelEn: 'Battle Bus Launch Island',
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
      groupLabelEn: 'Your squad',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@omid_tarp',
      inviteCandidateNameFa: 'امید (Support)',
      inviteCandidateNameEn: 'Omid (Support)',
      slots: [
        { id: 'fn-igl', roleLabel: 'IGL', isLtrRole: true, memberHandle: '@aria_edit', memberNameFa: 'آریا',
        memberNameEn: 'Arya', filled: true },
        { id: 'fn-frg', roleLabel: 'Fragger', isLtrRole: true, memberHandle: '@nima_pump', memberNameFa: 'نیما',
        memberNameEn: 'Nima', filled: true },
        { id: 'fn-bld', roleLabel: 'Builder', isLtrRole: true, memberHandle: '@reza_90s', memberNameFa: 'رضا',
        memberNameEn: 'Reza', filled: true },
        { id: 'fn-sup', roleLabel: 'Support', isLtrRole: true, emptyLabel: '+ Support خالی', emptyLabelEn: '+ Free Support', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه جام',
        labelEn: 'Cup rank', valueDisplay: '#1', isLtrValue: true, highlight: true },
      { id: 'vr', labelFa: 'ویکتوری رویال',
        labelEn: 'Victory Royale', valueDisplay: '4 VR', isLtrValue: true },
      { id: 'pts', labelFa: 'امتیاز FNCS',
        labelEn: 'FNCS points', valueDisplay: '284', isLtrValue: true },
    ],
    primaryCtaFa: 'پرش از بتل‌باس',
      primaryCtaEn: 'Jump from the Battle Bus',
    readyCtaFa: 'اسکواد آماده است • مسیر فرود قفل شد',
      readyCtaEn: 'Squad ready - Drop path locked',
    readyToastFa: 'نقطه فرود قلعه مرکزی برای اسکواد فورتنایت ثبت شد.',
      readyToastEn: 'Central Castle landing spot locked for your Fortnite squad.',
    standingsHeaders: {
      teamColFa: 'اسکواد FNCS',
      teamColEn: 'FNCS squad',
      stat1ColFa: 'ویکتوری',
      stat1ColEn: 'Victories',
      stat2ColFa: 'حذف',
      stat2ColEn: 'Elims',
      scoreColFa: 'امتیاز',
      scoreColEn: 'Points',
      ruleBadgeFa: '۲۵ اسکواد در لابی • سیستم امتیازدهی رسمی FNCS',
      ruleBadgeEn: '25 squads in the lobby - Official FNCS scoring system',
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
      { rank: 1, nameFa: 'طوفان آبی',
      nameEn: 'Blue Storm', tag: 'BST', statPrimary: '4 VR', statSecondary: '42', score: '284', isUserTeam: true },
      { rank: 2, nameFa: 'نوا بیلدرز',
      nameEn: 'Nova Builders', tag: 'NVB', statPrimary: '3 VR', statSecondary: '37', score: '261' },
      { rank: 3, nameFa: 'تهران کراون',
      nameEn: 'Tehran Crown', tag: 'THC', statPrimary: '2 VR', statSecondary: '33', score: '240' },
      { rank: 4, nameFa: 'ریفت واکرز',
      nameEn: 'Rift Walkers', tag: 'RFW', statPrimary: '2 VR', statSecondary: '29', score: '218' },
      { rank: 5, nameFa: 'اسکای بیس',
      nameEn: 'Sky Base', tag: 'SKB', statPrimary: '1 VR', statSecondary: '24', score: '195' },
      { rank: 6, nameFa: 'پارس لاما',
      nameEn: 'Pars Llama', tag: 'PLM', statPrimary: '1 VR', statSecondary: '19', score: '172' },
    ],
  },

  DOTA2: {
    id: 'DOTA2',
    shortLabel: 'DOTA 2',
    fullTitleFa: 'تورنمنت بین‌المللی DOTA 2',
      fullTitleEn: 'DOTA 2 International Tournament',
    subtitleFa: 'نبرد رودخانه • دفاع از انشنت',
      subtitleEn: 'River fight - Defend the Ancient',
    lobbyCountFa: '۸ تیم در پلی‌آف',
      lobbyCountEn: '8 teams in the play-off',
    hologramTitleFa: 'نقشه سه‌لاین انشنت',
      hologramTitleEn: 'Three-lane Ancient map',
    hologramSubtitleFa: 'کنترل رودخانه و برج‌های میانی',
      hologramSubtitleEn: 'River control and mid towers',
    roomLabelFa: 'تالار باستانی کریستال',
      roomLabelEn: 'Crystal Ancient Hall',
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
      groupLabelEn: 'Your draft team',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@behzad_pos5',
      inviteCandidateNameFa: 'بهزاد (Hard Sup)',
      inviteCandidateNameEn: 'Behzad (Hard Support)',
      slots: [
        { id: 'dota-p1', roleLabel: 'Carry', isLtrRole: true, memberHandle: '@kaveh1', memberNameFa: 'کاوه',
        memberNameEn: 'Kaveh', filled: true },
        { id: 'dota-p2', roleLabel: 'Mid', isLtrRole: true, memberHandle: '@dorsa2', memberNameFa: 'درسا',
        memberNameEn: 'Dorsa', filled: true },
        { id: 'dota-p3', roleLabel: 'Offlane', isLtrRole: true, memberHandle: '@mahdi3', memberNameFa: 'مهدی',
        memberNameEn: 'Mehdi', filled: true },
        { id: 'dota-p4', roleLabel: 'Pos 4', isLtrRole: true, memberHandle: '@tara4', memberNameFa: 'تارا',
        memberNameEn: 'Tara', filled: true },
        { id: 'dota-p5', roleLabel: 'Pos 5', isLtrRole: true, emptyLabel: '+ P5 خالی', emptyLabelEn: '+ Free P5', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه براکت',
        labelEn: 'Bracket rank', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'kda', labelFa: 'میانگین KDA',
        labelEn: 'Avg KDA', valueDisplay: '5.4', isLtrValue: true },
      { id: 'prize', labelFa: 'جایزه کل',
        labelEn: 'Total prize', valueDisplay: '$5,000', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به درفت هیرو',
      primaryCtaEn: 'Enter hero draft',
    readyCtaFa: 'درفت قفل شد • آماده نبرد انشنت',
      readyCtaEn: 'Draft locked - Ready for the Ancients fight',
    readyToastFa: 'تیم شما وارد فاز انتخاب هیرو (Captains Mode) شد.',
      readyToastEn: 'Your team entered the Captains Mode hero selection phase.',
    standingsHeaders: {
      teamColFa: 'تیم پلی‌آف',
      teamColEn: 'Play-off team',
      stat1ColFa: 'برد-باخت',
      stat1ColEn: 'W-L',
      stat2ColFa: 'میانگین KDA',
      stat2ColEn: 'Avg KDA',
      scoreColFa: 'امتیاز DPC',
      scoreColEn: 'DPC points',
      ruleBadgeFa: '۸ تیم در پلی‌آف • فرمت Captains Mode BO3',
      ruleBadgeEn: '8 teams in the play-off - Captains Mode BO3 format',
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
      { rank: 1, nameFa: 'اژدهای رادیانت',
      nameEn: 'Radiant Dragon', tag: 'RDR', statPrimary: '7-1', statSecondary: '6.1', score: '1,420' },
      { rank: 2, nameFa: 'نگهبانان انشنت',
      nameEn: 'Ancient Guardians', tag: 'ANG', statPrimary: '6-2', statSecondary: '5.4', score: '1,290', isUserTeam: true },
      { rank: 3, nameFa: 'شوالیه‌های دایر',
      nameEn: 'Dire Knights', tag: 'DRK', statPrimary: '5-3', statSecondary: '4.9', score: '1,150' },
      { rank: 4, nameFa: 'طوفان رونه',
      nameEn: 'Rune Storm', tag: 'RNS', statPrimary: '4-4', statSecondary: '4.3', score: '980' },
      { rank: 5, nameFa: 'پارس روشان',
      nameEn: 'Pars Roshan', tag: 'PRS', statPrimary: '3-5', statSecondary: '3.8', score: '840' },
      { rank: 6, nameFa: 'سایه میدلاین',
      nameEn: 'Midlane Shadow', tag: 'SMD', statPrimary: '2-6', statSecondary: '3.2', score: '690' },
    ],
  },

  F1: {
    id: 'F1',
    shortLabel: 'F1',
    fullTitleFa: 'گرندپری شبانه F1',
      fullTitleEn: 'F1 Night Grand Prix',
    subtitleFa: 'پیست بارانی • پیت‌لین مرکزی',
      subtitleEn: 'Wet track - Central pit lane',
    lobbyCountFa: '۱۰ تیم در گرندپری',
      lobbyCountEn: '10 teams in the Grand Prix',
    hologramTitleFa: 'مدار مسابقه و گاراژ F1',
      hologramTitleEn: 'F1 race circuit and garage',
    hologramSubtitleFa: 'پیچ ۱ بارانی • استراتژی پیت‌استاپ',
      hologramSubtitleEn: 'Wet Turn 1 - Pit-stop strategy',
    roomLabelFa: 'گاراژ پیت‌لین شبانه',
      roomLabelEn: 'Night Pit Lane Garage',
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
      groupLabelEn: 'Your racing team',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@sina_tele',
      inviteCandidateNameFa: 'سینا (تله‌متری)',
      inviteCandidateNameEn: 'Sina (Telemetry)',
      slots: [
        { id: 'f1-d1', roleLabel: 'Driver 1', isLtrRole: true, memberHandle: '@parsa_f1', memberNameFa: 'پارسا',
        memberNameEn: 'Parsa', filled: true },
        { id: 'f1-d2', roleLabel: 'Driver 2', isLtrRole: true, memberHandle: '@aria_apex', memberNameFa: 'آریا',
        memberNameEn: 'Arya', filled: true },
        { id: 'f1-eng', roleLabel: 'Race Eng', isLtrRole: true, memberHandle: '@nima_pit', memberNameFa: 'نیما',
        memberNameEn: 'Nima', filled: true },
        { id: 'f1-tel', roleLabel: 'Telemetry', isLtrRole: true, emptyLabel: '+ Tele خالی', emptyLabelEn: '+ Free Telemetry', filled: false },
      ],
    },
    metrics: [
      { id: 'pos', labelFa: 'جایگاه استارت',
        labelEn: 'Grid position', valueDisplay: 'P1', isLtrValue: true, highlight: true },
      { id: 'lap', labelFa: 'سریع‌ترین دور',
        labelEn: 'Fastest lap', valueDisplay: '1:18.4', isLtrValue: true },
      { id: 'pts', labelFa: 'امتیاز تیم',
        labelEn: 'Team points', valueDisplay: '412', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به پیت‌لین مسابقه',
      primaryCtaEn: 'Enter the race pit lane',
    readyCtaFa: 'لاستیک بارانی نصب شد • آماده استارت',
      readyCtaEn: 'Rain tires fitted - Ready to start',
    readyToastFa: 'استراتژی پیت‌استاپ دوگانه برای گرندپری ثبت شد.',
      readyToastEn: 'The double pit-stop strategy was locked for the Grand Prix.',
    standingsHeaders: {
      teamColFa: 'تیم سازنده',
      teamColEn: 'Constructor',
      stat1ColFa: 'برد',
      stat1ColEn: 'Wins',
      stat2ColFa: 'سریع‌ترین دور',
      stat2ColEn: 'Fastest lap',
      scoreColFa: 'امتیاز',
      scoreColEn: 'Points',
      ruleBadgeFa: '۱۰ تیم در گرندپری • ۵۸ دور در پیست بارانی',
      ruleBadgeEn: '10 teams in the Grand Prix - 58 laps on a wet track',
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
      { rank: 1, nameFa: 'پرشیا موتوراسپورت',
      nameEn: 'Persia Motorsport', tag: 'PMS', statPrimary: '7', statSecondary: '1:18.4', score: '412', isUserTeam: true },
      { rank: 2, nameFa: 'اسکودریا پارس',
      nameEn: 'Scuderia Pars', tag: 'SCP', statPrimary: '6', statSecondary: '1:18.9', score: '389' },
      { rank: 3, nameFa: 'سیلور ارو تهران',
      nameEn: 'Silver Arrow Tehran', tag: 'SAT', statPrimary: '4', statSecondary: '1:19.2', score: '348' },
      { rank: 4, nameFa: 'البرز توربو',
      nameEn: 'Alborz Turbo', tag: 'ALT', statPrimary: '3', statSecondary: '1:19.6', score: '304' },
      { rank: 5, nameFa: 'کاسپین جی‌تی',
      nameEn: 'Caspian GT', tag: 'CGT', statPrimary: '1', statSecondary: '1:20.1', score: '256' },
      { rank: 6, nameFa: 'زاگرس ایرو',
      nameEn: 'Zagros Aero', tag: 'ZGA', statPrimary: '0', statSecondary: '1:20.7', score: '211' },
    ],
  },

  WARZONE: {
    id: 'WARZONE',
    shortLabel: 'WARZONE',
    fullTitleFa: 'عملیات تاکتیکی WARZONE',
      fullTitleEn: 'WARZONE Tactical Ops',
    subtitleFa: 'نقطه فرود: Superstore',
      subtitleEn: 'Drop point: Superstore',
    lobbyCountFa: '۱۲ اسکواد در لابی',
      lobbyCountEn: '12 squads in the lobby',
    hologramTitleFa: 'نقشه عملیاتی Urzikstan',
      hologramTitleEn: 'Urzikstan Ops map',
    hologramSubtitleFa: 'نقطه فرود: Superstore',
      hologramSubtitleEn: 'Drop point: Superstore',
    roomLabelFa: 'اتاق تسلیحات عملیات ویژه',
      roomLabelEn: 'Special Ops Armory Room',
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
      groupLabelEn: 'Your squad',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@omid_medic',
      inviteCandidateNameFa: 'امید (ساپورت)',
      inviteCandidateNameEn: 'Omid (Support)',
      slots: [
        { id: 'wz-cmd', roleLabel: 'فرمانده', memberHandle: '@nima_ops', memberNameFa: 'نیما',
        memberNameEn: 'Nima', filled: true },
        { id: 'wz-snp', roleLabel: 'اسنایپر', memberHandle: '@sina_kar98', memberNameFa: 'سینا',
        memberNameEn: 'Sina', filled: true },
        { id: 'wz-rsh', roleLabel: 'راشر', memberHandle: '@reza_smg', memberNameFa: 'رضا',
        memberNameEn: 'Reza', filled: true },
        { id: 'wz-sup', roleLabel: 'ساپورت', roleLabelEn: 'Support', emptyLabel: '+ ساپورت خالی', emptyLabelEn: '+ Free Support', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی',
        labelEn: 'Current rank', valueDisplay: '#3', isLtrValue: true, highlight: true },
      { id: 'pts', labelFa: 'امتیاز کل',
        labelEn: 'Total score', valueDisplay: '48', isLtrValue: true },
      { id: 'rule', labelFa: 'قانون: هر کیل ۱ امتیاز',
        labelEn: 'Rule: 1 pt per kill', valueDisplay: '19 KILLS', isLtrValue: true },
    ],
    primaryCtaFa: 'استقرار اسکواد در لابی',
      primaryCtaEn: 'Deploy squad to lobby',
    readyCtaFa: 'اسکواد مستقر شد • آماده پرش',
      readyCtaEn: 'Squad deployed - Ready to jump',
    readyToastFa: 'مختصات Superstore برای اسکواد ارسال شد.',
      readyToastEn: 'Superstore coordinates were sent to the squad.',
    standingsHeaders: {
      teamColFa: 'اسکواد',
      teamColEn: 'Squad',
      stat1ColFa: 'کیل',
      stat1ColEn: 'Kills',
      stat2ColFa: 'بقا',
      stat2ColEn: 'Survival',
      scoreColFa: 'امتیاز کل',
      scoreColEn: 'Score',
      ruleBadgeFa: '۱۲ اسکواد در لابی • قانون: هر کیل ۱ امتیاز + امتیاز بقا',
      ruleBadgeEn: '12 squads in the lobby - Rule: 1 point per kill + survival bonus',
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
      { rank: 1, nameFa: 'تاسک‌فورس آلفا',
      nameEn: 'Taskforce Alpha', tag: 'TFA', statPrimary: '24', statSecondary: '1st', score: '56' },
      { rank: 2, nameFa: 'شبح صحرا',
      nameEn: 'Desert Ghost', tag: 'DSG', statPrimary: '21', statSecondary: '2nd', score: '51' },
      { rank: 3, nameFa: 'اسکواد طوفان',
      nameEn: 'Storm Squad', tag: 'STM', statPrimary: '19', statSecondary: '3rd', score: '48', isUserTeam: true },
      { rank: 4, nameFa: 'گرگ‌های شب',
      nameEn: 'Night Wolves', tag: 'NWV', statPrimary: '17', statSecondary: '4th', score: '43' },
      { rank: 5, nameFa: 'دلتا ۹۹',
      nameEn: 'Delta 99', tag: 'D99', statPrimary: '14', statSecondary: '5th', score: '37' },
      { rank: 6, nameFa: 'کبرا تاکتیکال',
      nameEn: 'Cobra Tactical', tag: 'CBR', statPrimary: '12', statSecondary: '6th', score: '31' },
      { rank: 7, nameFa: 'سایه‌های ریبیرث',
      nameEn: 'Taskforce Alpha', tag: 'RBS', statPrimary: '10', statSecondary: '7th', score: '26' },
    ],
  },

  CS2: {
    id: 'CS2',
    shortLabel: 'CS2',
    fullTitleFa: 'تورنمنت پریمیر CS2',
      fullTitleEn: 'CS2 Premier Tournament',
    subtitleFa: 'هدف تاکتیکی: سایت A',
      subtitleEn: 'Target: A site',
    lobbyCountFa: '۸ تیم در براکت',
      lobbyCountEn: '8 teams in the bracket',
    hologramTitleFa: 'نقشه تاکتیکی Mirage',
      hologramTitleEn: 'Mirage tactical map',
    hologramSubtitleFa: 'هدف تاکتیکی: سایت A',
      hologramSubtitleEn: 'Target: A site',
    roomLabelFa: 'اتاق بریفینگ ای‌اسپورتس',
      roomLabelEn: 'Esports Briefing Room',
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
      groupLabelEn: 'Your team',
      filledCount: 4,
      totalCount: 5,
      inviteCandidateHandle: '@soheil_lrk',
      inviteCandidateNameFa: 'سهیل (Lurker)',
      inviteCandidateNameEn: 'Soheil (Lurker)',
      slots: [
        { id: 'cs-igl', roleLabel: 'IGL', isLtrRole: true, memberHandle: '@artin_igl', memberNameFa: 'آرتین',
        memberNameEn: 'Artin', filled: true },
        { id: 'cs-awp', roleLabel: 'AWPer', isLtrRole: true, memberHandle: '@nima_awp', memberNameFa: 'نیما',
        memberNameEn: 'Nima', filled: true },
        { id: 'cs-ent', roleLabel: 'Entry', isLtrRole: true, memberHandle: '@dorsa_ak', memberNameFa: 'درسا',
        memberNameEn: 'Dorsa', filled: true },
        { id: 'cs-sup', roleLabel: 'Support', isLtrRole: true, memberHandle: '@amir_util', memberNameFa: 'امیر',
        memberNameEn: 'Amir', filled: true },
        { id: 'cs-lrk', roleLabel: 'Lurker', isLtrRole: true, emptyLabel: '+ Lurker خالی', emptyLabelEn: '+ Free Lurker', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی',
        labelEn: 'Current rank', valueDisplay: '#1', isLtrValue: true, highlight: true },
      { id: 'streak', labelFa: 'برد متوالی',
        labelEn: 'Win streak', valueDisplay: '6W', isLtrValue: true },
      { id: 'prize', labelFa: 'جایزه',
        labelEn: 'Prize', valueDisplay: '$2,500', isLtrValue: true },
    ],
    primaryCtaFa: 'آماده ورود به مچ',
      primaryCtaEn: 'Ready to queue',
    readyCtaFa: 'تایید شد • در انتظار وتو مپ',
      readyCtaEn: 'Confirmed - Waiting for map veto',
    readyToastFa: 'تیم برای اجرای استراتژی A-Site میراژ آماده شد.',
      readyToastEn: 'Team ready for the Mirage A-site execute.',
    standingsHeaders: {
      teamColFa: 'تیم براکت',
      teamColEn: 'Bracket team',
      stat1ColFa: 'برد-باخت',
      stat1ColEn: 'W-L',
      stat2ColFa: 'راند',
      stat2ColEn: 'Rounds',
      scoreColFa: 'امتیاز',
      scoreColEn: 'Points',
      ruleBadgeFa: '۸ تیم در براکت • فرمت BO3 پریمیر',
      ruleBadgeEn: '8 teams in the bracket - Premier BO3 format',
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
      { rank: 1, nameFa: 'سایبر وایپرز',
      nameEn: 'Cyber Vipers', tag: 'CVP', statPrimary: '6-0', statSecondary: '+34', score: '24,800', isUserTeam: true },
      { rank: 2, nameFa: 'اینفرنو کارتل',
      nameEn: 'Inferno Cartel', tag: 'INF', statPrimary: '5-1', statSecondary: '+21', score: '23,150' },
      { rank: 3, nameFa: 'میراژ فانتوم',
      nameEn: 'Mirage Phantom', tag: 'MPH', statPrimary: '4-2', statSecondary: '+12', score: '21,400' },
      { rank: 4, nameFa: 'انوبیس الیت',
      nameEn: 'Anubis Elite', tag: 'ANB', statPrimary: '4-2', statSecondary: '+6', score: '20,650' },
      { rank: 5, nameFa: 'تهران ایم',
      nameEn: 'Tehran Aim', tag: 'THN', statPrimary: '3-3', statSecondary: '-2', score: '19,200' },
      { rank: 6, nameFa: 'زیرو پیک',
      nameEn: 'Zero Peek', tag: 'ZPK', statPrimary: '2-4', statSecondary: '-11', score: '17,900' },
      { rank: 7, nameFa: 'دابل دورز',
      nameEn: 'Cyber Vipers', tag: 'DDR', statPrimary: '1-5', statSecondary: '-24', score: '16,100' },
      { rank: 8, nameFa: 'فلش‌بنگ پرو',
      nameEn: 'Inferno Cartel', tag: 'FBP', statPrimary: '0-6', statSecondary: '-36', score: '14,800' },
    ],
  },

  GTA: {
    id: 'GTA',
    shortLabel: 'GTA',
    fullTitleFa: 'رقابت کروهای GTA',
      fullTitleEn: 'GTA Crew Rivalry',
    subtitleFa: 'هدف: سرقت کازینو',
      subtitleEn: 'Objective: Casino Heist',
    lobbyCountFa: '۶ کرو در رقابت',
      lobbyCountEn: '6 crews competing',
    hologramTitleFa: 'نقشه منطقه کازینو وایس‌سیتی',
      hologramTitleEn: 'Vice City Casino district map',
    hologramSubtitleFa: 'هدف: سرقت کازینو',
      hologramSubtitleEn: 'Objective: Casino Heist',
    roomLabelFa: 'پنت‌هاوس نئونی بارانی',
      roomLabelEn: 'Rainy Neon Penthouse',
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
      groupLabelEn: 'Your crew',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@pouya_gunner',
      inviteCandidateNameFa: 'پویا (تیرانداز)',
      inviteCandidateNameEn: 'Pouya (Gunner)',
      slots: [
        { id: 'gta-mm', roleLabel: 'مغز متفکر', memberHandle: '@parsa_vice', memberNameFa: 'پارسا',
        memberNameEn: 'Parsa', filled: true },
        { id: 'gta-drv', roleLabel: 'راننده', memberHandle: '@mahdi_gt', memberNameFa: 'مهدی',
        memberNameEn: 'Mehdi', filled: true },
        { id: 'gta-hck', roleLabel: 'هکر', memberHandle: '@sara_net', memberNameFa: 'سارا',
        memberNameEn: 'Sara', filled: true },
        { id: 'gta-gun', roleLabel: 'تیرانداز', roleLabelEn: 'Gunner', emptyLabel: '+ تیرانداز خالی', emptyLabelEn: '+ Free Gunner', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه کرو',
        labelEn: 'Crew rank', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'share', labelFa: 'سهم جایزه',
        labelEn: 'Prize cut', valueDisplay: '$4.2M', isLtrValue: true },
      { id: 'wanted', labelFa: 'سطح تحت تعقیب',
        labelEn: 'Wanted level', valueDisplay: '★★★★☆', isLtrValue: true },
    ],
    primaryCtaFa: 'شروع عملیات کرو',
      primaryCtaEn: 'Start crew operation',
    readyCtaFa: 'عملیات فعال شد • مسیر فرار باز است',
      readyCtaEn: 'Operation live - Escape route open',
    readyToastFa: 'نقشه گاوصندوق کازینو برای اعضای کرو همگام شد.',
      readyToastEn: 'Casino vault map synced for the crew.',
    standingsHeaders: {
      teamColFa: 'کرو',
      teamColEn: 'Crew',
      stat1ColFa: 'تعقیب',
      stat1ColEn: 'Pursuit',
      stat2ColFa: 'سهم',
      stat2ColEn: 'Cut',
      scoreColFa: 'اعتبار REP',
      scoreColEn: 'REP',
      ruleBadgeFa: '۶ کرو در رقابت • سریع‌ترین فرار با بیشترین غنیمت',
      ruleBadgeEn: '6 crews competing - Fastest escape takes the biggest cut',
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
      { rank: 1, nameFa: 'سندیکای نئون',
      nameEn: 'Neon Syndicate', tag: 'NSY', statPrimary: '★★★★★', statSecondary: '$4.8M', score: '18,900' },
      { rank: 2, nameFa: 'وایس فانتومز',
      nameEn: 'Vice Phantoms', tag: 'VPH', statPrimary: '★★★★☆', statSecondary: '$4.2M', score: '17,450', isUserTeam: true },
      { rank: 3, nameFa: 'کارتل واین‌وود',
      nameEn: 'Vinewood Cartel', tag: 'VWC', statPrimary: '★★★★☆', statSecondary: '$3.7M', score: '15,820' },
      { rank: 4, nameFa: 'شب‌روهای دل‌پرو',
      nameEn: 'Heartbreak Nights', tag: 'DPR', statPrimary: '★★★☆☆', statSecondary: '$3.1M', score: '14,100' },
      { rank: 5, nameFa: 'میدنایت کلاب',
      nameEn: 'Midnight Club', tag: 'MNC', statPrimary: '★★★☆☆', statSecondary: '$2.6M', score: '12,550' },
      { rank: 6, nameFa: 'پنت‌هاوس اکس',
      nameEn: 'Penthouse X', tag: 'PHX', statPrimary: '★★☆☆☆', statSecondary: '$2.1M', score: '10,900' },
    ],
  },

  RDR2: {
    id: 'RDR2',
    shortLabel: 'RDR2',
    fullTitleFa: 'دوئل دسته‌های RDR2',
      fullTitleEn: 'RDR2 Posse Duels',
    subtitleFa: 'منطقه: Valentine',
      subtitleEn: 'Region: Valentine',
    lobbyCountFa: '۸ دسته در رقابت',
      lobbyCountEn: '8 posses competing',
    hologramTitleFa: 'نقشه قلمرو دره Valentine',
      hologramTitleEn: 'Valentine Valley territory map',
    hologramSubtitleFa: 'منطقه: Valentine',
      hologramSubtitleEn: 'Region: Valentine',
    roomLabelFa: 'میز فرماندهی گرگ‌ومیش سرحد',
      roomLabelEn: 'Frontier Dusk War Room',
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
      groupLabelEn: 'Your posse',
      filledCount: 3,
      totalCount: 4,
      inviteCandidateHandle: '@behzad_rider',
      inviteCandidateNameFa: 'بهزاد (سوارکار)',
      inviteCandidateNameEn: 'Behzad (Rider)',
      slots: [
        { id: 'rdr-ldr', roleLabel: 'رهبر', roleLabelEn: 'Leader', memberHandle: '@tara_outlaw', memberNameFa: 'تارا',
        memberNameEn: 'Tara', filled: true },
        { id: 'rdr-shp', roleLabel: 'تکتیرانداز', memberHandle: '@arash_deadeye', memberNameFa: 'آرش',
        memberNameEn: 'Arash', filled: true },
        { id: 'rdr-trk', roleLabel: 'ردیاب', memberHandle: '@milad_trail', memberNameFa: 'میلاد',
        memberNameEn: 'Milad', filled: true },
        { id: 'rdr-rdr', roleLabel: 'سوارکار', roleLabelEn: 'Rider', emptyLabel: '+ سوارکار خالی', emptyLabelEn: '+ Free Rider', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه دسته',
        labelEn: 'Posse rank', valueDisplay: '#2', isLtrValue: true, highlight: true },
      { id: 'bounty', labelFa: 'باونتی',
        labelEn: 'Bounty', valueDisplay: '$1,850', isLtrValue: true },
      { id: 'honor', labelFa: 'افتخار',
        labelEn: 'Honor', valueDisplay: 'شرافتمند', valueDisplayEn: 'Honorable', isLtrValue: false },
    ],
    primaryCtaFa: 'ورود به دوئل دسته',
      primaryCtaEn: 'Enter posse duel',
    readyCtaFa: 'زین آماده است • ورود به Valentine',
      readyCtaEn: 'Saddle up - Entering Valentine',
    readyToastFa: 'دسته شما برای تصرف قلمرو Valentine اعلام آمادگی کرد.',
      readyToastEn: 'Your posse declared for the Valentine territory clash.',
    standingsHeaders: {
      teamColFa: 'دسته',
      teamColEn: 'Posse',
      stat1ColFa: 'افتخار',
      stat1ColEn: 'Honor',
      stat2ColFa: 'باونتی',
      stat2ColEn: 'Bounty',
      scoreColFa: 'قلمرو',
      scoreColEn: 'Territory',
      ruleBadgeFa: '۸ دسته در رقابت • کنترل مناطق Valentine و Blackwater',
      ruleBadgeEn: '8 posses competing - Control Valentine & Blackwater',
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
      { rank: 1, nameFa: 'سواران بلک‌واتر',
      nameEn: 'Blackwater Riders', tag: 'BWR', statPrimary: 'یاغی', statPrimaryEn: 'Outlaw', statSecondary: '$2,400', score: '940' },
      { rank: 2, nameFa: 'دسته عقاب سرخ',
      nameEn: 'Red Eagle Posse', tag: 'RDE', statPrimary: 'شرافتمند', statPrimaryEn: 'Honorable', statSecondary: '$1,850', score: '890', isUserTeam: true },
      { rank: 3, nameFa: 'نگهبانان هارتلند',
      nameEn: 'Heartland Watch', tag: 'HLG', statPrimary: 'شرافتمند', statPrimaryEn: 'Honorable', statSecondary: '$1,520', score: '815' },
      { rank: 4, nameFa: 'گرگ‌های آمبارینو',
      nameEn: 'Ambarino Wolves', tag: 'AMW', statPrimary: 'میانه', statPrimaryEn: 'Neutral', statSecondary: '$1,390', score: '760' },
      { rank: 5, nameFa: 'یاغیان رودز',
      nameEn: 'Rhodes Outlaws', tag: 'RHO', statPrimary: 'یاغی', statPrimaryEn: 'Outlaw', statSecondary: '$1,180', score: '705' },
      { rank: 6, nameFa: 'کابوی‌های سنت‌دنیس',
      nameEn: 'Saint-Denis Cowboys', tag: 'SDC', statPrimary: 'شرافتمند', statPrimaryEn: 'Honorable', statSecondary: '$980', score: '640' },
    ],
  },

  APEX: {
    id: 'APEX',
    shortLabel: 'APEX',
    fullTitleFa: 'لیگ قهرمانی APEX',
      fullTitleEn: 'APEX Champions League',
    subtitleFa: 'حلقه ۳ • ۲۰ اسکواد',
      subtitleEn: 'Ring 3 - 20 squads',
    lobbyCountFa: '۲۰ اسکواد در مچ',
      lobbyCountEn: '20 squads in the match',
    hologramTitleFa: "نقشه حلقه World's Edge",
    hologramSubtitleFa: 'حلقه ۳ • ۲۰ اسکواد',
      hologramSubtitleEn: 'Ring 3 - 20 squads',
    roomLabelFa: 'میز فرماندهی سفینه پرش',
      roomLabelEn: 'Dropship Command Deck',
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
      groupLabelEn: 'Your squad',
      filledCount: 2,
      totalCount: 3,
      inviteCandidateHandle: '@eli_lifeline',
      inviteCandidateNameFa: 'الی (Support)',
      inviteCandidateNameEn: 'Eli (Support)',
      slots: [
        { id: 'apx-aslt', roleLabel: 'Assault', isLtrRole: true, memberHandle: '@kaveh_wraith', memberNameFa: 'کاوه',
        memberNameEn: 'Kaveh', filled: true },
        { id: 'apx-rcn', roleLabel: 'Recon', isLtrRole: true, memberHandle: '@mina_seer', memberNameFa: 'مینا',
        memberNameEn: 'Mina', filled: true },
        { id: 'apx-sup', roleLabel: 'Support', isLtrRole: true, emptyLabel: '+ Support خالی', emptyLabelEn: '+ Free Support', filled: false },
      ],
    },
    metrics: [
      { id: 'rank', labelFa: 'رتبه فعلی',
        labelEn: 'Current rank', valueDisplay: '#4', isLtrValue: true, highlight: true },
      { id: 'rp', labelFa: 'امتیاز RP',
        labelEn: 'RP points', valueDisplay: '14,820', isLtrValue: true },
      { id: 'dmg', labelFa: 'آسیب کل',
        labelEn: 'Total damage', valueDisplay: '3,460', isLtrValue: true },
    ],
    primaryCtaFa: 'آماده پرش (Drop)',
      primaryCtaEn: 'Ready to drop',
    readyCtaFa: 'جامپ‌مستر تایید شد • آماده پرش',
      readyCtaEn: 'Jumpmaster confirmed - Ready to drop',
    readyToastFa: 'مسیر فرود به Fragment East در سفینه ثبت شد.',
      readyToastEn: 'Fragment East drop path locked on the dropship.',
    standingsHeaders: {
      teamColFa: 'اسکواد',
      teamColEn: 'Squad',
      stat1ColFa: 'آسیب',
      stat1ColEn: 'Damage',
      stat2ColFa: 'حذف',
      stat2ColEn: 'Elims',
      scoreColFa: 'امتیاز RP',
      scoreColEn: 'RP',
      ruleBadgeFa: 'حلقه ۳ • ۲۰ اسکواد در مچ • سیستم امتیازدهی ALGS',
      ruleBadgeEn: 'Ring 3 - 20 squads - ALGS scoring system',
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
      { rank: 1, nameFa: 'والکیری اکس',
      nameEn: 'Valkyrie X', tag: 'VLX', statPrimary: '4,290', statSecondary: '14', score: '16,450' },
      { rank: 2, nameFa: 'اسکارلت اپکس',
      nameEn: 'Scarlet Apex', tag: 'SCA', statPrimary: '3,980', statSecondary: '12', score: '15,910' },
      { rank: 3, nameFa: 'استورم پوینت',
      nameEn: 'Storm Point', tag: 'STP', statPrimary: '3,740', statSecondary: '11', score: '15,280' },
      { rank: 4, nameFa: 'تایتان اسکواد',
      nameEn: 'Titan Squad', tag: 'TTN', statPrimary: '3,460', statSecondary: '10', score: '14,820', isUserTeam: true },
      { rank: 5, nameFa: 'فرگمنت وایپرز',
      nameEn: 'Fragment Vipers', tag: 'FGV', statPrimary: '3,110', statSecondary: '8', score: '14,190' },
      { rank: 6, nameFa: 'نوا دراپ',
      nameEn: 'Nova Drop', tag: 'NVD', statPrimary: '2,890', statSecondary: '7', score: '13,640' },
      { rank: 7, nameFa: 'هوریزون بلید',
      nameEn: 'Valkyrie X', tag: 'HZB', statPrimary: '2,650', statSecondary: '6', score: '12,990' },
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
): { filled: number; total: number; headerTextFa: string; headerTextEn: string } {
  const extraFilled = theme.roster.slots.filter(
    (s) => !s.filled && Boolean(filledEmptySlotIds[s.id])
  ).length;
  const filled = Math.min(theme.roster.totalCount, theme.roster.filledCount + extraFilled);
  const groupEn = theme.roster.groupLabelEn ?? theme.roster.groupLabelFa;
  return {
    filled,
    total: theme.roster.totalCount,
    headerTextFa: `${theme.roster.groupLabelFa} (${toPersianNum(filled)} از ${toPersianNum(theme.roster.totalCount)})`,
    headerTextEn: `${groupEn} (${filled} of ${theme.roster.totalCount})`,
  };
}

export function getInviteCandidateName(theme: GameThemeConfig, isFa: boolean): string {
  if (isFa) return theme.roster.inviteCandidateNameFa;
  return theme.roster.inviteCandidateNameEn ?? theme.roster.inviteCandidateNameFa;
}
