import { AUDIO_ROOMS, type AudioRoomId } from '../utils/audioAgents';
import { CINEMA_ROOMS, type CinemaRoomId } from '../utils/cinemaAgents';
import {
  type SquadRoleSlot,
  type TournamentMetricItem,
  type TurntableVideoPin,
  toPersianNum,
} from './gameTournamentThemes';

export interface MediaRoomThemeConfig {
  id: string;
  shortLabel: string;
  nativeCode: string;
  fullTitleFa: string;
  subtitleFa: string;
  activeCountFa: string;
  stageTitleFa: string;
  stageSubtitleFa: string;
  roomLabelFa: string;
  videoSrc: string;
  fallbackImageUrl: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    roomBg: string;
    hudSurface: string;
    hudBorder: string;
    ctaText: string;
    primaryRgb: string;
  };
  pins: TurntableVideoPin[];
  roster: {
    groupLabelFa: string;
    inviteCandidateHandle: string;
    slots: SquadRoleSlot[];
  };
  metrics: [TournamentMetricItem, TournamentMetricItem, TournamentMetricItem];
  primaryCtaFa: string;
  readyCtaFa: string;
  readyToastFa: string;
  sheetBtnLabelFa: string;
}

export const CINEMA_ROOM_THEMES: Record<CinemaRoomId, MediaRoomThemeConfig> = {
  movie: {
    id: 'movie',
    shortLabel: 'فیلم سینمایی',
    nativeCode: 'NOIR 4K',
    fullTitleFa: 'سالن نوآر فیلم سینمایی',
    subtitleFa: 'بلید رانر ۲۰۴۹ · نسخه کارگردان',
    activeCountFa: '۱۴۸ بیننده زنده',
    stageTitleFa: 'صحنه ۳۶۰° سالن نوآر کلاسیک',
    stageSubtitleFa: 'پخش 4K HDR با وینیت فضایی',
    roomLabelFa: 'سالن نمایش خصوصی',
    videoSrc: CINEMA_ROOMS[0].videoLoopPath,
    fallbackImageUrl: CINEMA_ROOMS[0].fallbackImageUrl,
    colors: {
      primary: '#F59E0B',
      secondary: '#FDE68A',
      accent: '#E11D48',
      roomBg: '#09070B',
      hudSurface: 'rgba(14, 11, 16, 0.84)',
      hudBorder: 'rgba(245, 158, 11, 0.36)',
      ctaText: '#140E02',
      primaryRgb: '245, 158, 11',
    },
    pins: [
      { label: 'PROJECTION · 4K HDR', top: '34%', right: '22%', accent: 'primary' },
      { label: 'SUB-SYNC · ACTIVE', top: '48%', left: '22%', accent: 'secondary' },
    ],
    roster: {
      groupLabelFa: 'واچ‌پارتی سالن شما',
      inviteCandidateHandle: '@cinema_guest',
      slots: [
        { id: 'cm-host', roleLabel: 'میزبان', memberHandle: '@mr_archivist', filled: true },
        { id: 'cm-crit', roleLabel: 'منتقد', memberHandle: '@ellen_noir', filled: true },
        { id: 'cm-sync', roleLabel: 'زیرنویس', memberHandle: '@sub_master', filled: true },
        { id: 'cm-open', roleLabel: 'صندلی', emptyLabel: '+ صندلی خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'q', labelFa: 'کیفیت استریم', valueDisplay: '4K HDR', isLtrValue: true, highlight: true },
      { id: 'v', labelFa: 'هم‌تماشاچیان', valueDisplay: toPersianNum(148), highlight: false },
      { id: 'lat', labelFa: 'تأخیر سینک', valueDisplay: '18ms', isLtrValue: true, highlight: false },
    ],
    primaryCtaFa: 'فعال‌سازی حالت سینما و واچ‌پارتی',
    readyCtaFa: 'حالت سینما و سینک فعال است',
    readyToastFa: 'نور محیط کم شد و استریم سالن نوآر همگام‌سازی گردید',
    sheetBtnLabelFa: 'استریم و لینک',
  },
  series: {
    id: 'series',
    shortLabel: 'سریال',
    nativeCode: 'MONITOR',
    fullTitleFa: 'اتاق مانیتورینگ سریال',
    subtitleFa: 'تحلیل اپیزود فینال و کشف تئوری‌ها',
    activeCountFa: '۲۱۲ کارآگاه فعال',
    stageTitleFa: 'میز مانیتورینگ چندکاناله',
    stageSubtitleFa: 'محافظ اسپویل فعال',
    roomLabelFa: 'اتاق پایش جنایی',
    videoSrc: CINEMA_ROOMS[1].videoLoopPath,
    fallbackImageUrl: CINEMA_ROOMS[1].fallbackImageUrl,
    colors: {
      primary: '#38BDF8',
      secondary: '#BAE6FD',
      accent: '#0EA5E9',
      roomBg: '#050A12',
      hudSurface: 'rgba(8, 15, 26, 0.84)',
      hudBorder: 'rgba(56, 189, 248, 0.36)',
      ctaText: '#04121E',
      primaryRgb: '56, 189, 248',
    },
    pins: [
      { label: 'FEED #04 · LIVE', top: '35%', right: '20%', accent: 'primary' },
      { label: 'SPOILER SHIELD', top: '49%', left: '20%', accent: 'secondary' },
    ],
    roster: {
      groupLabelFa: 'تیم تحلیل اپیزود',
      inviteCandidateHandle: '@theory_hunter',
      slots: [
        { id: 'sr-lead', roleLabel: 'تئوری‌سن', memberHandle: '@alderson_node', filled: true },
        { id: 'sr-det', roleLabel: 'تحلیل‌گر', memberHandle: '@tyrell_log', filled: true },
        { id: 'sr-arc', roleLabel: 'آرشیو', memberHandle: '@fsociety_409', filled: true },
        { id: 'sr-open', roleLabel: 'عضو', emptyLabel: '+ دعوت دوست', filled: false },
      ],
    },
    metrics: [
      { id: 'ep', labelFa: 'فیدهای فعال', valueDisplay: 'MULTI-CAM', isLtrValue: true, highlight: true },
      { id: 'mem', labelFa: 'کاربران اتاق', valueDisplay: toPersianNum(212) },
      { id: 'sh', labelFa: 'سپر اسپویل', valueDisplay: 'ON', isLtrValue: true },
    ],
    primaryCtaFa: 'شروع پایش گروهی اپیزود',
    readyCtaFa: 'اتاق مانیتورینگ در حال پخش',
    readyToastFa: 'محافظ اسپویل و سینک اپیزود برای اتاق سریال فعال شد',
    sheetBtnLabelFa: 'استریم و لینک',
  },
  anime: {
    id: 'anime',
    shortLabel: 'انیمه',
    nativeCode: 'TOKYO 60',
    fullTitleFa: 'کوچه توکیو در باران · انیمه',
    subtitleFa: 'سکانس‌های ساکوگا ۶۰ فریم + زیرنویس',
    activeCountFa: '۳۰۴ اوتاکوی آنلاین',
    stageTitleFa: 'صحنه نئونی کوچه بارانی توکیو',
    stageSubtitleFa: 'Sub-Sync ژاپنی/فارسی',
    roomLabelFa: 'کلاب شبانه سایبرپانک',
    videoSrc: CINEMA_ROOMS[2].videoLoopPath,
    fallbackImageUrl: CINEMA_ROOMS[2].fallbackImageUrl,
    colors: {
      primary: '#22D3EE',
      secondary: '#A5F3FC',
      accent: '#F43F5E',
      roomBg: '#060A12',
      hudSurface: 'rgba(8, 14, 24, 0.84)',
      hudBorder: 'rgba(34, 211, 238, 0.36)',
      ctaText: '#031318',
      primaryRgb: '34, 211, 238',
    },
    pins: [
      { label: 'SAKUGA · 60FPS', top: '35%', right: '22%', accent: 'primary' },
      { label: 'TOKYO RAIN · SUB', top: '50%', left: '21%', accent: 'secondary' },
    ],
    roster: {
      groupLabelFa: 'گروه واچ‌پارتی انیمه',
      inviteCandidateHandle: '@sakuga_fan',
      slots: [
        { id: 'an-host', roleLabel: 'ساکوگا', memberHandle: '@shibuya_ghost', filled: true },
        { id: 'an-sub', roleLabel: 'مترجم', memberHandle: '@kanji_sync', filled: true },
        { id: 'an-ost', roleLabel: 'موزیک', memberHandle: '@akihabara_ost', filled: true },
        { id: 'an-open', roleLabel: 'صندلی', emptyLabel: '+ صندلی خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'fps', labelFa: 'نرخ فریم', valueDisplay: '60 FPS', isLtrValue: true, highlight: true },
      { id: 'usr', labelFa: 'تماشاگران', valueDisplay: toPersianNum(304) },
      { id: 'sub', labelFa: 'همگام‌ساز', valueDisplay: '0.2ms', isLtrValue: true },
    ],
    primaryCtaFa: 'ورود به واچ‌پارتی ۶۰ فریم',
    readyCtaFa: 'پخش ساکوگا و زیرنویس فعال است',
    readyToastFa: 'موتور Sub-Sync توکیو برای تماشای گروهی آماده شد',
    sheetBtnLabelFa: 'استریم و لینک',
  },
  documentary: {
    id: 'documentary',
    shortLabel: 'مستند',
    nativeCode: 'RAW LOG',
    fullTitleFa: 'کمپ کوهستانی در مه · مستند',
    subtitleFa: 'طبیعت‌گردی، تاریخ محرمانه و فضا',
    activeCountFa: '۸۹ کاوشگر حاضر',
    stageTitleFa: 'چشم‌انداز ۳۶۰° کمپ مهتابی',
    stageSubtitleFa: 'فید 4K واقعی بدون فیلتر',
    roomLabelFa: 'پایگاه مستندسازی',
    videoSrc: CINEMA_ROOMS[3].videoLoopPath,
    fallbackImageUrl: CINEMA_ROOMS[3].fallbackImageUrl,
    colors: {
      primary: '#34D399',
      secondary: '#A7F3D0',
      accent: '#10B981',
      roomBg: '#050C09',
      hudSurface: 'rgba(6, 17, 13, 0.84)',
      hudBorder: 'rgba(52, 211, 153, 0.36)',
      ctaText: '#03150E',
      primaryRgb: '52, 211, 153',
    },
    pins: [
      { label: 'FIELD · 4K LOG', top: '34%', right: '22%', accent: 'primary' },
      { label: 'AMBISONIC AUDIO', top: '48%', left: '22%', accent: 'secondary' },
    ],
    roster: {
      groupLabelFa: 'تیم کاوشگران مستند',
      inviteCandidateHandle: '@alpine_cam',
      slots: [
        { id: 'dc-1', roleLabel: 'کاوشگر', memberHandle: '@nima_alpine', filled: true },
        { id: 'dc-2', roleLabel: 'تاریخ', memberHandle: '@doc_forensic', filled: true },
        { id: 'dc-3', roleLabel: 'صدا', memberHandle: '@wild_field', filled: true },
        { id: 'dc-4', roleLabel: 'صندلی', emptyLabel: '+ صندلی خالی', filled: false },
      ],
    },
    metrics: [
      { id: 'raw', labelFa: 'کیفیت مستند', valueDisplay: '4K LOG', isLtrValue: true, highlight: true },
      { id: 'exp', labelFa: 'کاوشگران', valueDisplay: toPersianNum(89) },
      { id: 'bit', labelFa: 'بیت‌ریت', valueDisplay: '48Mbps', isLtrValue: true },
    ],
    primaryCtaFa: 'آغاز تماشای مستند سه‌بعدی',
    readyCtaFa: 'پخش مستند با صدای محیطی فعال است',
    readyToastFa: 'کمپ کوهستانی روی کیفیت اصلی ۴K تنظیم شد',
    sheetBtnLabelFa: 'استریم و لینک',
  },
  'tv-climax': {
    id: 'tv-climax',
    shortLabel: 'تلویزیون و کلایمکس',
    nativeCode: 'VHS 80S',
    fullTitleFa: 'استودیوی رترو دهه ۸۰ · کلایمکس',
    subtitleFa: 'پخش زنده آنالوگ و آرشیو کالت',
    activeCountFa: '۱۷۶ تماشاگر رترو',
    stageTitleFa: 'استودیوی رترو و پخش آنالوگ',
    stageSubtitleFa: 'پخش همزمان کانال‌های کالت',
    roomLabelFa: 'اتاق کنترل دهه ۸۰',
    videoSrc: CINEMA_ROOMS[4].videoLoopPath,
    fallbackImageUrl: CINEMA_ROOMS[4].fallbackImageUrl,
    colors: {
      primary: '#FB7185',
      secondary: '#FDE047',
      accent: '#F59E0B',
      roomBg: '#0E0712',
      hudSurface: 'rgba(18, 9, 24, 0.84)',
      hudBorder: 'rgba(251, 113, 133, 0.38)',
      ctaText: '#1A040A',
      primaryRgb: '251, 113, 133',
    },
    pins: [
      { label: 'CH-80 · ON AIR', top: '34%', right: '22%', accent: 'primary' },
      { label: 'P2P · BROADCAST', top: '48%', left: '22%', accent: 'secondary' },
    ],
    roster: {
      groupLabelFa: 'کادر پخش استودیو رترو',
      inviteCandidateHandle: '@retro_vj',
      slots: [
        { id: 'tv-1', roleLabel: 'مجری', memberHandle: '@vice_host', filled: true },
        { id: 'tv-2', roleLabel: 'سیگنال', memberHandle: '@pirate_vhs', filled: true },
        { id: 'tv-3', roleLabel: 'آرشیو', memberHandle: '@synth_84', filled: true },
        { id: 'tv-4', roleLabel: 'مهمان', emptyLabel: '+ دعوت مهمان', filled: false },
      ],
    },
    metrics: [
      { id: 'ch', labelFa: 'کانال پخش', valueDisplay: 'VHS LIVE', isLtrValue: true, highlight: true },
      { id: 'vw', labelFa: 'تماشاگران', valueDisplay: toPersianNum(176) },
      { id: 'p2p', labelFa: 'گره P2P', valueDisplay: toPersianNum(42) },
    ],
    primaryCtaFa: 'اتصال به پخش زنده استودیو',
    readyCtaFa: 'سیگنال زنده استودیو فعال شد',
    readyToastFa: 'کانال زنده دهه ۸۰ با همگام‌سازی P2P متصل شد',
    sheetBtnLabelFa: 'استریم و لینک',
  },
};

export const CINEMA_ROOM_ORDER: CinemaRoomId[] = [
  'movie',
  'series',
  'anime',
  'documentary',
  'tv-climax',
];

const AUDIO_ROOM_CUSTOMIZATION: Record<
  AudioRoomId,
  {
    shortLabel: string;
    nativeCode: string;
    activeCountFa: string;
    stageTitleFa: string;
    stageSubtitleFa: string;
    roomLabelFa: string;
    roomBg: string;
    secondary: string;
    ctaText: string;
    primaryRgb: string;
    pins: TurntableVideoPin[];
    rosterGroupFa: string;
    slots: SquadRoleSlot[];
    primaryCtaFa: string;
    readyCtaFa: string;
    readyToastFa: string;
  }
> = {
  'westworld-cafe': {
    shortLabel: 'کافه وستورلد',
    nativeCode: 'JAZZ 84',
    activeCountFa: '۹۴ شنونده کافه',
    stageTitleFa: 'سالن چوبی کافه وست‌ورلد',
    stageSubtitleFa: 'آکوستیک لامپی جز و کانتری',
    roomLabelFa: 'کافه شبانه وسترن',
    roomBg: '#0D0906',
    secondary: '#FDE68A',
    ctaText: '#1A0F02',
    primaryRgb: '245, 158, 11',
    pins: [
      { label: 'PIANO · WARM MID', top: '35%', right: '22%', accent: 'primary' },
      { label: 'VINYL · REVERB 24%', top: '49%', left: '22%', accent: 'secondary' },
    ],
    rosterGroupFa: 'میز شنوندگان کافه',
    slots: [
      { id: 'ww-1', roleLabel: 'پیانیست', memberHandle: '@saloon_drift', filled: true },
      { id: 'ww-2', roleLabel: 'بلوز', memberHandle: '@dusty_rails', filled: true },
      { id: 'ww-3', roleLabel: 'کانتری', memberHandle: '@dolores_fm', filled: true },
      { id: 'ww-4', roleLabel: 'صندلی', emptyLabel: '+ صندلی کافه', filled: false },
    ],
    primaryCtaFa: 'پخش موزیک کافه و اکولایزر لامپی',
    readyCtaFa: 'در حال پخش · اکولایزر کافه فعال',
    readyToastFa: 'پروفایل صوتی Warm Mid کافه وست‌ورلد و پخش زنده فعال شد',
  },
  'mj-concert': {
    shortLabel: 'مایکل جکسون',
    nativeCode: 'ARENA LIVE',
    activeCountFa: '۴۲۸ هوادار در استادیوم',
    stageTitleFa: 'استیج ۳۶۰° کنسرت زنده پاپ',
    stageSubtitleFa: 'صدای استادیوم روباز',
    roomLabelFa: 'آرنای اجرای زنده',
    roomBg: '#0A0B14',
    secondary: '#BAE6FD',
    ctaText: '#1A1102',
    primaryRgb: '251, 191, 36',
    pins: [
      { label: 'ARENA · +5dB HIGH', top: '34%', right: '22%', accent: 'primary' },
      { label: 'VOCAL STAGE · 118 BPM', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'ردیف جلوی استادیوم',
    slots: [
      { id: 'mj-1', roleLabel: 'استیج', memberHandle: '@king_of_pop', filled: true },
      { id: 'mj-2', roleLabel: 'گروو', memberHandle: '@moonwalk_bass', filled: true },
      { id: 'mj-3', roleLabel: 'صدا', memberHandle: '@bucharest_92', filled: true },
      { id: 'mj-4', roleLabel: 'بلیط VIP', emptyLabel: '+ جایگاه VIP', filled: false },
    ],
    primaryCtaFa: 'شروع اجرای زنده استادیومی',
    readyCtaFa: 'کنسرت در حال پخش زنده است',
    readyToastFa: 'صدای استادیومی Wide Arena و اکولایزر زنده فعال شد',
  },
  'berlin-rave': {
    shortLabel: 'ریو برلین',
    nativeCode: 'RAVE 142',
    activeCountFa: '۳۱۵ ریور در انبار',
    stageTitleFa: 'انبار صنعتی تکنو برلین',
    stageSubtitleFa: 'ساب‌بیس +۸dB هارد ریو',
    roomLabelFa: 'باشگاه زیرزمینی برلین',
    roomBg: '#0C0609',
    secondary: '#67E8F9',
    ctaText: '#1A0308',
    primaryRgb: '251, 113, 133',
    pins: [
      { label: 'SUB PUNCH · +8dB', top: '34%', right: '22%', accent: 'primary' },
      { label: 'MODULAR · 142 BPM', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'بوث دی‌جی انبار برلین',
    slots: [
      { id: 'br-1', roleLabel: 'دی‌جی', memberHandle: '@modular_hana', filled: true },
      { id: 'br-2', roleLabel: 'ماژولار', memberHandle: '@tresor_04', filled: true },
      { id: 'br-3', roleLabel: 'بیس', memberHandle: '@ostgut_acid', filled: true },
      { id: 'br-4', roleLabel: 'بوث', emptyLabel: '+ ورود به بوث', filled: false },
    ],
    primaryCtaFa: 'پخش ست زنده تکنو + ساب‌بیس',
    readyCtaFa: 'ست ۱۴۲ BPM برلین در حال پخش',
    readyToastFa: 'اکولایزر ساب‌بیس برلین و ویژوالایزر فرکانس فعال شد',
  },
  tomorrowland: {
    shortLabel: 'تومارلند',
    nativeCode: 'EDM 134',
    activeCountFa: '۵۱۲ شرکت‌کننده فستیوال',
    stageTitleFa: 'مین‌استیج فستیوال تومارلند',
    stageSubtitleFa: 'ترنس و EDM استریو باز',
    roomLabelFa: 'استیج اصلی فستیوال',
    roomBg: '#060A14',
    secondary: '#F9A8D4',
    ctaText: '#03131A',
    primaryRgb: '56, 232, 255',
    pins: [
      { label: 'MAINSTAGE · TRANCE', top: '35%', right: '21%', accent: 'primary' },
      { label: 'REVERB · 52% WIDE', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'کمپ مین‌استیج تومارلند',
    slots: [
      { id: 'tl-1', roleLabel: 'هدلاینر', memberHandle: '@horizon_edm', filled: true },
      { id: 'tl-2', roleLabel: 'ترنس', memberHandle: '@euphoria_26', filled: true },
      { id: 'tl-3', roleLabel: 'نور', memberHandle: '@belgium_stage', filled: true },
      { id: 'tl-4', roleLabel: 'دوست', emptyLabel: '+ دعوت به کمپ', filled: false },
    ],
    primaryCtaFa: 'پخش سرود مین‌استیج تومارلند',
    readyCtaFa: 'مین‌استیج در حال پخش همزمان',
    readyToastFa: 'اکولایزر استریوی باز تومارلند فعال شد',
  },
  meditation: {
    shortLabel: 'مدیتیشن',
    nativeCode: '432 HZ',
    activeCountFa: '۷۶ نفر در آرامش',
    stageTitleFa: 'پناهگاه امبینت و خواب عمیق',
    stageSubtitleFa: 'فرکانس ۴۳۲ هرتز تتا',
    roomLabelFa: 'اتاق مدیتیشن شبانه',
    roomBg: '#040C09',
    secondary: '#A7F3D0',
    ctaText: '#03160E',
    primaryRgb: '52, 211, 153',
    pins: [
      { label: 'THETA · 432 HZ', top: '35%', right: '22%', accent: 'primary' },
      { label: 'BINAURAL WASH 65%', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'حلقه تمرکز و آرامش',
    slots: [
      { id: 'md-1', roleLabel: 'راهنما', memberHandle: '@theta_sanctum', filled: true },
      { id: 'md-2', roleLabel: 'امبینت', memberHandle: '@rain_432', filled: true },
      { id: 'md-3', roleLabel: 'تنفس', memberHandle: '@zen_pulse', filled: true },
      { id: 'md-4', roleLabel: 'همراه', emptyLabel: '+ جایگاه آرام', filled: false },
    ],
    primaryCtaFa: 'فعال‌سازی فرکانس ۴۳۲ هرتز خواب',
    readyCtaFa: 'فرکانس آرامش‌بخش در حال پخش',
    readyToastFa: 'موج تتا و ریورب نرم خواب عمیق فعال شد',
  },
  'ac-library': {
    shortLabel: 'کتابخانه AC',
    nativeCode: 'LORE',
    activeCountFa: '۶۸ خواننده در تالار',
    stageTitleFa: 'کتابخانه قدیمی اساسینز کرید',
    stageSubtitleFa: 'کتاب صوتی + بوکمارک فصلی',
    roomLabelFa: 'تالار سنگی آلموت',
    roomBg: '#0D0905',
    secondary: '#FDE68A',
    ctaText: '#1A0D02',
    primaryRgb: '217, 119, 6',
    pins: [
      { label: 'CHAPTERIZER · SYNC', top: '35%', right: '22%', accent: 'primary' },
      { label: 'STONE VAULT · +5dB', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'جمع کتاب‌خوانان تالار',
    slots: [
      { id: 'ac-1', roleLabel: 'راوی', memberHandle: '@mentor_ezio', filled: true },
      { id: 'ac-2', roleLabel: 'تاریخ', memberHandle: '@almout_scroll', filled: true },
      { id: 'ac-3', roleLabel: 'بوکمارک', memberHandle: '@davinci_key', filled: true },
      { id: 'ac-4', roleLabel: 'صندلی', emptyLabel: '+ میز مطالعه', filled: false },
    ],
    primaryCtaFa: 'ادامه روایت کتاب صوتی + بوکمارک',
    readyCtaFa: 'کتابخانه صوتی در حال روایت',
    readyToastFa: 'ذخیره خودکار تایم‌کد و فصل‌های کتاب صوتی فعال شد',
  },
  'podcast-studio': {
    shortLabel: 'پادکستر',
    nativeCode: 'POD 42',
    activeCountFa: '۱۳۴ شنونده گفتگو',
    stageTitleFa: 'استودیوی ضبط پادکست زنده',
    stageSubtitleFa: 'شفافیت وکال + نوت تایم‌کد',
    roomLabelFa: 'اتاق پادکست P2P',
    roomBg: '#060A12',
    secondary: '#DDD6FE',
    ctaText: '#03121E',
    primaryRgb: '56, 189, 248',
    pins: [
      { label: 'VOCAL · +6dB MID', top: '35%', right: '22%', accent: 'primary' },
      { label: 'ON AIR · CHAPTERS', top: '49%', left: '21%', accent: 'secondary' },
    ],
    rosterGroupFa: 'میزگرد زنده پادکسترها',
    slots: [
      { id: 'pd-1', roleLabel: 'مجری', memberHandle: '@aipetros_host', filled: true },
      { id: 'pd-2', roleLabel: 'مهمان', memberHandle: '@sound_architect', filled: true },
      { id: 'pd-3', roleLabel: 'تدوین', memberHandle: '@p2p_producer', filled: true },
      { id: 'pd-4', roleLabel: 'میکروفون', emptyLabel: '+ دعوت مهمان', filled: false },
    ],
    primaryCtaFa: 'پخش اپیزود پادکست + نوت زمانی',
    readyCtaFa: 'استودیو پادکست روی آنتن است',
    readyToastFa: 'میکروفون کاندنسر استودیو و ذخیره تایم‌کد پادکست فعال شد',
  },
};

export const AUDIO_ROOM_THEMES: Record<AudioRoomId, MediaRoomThemeConfig> = AUDIO_ROOMS.reduce(
  (acc, room) => {
    const custom = AUDIO_ROOM_CUSTOMIZATION[room.id];
    const track = room.defaultPlaylist[0];
    acc[room.id] = {
      id: room.id,
      shortLabel: custom.shortLabel,
      nativeCode: custom.nativeCode,
      fullTitleFa: room.titleFa,
      subtitleFa: room.subtitleFa,
      activeCountFa: custom.activeCountFa,
      stageTitleFa: custom.stageTitleFa,
      stageSubtitleFa: custom.stageSubtitleFa,
      roomLabelFa: custom.roomLabelFa,
      videoSrc: room.videoLoopPath,
      fallbackImageUrl: room.fallbackImageUrl,
      colors: {
        primary: room.accentHex,
        secondary: custom.secondary,
        accent: room.secondaryHex,
        roomBg: custom.roomBg,
        hudSurface: 'rgba(9, 13, 21, 0.84)',
        hudBorder: `${room.accentHex}5C`,
        ctaText: custom.ctaText,
        primaryRgb: custom.primaryRgb,
      },
      pins: custom.pins,
      roster: {
        groupLabelFa: custom.rosterGroupFa,
        inviteCandidateHandle: '@session_guest',
        slots: custom.slots,
      },
      metrics: [
        { id: 'bpm', labelFa: 'تمپو', valueDisplay: `${track.bpm} BPM`, isLtrValue: true, highlight: true },
        { id: 'lst', labelFa: 'شنوندگان', valueDisplay: custom.activeCountFa.split(' ')[0] },
        { id: 'eq', labelFa: 'ریورب', valueDisplay: `${Math.round(room.acoustic.reverbMix * 100)}%`, isLtrValue: true },
      ],
      primaryCtaFa: custom.primaryCtaFa,
      readyCtaFa: custom.readyCtaFa,
      readyToastFa: custom.readyToastFa,
      sheetBtnLabelFa: room.supportsChapters ? 'فصل‌ها و نوت' : 'پلی‌لیست',
    };
    return acc;
  },
  {} as Record<AudioRoomId, MediaRoomThemeConfig>
);

export const AUDIO_ROOM_ORDER: AudioRoomId[] = [
  'westworld-cafe',
  'mj-concert',
  'berlin-rave',
  'tomorrowland',
  'meditation',
  'ac-library',
  'podcast-studio',
];

export function getMediaRosterCountDisplay(
  theme: MediaRoomThemeConfig,
  filledEmptySlotIds: Record<string, boolean>
): { filled: number; total: number; headerTextFa: string } {
  const total = theme.roster.slots.length;
  const filled = theme.roster.slots.filter(
    (s) => s.filled || Boolean(filledEmptySlotIds[s.id])
  ).length;
  return {
    filled,
    total,
    headerTextFa: `${theme.roster.groupLabelFa} (${toPersianNum(filled)} از ${toPersianNum(total)})`,
  };
}

