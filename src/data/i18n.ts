import type { Language } from '../types/api';

export interface UiDictionary {
  brand: string;
  allGames: string;
  allCategories: string;
  searchPlaceholder: string;
  clearSearch: string;
  selectLanguage: string;
  searchLanguagesPlaceholder: string;
  noLanguagesFound: string;
  voiceStart: string;
  voiceStop: string;
  uploadMedia: string;
  boardHint: string;
  enterCoachingRoom: string;
  collapsePreview: string;
  emptyBoardTitle: string;
  emptyBoardBody: string;
  resetFilters: string;
  backToBoard: string;
  stageTabs: {
    tactical: string;
    video: string;
    controller: string;
  };
  play: string;
  pause: string;
  replay: string;
  fullscreen: string;
  exitFullscreen: string;
  mute: string;
  unmute: string;
  skipBack: string;
  skipForward: string;
  cacheTtlLabel: string;
  coachingHeading: string;
  promptPlaceholder: string;
  sendPrompt: string;
  practiceMode: string;
  demoMode: string;
  accuracyLabel: string;
  streakLabel: string;
  tapButtonsHint: string;
  uploadModalTitle: string;
  uploadModalSubtitle: string;
  dropZoneTitle: string;
  dropZoneHint: string;
  videoUrlLabel: string;
  videoUrlPlaceholder: string;
  loadUrlAction: string;
  cachedVideosTitle: string;
  noCachedVideos: string;
  closeLabel: string;
  activePathway: string;
  connectedSkills: string;
  weaponClickHint: string;
  coachErrorFallback: string;
  coachThinking: string;
  voiceTranscriptPrefix: string;
  gameBoardAria: string;
  scanTvAction: string;
  scanTvMode: string;
  streamUrlMode: string;
  tvContrastLabel: string;
  cropPresetLabel: string;
  cropPresets: {
    full: string;
    'tv-16-9': string;
    'center-focus': string;
  };
  selectKeyframesHint: string;
  questionLabel: string;
  questionPlaceholder: string;
  analyzeScreenAction: string;
  analyzingScreen: string;
  preprocessingScreen: string;
  changeCapture: string;
  symbolSequenceLabel: string;
  voiceWalkthroughAction: string;
}

export const UI_COPY: Record<'en' | 'fa', UiDictionary> = {
  en: {
    brand: 'AIGAMERIA',
    allGames: 'All Games',
    allCategories: 'All',
    searchPlaceholder: 'Search skills, maps, tactics...',
    clearSearch: 'Clear search',
    selectLanguage: 'Select Language',
    searchLanguagesPlaceholder: 'Search all world languages...',
    noLanguagesFound: 'No matching languages found.',
    voiceStart: 'Start voice coaching',
    voiceStop: 'Stop voice coaching',
    uploadMedia: 'Scan / Upload',
    boardHint: 'Select any tactical node to trace its pathway and open its coaching brief.',
    enterCoachingRoom: 'Enter Coaching Room',
    collapsePreview: 'Close preview',
    emptyBoardTitle: 'No matching tactical nodes',
    emptyBoardBody: 'Adjust the active game, category filter, or search term to view available training pathways.',
    resetFilters: 'Reset filters',
    backToBoard: 'Board',
    stageTabs: {
      tactical: 'Tactical Stage',
      video: 'Video',
      controller: 'Controller Guide',
    },
    play: 'Play',
    pause: 'Pause',
    replay: 'Replay',
    fullscreen: 'Fullscreen',
    exitFullscreen: 'Exit fullscreen',
    mute: 'Mute',
    unmute: 'Unmute',
    skipBack: 'Back 10s',
    skipForward: 'Forward 10s',
    cacheTtlLabel: '8h Cache TTL',
    coachingHeading: 'Focused Skill Coaching',
    promptPlaceholder: 'Ask a tactical question for this skill...',
    sendPrompt: 'Ask Coach',
    practiceMode: 'Practice',
    demoMode: 'Demo Loop',
    accuracyLabel: 'Timing',
    streakLabel: 'Streak',
    tapButtonsHint: 'Tap highlighted inputs in rhythm with the timeline cues.',
    uploadModalTitle: 'Scan TV Screen or Load Video',
    uploadModalSubtitle: 'Capture a photo or short clip of your TV/monitor for instant puzzle detection, or paste an 8h stream URL.',
    dropZoneTitle: 'Take photo or choose screen clip',
    dropZoneHint: 'Photo or short video of your TV / monitor (JPG, PNG, MP4, MOV)',
    videoUrlLabel: 'Free-stream video URL',
    videoUrlPlaceholder: 'https://example.com/walkthrough.mp4',
    loadUrlAction: 'Load Video',
    cachedVideosTitle: 'Cached in this session (8h TTL)',
    noCachedVideos: 'No cached clips yet for this session.',
    closeLabel: 'Close',
    activePathway: 'Active Pathway',
    connectedSkills: 'Linked Skills',
    weaponClickHint: 'Tap glowing weapon pins on the stage to cycle attachments live.',
    coachErrorFallback: 'Live AI coaching is unavailable right now.',
    coachThinking: 'Analyzing setup...',
    voiceTranscriptPrefix: 'Voice query',
    gameBoardAria: 'Interactive tactical skill discovery board',
    scanTvAction: 'Scan TV',
    scanTvMode: 'Scan TV / Puzzle',
    streamUrlMode: '8h Stream URL',
    tvContrastLabel: 'TV Contrast Boost',
    cropPresetLabel: 'Screen Crop',
    cropPresets: {
      full: 'Full Frame',
      'tv-16-9': '16:9 TV',
      'center-focus': 'Center Focus',
    },
    selectKeyframesHint: 'Select keyframes to send (lightweight in-memory preview)',
    questionLabel: 'Ask about this screen',
    questionPlaceholder: 'How do I solve this puzzle?',
    analyzeScreenAction: 'Analyze Screen',
    analyzingScreen: 'Detecting game & puzzle solution...',
    preprocessingScreen: 'Optimizing TV screen image...',
    changeCapture: 'Choose another capture',
    symbolSequenceLabel: 'Symbol Sequence',
    voiceWalkthroughAction: 'Voice Walkthrough',
  },
  fa: {
    brand: 'AIGAMERIA',
    allGames: 'همه بازی‌ها',
    allCategories: 'همه',
    searchPlaceholder: 'جستجوی مهارت، مپ یا تاکتیک...',
    clearSearch: 'پاک کردن جستجو',
    selectLanguage: 'انتخاب زبان',
    searchLanguagesPlaceholder: 'جستجو در تمام زبان‌های دنیا...',
    noLanguagesFound: 'زبانی با این نام پیدا نشد.',
    voiceStart: 'شروع گفتگوی صوتی',
    voiceStop: 'توقف میکروفون',
    uploadMedia: 'اسکن / آپلود',
    boardHint: 'روی هر گره تاکتیکی ضربه بزنید تا مسیر آن روشن شده و خلاصه آموزشی باز شود.',
    enterCoachingRoom: 'ورود به اتاق تمرین',
    collapsePreview: 'بستن پیش‌نمایش',
    emptyBoardTitle: 'مهارتی با این فیلتر پیدا نشد',
    emptyBoardBody: 'بازی فعال، دسته‌بندی یا عبارت جستجو را تغییر دهید تا مسیرهای تمرین نمایش داده شوند.',
    resetFilters: 'بازنشانی فیلترها',
    backToBoard: 'بازگشت به برد',
    stageTabs: {
      tactical: 'استیج تاکتیکی',
      video: 'ویدیو',
      controller: 'راهنمای دسته',
    },
    play: 'پخش',
    pause: 'توقف',
    replay: 'پخش مجدد',
    fullscreen: 'تمام‌صفحه',
    exitFullscreen: 'خروج از تمام‌صفحه',
    mute: 'بی‌صدا',
    unmute: 'باصدا',
    skipBack: '۱۰ ثانیه عقب',
    skipForward: '۱۰ ثانیه جلو',
    cacheTtlLabel: 'کش ۸ ساعته',
    coachingHeading: 'کوچینگ متمرکز مهارت',
    promptPlaceholder: 'سوال تاکتیکی خود را درباره این مهارت بپرسید...',
    sendPrompt: 'ارسال به مربی',
    practiceMode: 'حالت تمرین',
    demoMode: 'نمایش خودکار',
    accuracyLabel: 'دقت زمان‌بندی',
    streakLabel: 'زنجیره',
    tapButtonsHint: 'دکمه‌های روشن‌شده را همگام با تایم‌لاین لمس کنید.',
    uploadModalTitle: 'اسکن صفحه تلویزیون یا بارگذاری ویدیو',
    uploadModalSubtitle: 'از صفحه بازی عکس یا ویدیوی کوتاه بگیرید تا بازی و معما تشخیص داده شود، یا لینک استریم ۸ ساعته وارد کنید.',
    dropZoneTitle: 'عکس بگیرید یا ویدیوی کوتاه صفحه را انتخاب کنید',
    dropZoneHint: 'تصویر یا کلیپ کوتاه از تلویزیون / مانیتور (JPG، PNG، MP4، MOV)',
    videoUrlLabel: 'لینک مستقیم ویدیو',
    videoUrlPlaceholder: 'https://example.com/walkthrough.mp4',
    loadUrlAction: 'بارگذاری ویدیو',
    cachedVideosTitle: 'ویدیوهای کش‌شده (اعتبار ۸ ساعت)',
    noCachedVideos: 'هنوز ویدیویی در کش این نشست ذخیره نشده است.',
    closeLabel: 'بستن',
    activePathway: 'مسیر فعال',
    connectedSkills: 'مهارت‌های مرتبط',
    weaponClickHint: 'برای مقایسه اتچمنت‌ها روی پین‌های روشن سلاح ضربه بزنید.',
    coachErrorFallback: 'اتصال به مربی آنلاین در حال حاضر برقرار نیست.',
    coachThinking: 'در حال تحلیل تاکتیک...',
    voiceTranscriptPrefix: 'فرمان صوتی',
    gameBoardAria: 'برد تعاملی کشف مهارت‌های تاکتیکی',
    scanTvAction: 'اسکن صفحه',
    scanTvMode: 'اسکن صفحه و معما',
    streamUrlMode: 'لینک ویدیو ۸ ساعته',
    tvContrastLabel: 'افزایش کنتراست صفحه',
    cropPresetLabel: 'برش صفحه نمایش',
    cropPresets: {
      full: 'کادر کامل',
      'tv-16-9': 'تلویزیون ۱۶:۹',
      'center-focus': 'تمرکز مرکزی',
    },
    selectKeyframesHint: 'فریم‌های کلیدی را برای ارسال انتخاب کنید (پردازش سبک در حافظه)',
    questionLabel: 'سوال شما درباره صحنه',
    questionPlaceholder: 'معما این چطوری حل میشه؟',
    analyzeScreenAction: 'تحلیل صحنه و حل معما',
    analyzingScreen: 'در حال تشخیص بازی و راه‌حل معما...',
    preprocessingScreen: 'در حال بهینه‌سازی تصویر صفحه...',
    changeCapture: 'انتخاب تصویر یا ویدیوی دیگر',
    symbolSequenceLabel: 'ترتیب نمادها',
    voiceWalkthroughAction: 'توضیح صوتی هولوگرام',
  },
};

/**
 * Resolves UI chrome copy for any ISO 639-1 world language code.
 * Backend API responses receive the exact selected ISO language via Accept-Language & ?lang=.
 */
export function getUiCopy(language: Language): UiDictionary {
  const base = language.trim().toLowerCase().split(/[-_]/)[0] || 'en';
  if (base === 'fa') return UI_COPY.fa;
  return UI_COPY.en;
}
