import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Check,
  Compass,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Plus,
  Search,
  Send,
  Shield,
  Upload,
  UserCheck,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import {
  INITIAL_GTA_SOCIAL_STATE,
  type GtaGamerProfile,
  type GtaSocialState,
  type GtaSocialTabId,
  type LivePredictionMarketId,
} from '../../utils/gtaSocialRules';
import type { RealmId } from '../../types/spatial';
import { GtaSocialFeedPanel } from './GtaSocialFeedPanel';
import { GtaSocialClubsPanel } from './GtaSocialClubsPanel';
import { PlayerProfileModal } from './PlayerProfileModal';

interface GtaSocialWorldProps {
  socialState: GtaSocialState;
  isSendingChat: boolean;
  onSelectTab: (tab: GtaSocialTabId) => void;
  onToggleFriend: (gamerId: string) => void;
  onSendChat: (channelId: string, text: string) => void;
  onTogglePostReaction?: (postId: string, reaction: 'like' | 'dislike') => void;
  onAddPostComment?: (postId: string, text: string) => void;
  onToggleCommentLike?: (postId: string, commentId: string) => void;
  onSharePost?: (postId: string, targetChannelId?: string) => void;
  onCreatePost?: (input: {
    captionFa: string;
    gameTag?: string;
    districtFa?: string;
    mediaUrl?: string;
  }) => void;
  onToggleClubJoin?: (clubId: string) => void;
  onCreateClub?: (input: {
    name: string;
    tag: string;
    districtFa?: string;
    mottoFa?: string;
    gameFocus?: string;
  }) => void;
  onPostClubAnnouncement?: (clubId: string, text: string) => void;
  // Legacy optional callbacks kept for full backwards compatibility
  onToggleSquadJoin?: (squadId: string) => void;
  onCreateSquad?: (input: {
    titleFa: string;
    gameTitle: string;
    realm: RealmId;
    neededRoleFa: string;
    micRequired?: boolean;
    requiredRank?: string;
  }) => void;
  onCreateHighlightClip?: (input: {
    gameTag: string;
    captionFa: string;
    thumbnailUrl?: string;
  }) => void;
  onToggleClipLike?: (clipId: string) => void;
  onRegisterTournament?: (tournamentId: string) => void;
  onCreateChallenge?: (input: {
    mode: '1v1' | '5v5';
    gameTitle: string;
    targetClanOrHandle: string;
    stakeRep: number;
    noteFa: string;
  }) => void;
  onSubmitLivePrediction?: (input: {
    market: LivePredictionMarketId;
    contenderId: 'nima' | 'parsa';
    stakeRep: number;
  }) => void;
  onPostFanClubMessage?: (gamerId: string, text: string) => void;
  onBackFaction?: (rivalryId: string, factionId: string, chantText?: string) => void;
  onExitToCoach: () => void;
  onOpenTournamentHub?: () => void;
  onUploadSceneFile?: (file: File) => void;
  onToggleSpeak?: () => void;
  isSpeaking?: boolean;
}

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

const PRIMARY_TABS: Array<{ id: 'feed' | 'chat' | 'friends' | 'clubs'; label: string }> = [
  { id: 'feed', label: 'فید و پست‌ها' },
  { id: 'chat', label: 'چت' },
  { id: 'friends', label: 'دوستان' },
  { id: 'clubs', label: 'کلاب‌ها' },
];

const GTA6_MEDIA_PRESETS = [
  {
    id: 'ocean-drift',
    label: 'دریفت اوشن درایو',
    url: '/src/assets/images/gta6_post_ocean_drift_1795183788123.jpg',
  },
  {
    id: 'vice-sunset',
    label: 'غروب بلوار وایس‌سیتی',
    url: '/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg',
  },
  {
    id: 'yacht-marina',
    label: 'مارینای لئونیدا',
    url: '/src/assets/images/gta6_post_yacht_party_1795183787708.jpg',
  },
  {
    id: 'penthouse-hq',
    label: 'پنت‌هاوس کلاب',
    url: '/src/assets/images/gta6_club_penthouse_hq_1795183788895.jpg',
  },
];

const CHAT_QUICK_PROMPTS = [
  'آماده‌ام، لابی رو بسازید',
  'بزن بریم میتینگ اوشن درایو',
  'پایه هایست امشبم با کلاب',
];

export const GtaSocialWorld: React.FC<GtaSocialWorldProps> = ({
  socialState,
  isSendingChat,
  onSelectTab,
  onToggleFriend,
  onSendChat,
  onTogglePostReaction,
  onAddPostComment,
  onToggleCommentLike,
  onSharePost,
  onCreatePost,
  onToggleClubJoin,
  onCreateClub,
  onPostClubAnnouncement,
  onPostFanClubMessage,
  onExitToCoach,
}) => {
  // Normalize legacy tab IDs into our 4 clean GTA VI social pillars
  const activeTab: 'feed' | 'chat' | 'friends' | 'clubs' =
    socialState.activeTab === 'chat' ||
    socialState.activeTab === 'friends' ||
    socialState.activeTab === 'clubs'
      ? socialState.activeTab
      : socialState.activeTab === 'teammates' || socialState.activeTab === 'rivalry'
        ? 'clubs'
        : 'feed';

  const posts = socialState.posts ?? INITIAL_GTA_SOCIAL_STATE.posts ?? [];
  const clubs = socialState.clubs ?? INITIAL_GTA_SOCIAL_STATE.clubs ?? [];
  const friendsCount = socialState.gamers.filter((g) => g.isFriend).length;
  const joinedClubs = clubs.filter((c) => c.isJoined);
  const spotlightClub = joinedClubs[0] ?? clubs[0] ?? null;

  // Chat state
  const [activeChannelId, setActiveChannelId] = useState<string>('global-vice');
  const [chatDraft, setChatDraft] = useState<string>('');
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Friends search & filter state
  const [friendSearch, setFriendSearch] = useState<string>('');
  const [friendFilter, setFriendFilter] = useState<'all' | 'online' | 'friends'>('all');

  // Create Post Modal state
  const [isCreatePostOpen, setIsCreatePostOpen] = useState<boolean>(false);
  const [postCaption, setPostCaption] = useState<string>('');
  const [postDistrict, setPostDistrict] = useState<string>('بلوار اوشن درایو · غروب وایس‌سیتی');
  const [postGameTag, setPostGameTag] = useState<string>('GTA VI Online');
  const [postMediaUrl, setPostMediaUrl] = useState<string>(GTA6_MEDIA_PRESETS[0].url);
  const [postError, setPostError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Player Profile Modal state
  const [selectedProfileHandle, setSelectedProfileHandle] = useState<string | null>(null);

  const selectedProfileGamer = useMemo<GtaGamerProfile | null>(() => {
    if (!selectedProfileHandle) return null;
    const found = socialState.gamers.find(
      (g) => g.handle.toLowerCase() === selectedProfileHandle.toLowerCase()
    );
    return found ?? null;
  }, [selectedProfileHandle, socialState.gamers]);

  const clubChannelId = `club-${socialState.userCrewTag.toLowerCase()}`;

  const activeChannelMessages = useMemo(() => {
    return socialState.messages.filter((m) => m.channelId === activeChannelId);
  }, [socialState.messages, activeChannelId]);

  useEffect(() => {
    if (activeTab !== 'chat') return;
    const container = chatScrollRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeTab, activeChannelId, activeChannelMessages.length]);

  const activeDmGamer = useMemo(() => {
    if (!activeChannelId.startsWith('dm-')) return null;
    const id = activeChannelId.replace(/^dm-/, '');
    return socialState.gamers.find((g) => g.id === id) ?? null;
  }, [activeChannelId, socialState.gamers]);

  const filteredGamers = useMemo(() => {
    const q = friendSearch.trim().toLowerCase();
    return socialState.gamers.filter((g) => {
      if (friendFilter === 'online' && g.onlineStatus !== 'ONLINE') return false;
      if (friendFilter === 'friends' && !g.isFriend) return false;
      if (!q) return true;
      return (
        g.handle.toLowerCase().includes(q) ||
        g.displayNameFa.toLowerCase().includes(q) ||
        g.favoriteGame.toLowerCase().includes(q) ||
        (g.clanTag ?? '').toLowerCase().includes(q) ||
        g.cityDistrict.toLowerCase().includes(q)
      );
    });
  }, [socialState.gamers, friendSearch, friendFilter]);

  const handleOpenDirectChat = (gamerId: string) => {
    setActiveChannelId(`dm-${gamerId}`);
    onSelectTab('chat');
    setSelectedProfileHandle(null);
  };

  const handleSubmitChat = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = chatDraft.trim();
    if (!cleaned || isSendingChat) return;
    onSendChat(activeChannelId, cleaned);
    setChatDraft('');
  };

  const handleUploadPostImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPostMediaUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = postCaption.trim();
    if (cleaned.length < 3) {
      setPostError('متن پست را بنویسید (حداقل ۳ کاراکتر).');
      return;
    }
    setPostError(null);
    onCreatePost?.({
      captionFa: cleaned,
      districtFa: postDistrict,
      gameTag: postGameTag,
      mediaUrl: postMediaUrl,
    });
    setPostCaption('');
    setIsCreatePostOpen(false);
    onSelectTab('feed');
  };

  const resolveAvatarForHandle = (handle: string, isSelf?: boolean): string => {
    if (isSelf || handle.toLowerCase() === socialState.userHandle.toLowerCase()) {
      return '/src/assets/images/athlete_avatar_1794943635940.jpg';
    }
    const gamer = socialState.gamers.find(
      (g) => g.handle.toLowerCase() === handle.toLowerCase()
    );
    return gamer?.avatarUrl ?? '/src/assets/images/ue5_story_coach_1795030215143.jpg';
  };

  return (
    <div
      data-testid="gta-social-world"
      dir="rtl"
      style={{ fontFamily: "'Vazirmatn', var(--font-sans)" }}
      className="relative w-full h-dvh min-h-dvh overflow-y-auto overflow-x-hidden bg-[#090710] text-white"
    >
      {/* Full-bleed Unreal 5.8 GTA VI Vice City Ocean Drive Sunset Backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      >
        <img
          src="/src/assets/images/gta6_vice_sunset_backdrop_1795183788003.jpg"
          alt=""
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center opacity-42 scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#090710]/82 via-[#120B1F]/78 to-[#090710]/96" />
        <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#FF3B8B]/14 via-[#FF944D]/6 to-transparent" />
      </div>

      {/* Sticky 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 border-b border-white/12 bg-[#0B0814]/86 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto pl-14 sm:pl-16 pr-4 sm:pr-6 h-16 flex items-center justify-between gap-3">
          {/* Zone 1: Back + GTA VI Social Brand */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              data-testid="gta-social-exit-btn"
              onClick={onExitToCoach}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-[13px] font-semibold text-white transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت</span>
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <span
                dir="ltr"
                className="text-[19px] sm:text-[21px] font-black tracking-tight bg-gradient-to-r from-[#FF3B8B] via-[#FF944D] to-[#38E8FF] bg-clip-text text-transparent whitespace-nowrap"
              >
                GTA VI
              </span>
              <span className="hidden sm:inline text-[13.5px] font-bold text-[#EDE6F7] whitespace-nowrap">
                سوشال کلاب وایس‌سیتی
              </span>
            </div>
          </div>

          {/* Zone 2: Desktop Primary 4-Tab Navigation */}
          <nav
            aria-label="بخش‌های سوشال کلاب GTA VI"
            className="hidden md:flex items-center gap-1 p-1 rounded-lg bg-white/5 border border-white/10"
          >
            {PRIMARY_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`gta-tab-${tab.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => onSelectTab(tab.id)}
                  className={`h-9 px-4 rounded-md text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] text-white'
                      : 'text-[#C5B9D6] hover:text-white hover:bg-white/6'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Street REP + New Post Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-[11px] text-[#B8ABC9]">اعتبار وایس‌سیتی</span>
              <span
                dir="ltr"
                className="font-mono-tabular tabular-nums text-[13.5px] font-bold text-[#FF944D]"
              >
                {faNum(socialState.userStreetRep.toLocaleString())} REP
              </span>
            </div>

            <button
              type="button"
              data-testid="topbar-create-post-btn"
              onClick={() => setIsCreatePostOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>پست جدید</span>
            </button>
          </div>
        </div>

        {/* Mobile Compact 4-Tab Bar (Zero Horizontal Overflow on 390px) */}
        <nav
          aria-label="منوی موبایل سوشال کلاب"
          className="md:hidden grid grid-cols-4 border-t border-white/10 bg-[#0D0916]/95"
        >
          {PRIMARY_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={`gta-mobile-tab-${tab.id}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectTab(tab.id)}
                className={`h-11 px-1 text-[12px] font-bold transition cursor-pointer whitespace-nowrap border-b-2 ${
                  isActive
                    ? 'border-[#FF3B8B] text-white bg-[#FF3B8B]/12'
                    : 'border-transparent text-[#B8ABC9] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>
      </header>

      {/* Main Responsive 12-Column Vice City Workspace */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Primary Active Content Column (8 cols on desktop) */}
          <section className="lg:col-span-8 min-w-0 space-y-5">
            {activeTab === 'feed' && (
              <GtaSocialFeedPanel
                posts={posts}
                gamers={socialState.gamers}
                userHandle={socialState.userHandle}
                userCrewTag={socialState.userCrewTag}
                onToggleReaction={(postId, reaction) =>
                  onTogglePostReaction?.(postId, reaction)
                }
                onAddComment={(postId, text) => onAddPostComment?.(postId, text)}
                onToggleCommentLike={(postId, commentId) =>
                  onToggleCommentLike?.(postId, commentId)
                }
                onSharePost={(postId, targetChannelId) =>
                  onSharePost?.(postId, targetChannelId)
                }
                onToggleFriend={onToggleFriend}
                onOpenDirectChat={handleOpenDirectChat}
                onOpenProfileByHandle={(handle) => setSelectedProfileHandle(handle)}
                onOpenCreatePost={() => setIsCreatePostOpen(true)}
              />
            )}

            {activeTab === 'chat' && (
              <div
                data-testid="gta-panel-chat"
                className="rounded-xl border border-white/12 bg-[#130E1D]/92 overflow-hidden flex flex-col min-h-[620px]"
              >
                {/* Chat Header & Channel Selector */}
                <div className="p-4 sm:p-5 border-b border-white/10 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-[18px] font-bold text-white flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-[#38E8FF]" />
                        <span>
                          {activeChannelId === 'global-vice'
                            ? 'چت عمومی رادیو وایس‌سیتی'
                            : activeChannelId === clubChannelId
                              ? `چت اختصاصی کلاب [${socialState.userCrewTag}]`
                              : activeDmGamer
                                ? `چت خصوصی با ${activeDmGamer.displayNameFa.split('·')[0].trim()}`
                                : 'چت زنده وایس‌سیتی'}
                        </span>
                      </h2>
                      <p className="text-[12px] text-[#B8ABC9] mt-0.5">
                        {activeDmGamer
                          ? `@${activeDmGamer.handle} · ${activeDmGamer.richPresenceFa ?? activeDmGamer.cityDistrict}`
                          : 'ارتباط زنده اعضای کلاب‌ها، اشتراک پست و هماهنگی میتینگ شبانه'}
                      </p>
                    </div>

                    <span className="text-[12px] tabular-nums text-[#38E8FF] whitespace-nowrap">
                      {faNum(activeChannelMessages.length)} پیام
                    </span>
                  </div>

                  {/* Channels & DMs Switcher */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      data-testid="chat-channel-global"
                      onClick={() => setActiveChannelId('global-vice')}
                      className={`h-9 px-3 rounded-lg border text-[12.5px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeChannelId === 'global-vice'
                          ? 'border-[#FF3B8B] bg-[#FF3B8B]/20 text-white'
                          : 'border-white/12 bg-white/5 hover:bg-white/10 text-[#C5B9D6]'
                      }`}
                    >
                      رادیو عمومی وایس‌سیتی
                    </button>

                    <button
                      type="button"
                      data-testid="chat-channel-club"
                      onClick={() => setActiveChannelId(clubChannelId)}
                      className={`h-9 px-3 rounded-lg border text-[12.5px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        activeChannelId === clubChannelId
                          ? 'border-[#FF944D] bg-[#FF944D]/20 text-white'
                          : 'border-white/12 bg-white/5 hover:bg-white/10 text-[#C5B9D6]'
                      }`}
                    >
                      چت کلاب <span dir="ltr" className="font-mono-tabular">[{socialState.userCrewTag}]</span>
                    </button>

                    {socialState.gamers.map((g) => {
                      const dmId = `dm-${g.id}`;
                      const isActive = activeChannelId === dmId;
                      return (
                        <button
                          key={g.id}
                          type="button"
                          data-testid={`chat-channel-dm-${g.id}`}
                          onClick={() => setActiveChannelId(dmId)}
                          className={`inline-flex items-center gap-2 h-9 px-3 rounded-lg border text-[12px] font-semibold transition cursor-pointer whitespace-nowrap ${
                            isActive
                              ? 'border-[#38E8FF] bg-[#38E8FF]/18 text-white'
                              : 'border-white/12 bg-white/5 hover:bg-white/10 text-[#C5B9D6]'
                          }`}
                        >
                          <img
                            src={g.avatarUrl}
                            alt={g.handle}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded object-cover"
                          />
                          <span dir="ltr" className="font-mono-tabular">
                            @{g.handle}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Live Message Stream */}
                <div
                  ref={chatScrollRef}
                  data-testid="chat-messages-list"
                  className="flex-1 p-4 sm:p-5 space-y-3.5 overflow-y-auto max-h-[420px] bg-[#0C0815]/75"
                >
                  {activeChannelMessages.length === 0 ? (
                    <div className="py-12 text-center space-y-2">
                      <p className="text-[14px] font-bold text-white">
                        هنوز پیامی در این کانال ارسال نشده است
                      </p>
                      <p className="text-[12.5px] text-[#A497B8]">
                        اولین پیام را بفرستید تا اعضای کلاب وایس‌سیتی پاسخ دهند.
                      </p>
                    </div>
                  ) : (
                    activeChannelMessages.map((msg) => {
                      const isSelf = Boolean(msg.isSelf);
                      return (
                        <div
                          key={msg.id}
                          data-testid={`chat-msg-${msg.id}`}
                          className={`flex items-start gap-3 ${isSelf ? 'flex-row-reverse' : ''}`}
                        >
                          <img
                            src={resolveAvatarForHandle(msg.senderHandle, isSelf)}
                            alt={msg.senderHandle}
                            referrerPolicy="no-referrer"
                            className="w-9 h-9 rounded-lg object-cover border border-white/15 shrink-0 mt-0.5"
                          />
                          <div
                            className={`max-w-[82%] rounded-xl px-4 py-3 border ${
                              isSelf
                                ? 'bg-[#FF3B8B]/18 border-[#FF3B8B]/40 text-white'
                                : 'bg-[#191228] border-white/12 text-[#F2ECFA]'
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11.5px] mb-1">
                              <button
                                type="button"
                                onClick={() => setSelectedProfileHandle(msg.senderHandle)}
                                dir="ltr"
                                className="font-mono-tabular font-bold text-[#FF944D] hover:underline cursor-pointer"
                              >
                                @{msg.senderHandle}
                              </button>
                              <span dir="ltr" className="font-mono-tabular text-[#38E8FF]">
                                [{msg.senderTag}]
                              </span>
                              <span dir="ltr" className="font-mono-tabular text-[#9E90B5]">
                                · {msg.timestamp}
                              </span>
                            </div>
                            <p className="text-[13.5px] leading-relaxed break-words">
                              {msg.text}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Vice City Prompts + Composer */}
                <div className="p-4 sm:p-5 border-t border-white/10 bg-[#130E1D] space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    {CHAT_QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => onSendChat(activeChannelId, prompt)}
                        disabled={isSendingChat}
                        className="h-8 px-3 rounded-lg border border-white/12 bg-white/5 hover:bg-white/12 text-[12px] text-[#D6CBE6] hover:text-white transition cursor-pointer whitespace-nowrap disabled:opacity-50"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSubmitChat} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      dir="rtl"
                      data-testid="chat-message-input"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      placeholder="پیام خود را در چت وایس‌سیتی بنویسید..."
                      aria-label="ارسال پیام در چت وایس‌سیتی"
                      className="flex-1 min-w-0 h-11 px-4 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                    />
                    <button
                      type="submit"
                      data-testid="chat-send-btn"
                      disabled={isSendingChat || !chatDraft.trim()}
                      className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 disabled:opacity-50 text-white text-[13.5px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Send className="w-4 h-4" />
                      <span>ارسال</span>
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'friends' && (
              <div data-testid="gta-panel-friends" className="space-y-5">
                {/* Friends Search & Segmented Filter */}
                <div className="rounded-xl border border-white/12 bg-[#130E1D]/90 p-4 sm:p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-[19px] font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#FF3B8B]" />
                        <span>رادار دوستان و ادد گیمرها</span>
                      </h2>
                      <p className="text-[12.5px] text-[#B8ABC9] mt-0.5">
                        {faNum(friendsCount)} دوست تاییدشده · {faNum(socialState.gamers.length)} گیمر فعال در وایس‌سیتی
                      </p>
                    </div>

                    <div
                      role="tablist"
                      aria-label="فیلتر لیست دوستان"
                      className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10 self-start sm:self-auto"
                    >
                      {[
                        { id: 'all', label: 'همه' },
                        { id: 'online', label: 'آنلاین' },
                        { id: 'friends', label: 'دوستان من' },
                      ].map((tab) => {
                        const active = friendFilter === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            role="tab"
                            aria-selected={active}
                            onClick={() =>
                              setFriendFilter(tab.id as 'all' | 'online' | 'friends')
                            }
                            className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition cursor-pointer whitespace-nowrap ${
                              active
                                ? 'bg-[#FF3B8B] text-white'
                                : 'text-[#C5B9D6] hover:text-white'
                            }`}
                          >
                            {tab.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-4 h-4 text-[#9E90B5] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      dir="rtl"
                      data-testid="friends-search-input"
                      value={friendSearch}
                      onChange={(e) => setFriendSearch(e.target.value)}
                      placeholder="جستجو با آیدی (@handle)، نام گیمر، تگ کلاب یا بازی..."
                      className="w-full h-11 pr-10 pl-4 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                    />
                  </div>
                </div>

                {/* Gamer Radar Rows */}
                {filteredGamers.length === 0 ? (
                  <div className="rounded-xl border border-white/12 bg-[#130E1D]/88 p-8 text-center">
                    <p className="text-[14.5px] font-bold text-white">
                      گیمری با این مشخصات پیدا نشد
                    </p>
                    <p className="text-[12.5px] text-[#A497B8] mt-1">
                      عبارت جستجو را تغییر دهید یا فیلتر «همه» را انتخاب کنید.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredGamers.map((gamer) => (
                      <article
                        key={gamer.id}
                        data-testid={`friend-card-${gamer.id}`}
                        data-is-friend={gamer.isFriend ? 'true' : 'false'}
                        className="rounded-xl border border-white/12 bg-[#130E1D]/90 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/25 transition"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedProfileHandle(gamer.handle)}
                          className="flex items-start gap-3.5 min-w-0 text-right cursor-pointer group"
                        >
                          <img
                            src={gamer.avatarUrl}
                            alt={gamer.handle}
                            referrerPolicy="no-referrer"
                            className="w-14 h-14 rounded-lg object-cover border border-white/20 shrink-0"
                          />
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                              <span className="text-[15px] font-bold text-white group-hover:text-[#FF8EC2] transition">
                                {gamer.displayNameFa}
                              </span>
                              <span
                                dir="ltr"
                                className="font-mono-tabular text-[12px] font-bold text-[#FF944D]"
                              >
                                @{gamer.handle}
                              </span>
                              {gamer.clanTag && (
                                <span
                                  dir="ltr"
                                  className="font-mono-tabular text-[12px] text-[#38E8FF]"
                                >
                                  [{gamer.clanTag}]
                                </span>
                              )}
                            </div>

                            <p className="text-[12.5px] text-[#D6CBE6] truncate">
                              {gamer.favoriteGame} · {gamer.rankLabel}
                            </p>

                            <p className="text-[12px] text-[#A497B8] flex flex-wrap items-center gap-x-2">
                              <span className="inline-flex items-center gap-1 text-[#38E8FF]">
                                <MapPin className="w-3.5 h-3.5" />
                                {gamer.richPresenceFa ?? gamer.cityDistrict}
                              </span>
                              <span>·</span>
                              <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                                {faNum(gamer.repScore.toLocaleString())} REP
                              </span>
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            type="button"
                            data-testid={`friend-toggle-btn-${gamer.id}`}
                            onClick={() => onToggleFriend(gamer.id)}
                            className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-lg text-[13px] font-bold transition cursor-pointer whitespace-nowrap ${
                              gamer.isFriend
                                ? 'border border-[#38E8FF]/55 bg-[#38E8FF]/15 text-[#9EF5FF] hover:bg-[#38E8FF]/22'
                                : 'bg-[#FF3B8B] hover:brightness-110 text-white'
                            }`}
                          >
                            {gamer.isFriend ? (
                              <>
                                <UserCheck className="w-4 h-4" />
                                <span>دوست شد</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-4 h-4" />
                                <span>ادد کردن</span>
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            data-testid={`friend-dm-btn-${gamer.id}`}
                            onClick={() => handleOpenDirectChat(gamer.id)}
                            className="inline-flex items-center gap-1.5 h-10 px-3.5 rounded-lg border border-white/15 bg-white/6 hover:bg-white/14 text-white text-[13px] font-semibold transition cursor-pointer whitespace-nowrap"
                          >
                            <MessageCircle className="w-4 h-4 text-[#38E8FF]" />
                            <span>چت</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'clubs' && (
              <GtaSocialClubsPanel
                clubs={clubs}
                userCrewTag={socialState.userCrewTag}
                onToggleClubJoin={(clubId) => onToggleClubJoin?.(clubId)}
                onCreateClub={(input) => onCreateClub?.(input)}
                onPostClubAnnouncement={(clubId, text) =>
                  onPostClubAnnouncement?.(clubId, text)
                }
                onOpenProfileByHandle={(handle) => setSelectedProfileHandle(handle)}
              />
            )}
          </section>

          {/* Desktop Vice City Identity, Friends & Active Club Sidebar (4 cols) */}
          <aside className="hidden lg:block lg:col-span-4 space-y-5 sticky top-22">
            {/* Player GTA VI Crew Identity Card */}
            <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 p-5 space-y-4">
              <div className="flex items-center gap-3.5">
                <img
                  src="/src/assets/images/athlete_avatar_1794943635940.jpg"
                  alt={socialState.userHandle}
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-lg object-cover border border-[#FF3B8B]/60 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[15.5px] font-bold text-white truncate">
                    پروفایل سوشال وایس‌سیتی
                  </p>
                  <p className="text-[12.5px] text-[#C5B9D6] mt-0.5 flex items-center gap-1.5">
                    <span dir="ltr" className="font-mono-tabular font-bold text-[#FF944D]">
                      @{socialState.userHandle}
                    </span>
                    <span>·</span>
                    <span dir="ltr" className="font-mono-tabular font-bold text-[#38E8FF]">
                      [{socialState.userCrewTag}]
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10 text-center">
                <div>
                  <p className="text-[11px] text-[#A497B8]">اعتبار REP</p>
                  <p
                    dir="ltr"
                    className="font-mono-tabular tabular-nums text-[14.5px] font-bold text-[#FF944D] mt-0.5"
                  >
                    {faNum(socialState.userStreetRep.toLocaleString())}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#A497B8]">دوستان</p>
                  <p className="font-mono-tabular tabular-nums text-[14.5px] font-bold text-white mt-0.5">
                    {faNum(friendsCount)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[#A497B8]">کلاب‌ها</p>
                  <p className="font-mono-tabular tabular-nums text-[14.5px] font-bold text-[#38E8FF] mt-0.5">
                    {faNum(joinedClubs.length)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatePostOpen(true)}
                  className="h-9 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[12.5px] font-bold transition cursor-pointer"
                >
                  پست جدید
                </button>
                <button
                  type="button"
                  onClick={() => onSelectTab('clubs')}
                  className="h-9 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-white text-[12.5px] font-semibold transition cursor-pointer"
                >
                  مدیریت کلاب‌ها
                </button>
              </div>
            </div>

            {/* Quick Vice City Friends & Add List */}
            <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 p-5 space-y-3.5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-[#38E8FF]" />
                  <span>گیمرهای فعال وایس‌سیتی</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onSelectTab('friends')}
                  className="text-[12px] text-[#FF8EC2] hover:text-white cursor-pointer"
                >
                  مشاهده همه
                </button>
              </div>

              <div className="space-y-3">
                {socialState.gamers.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between gap-2.5 pb-3 border-b border-white/8 last:border-b-0 last:pb-0"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedProfileHandle(g.handle)}
                      className="flex items-center gap-2.5 min-w-0 text-right cursor-pointer group"
                    >
                      <img
                        src={g.avatarUrl}
                        alt={g.handle}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-lg object-cover border border-white/15 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-[13px] font-bold text-white group-hover:text-[#FF8EC2] truncate">
                          {g.displayNameFa.split('·')[0].trim()}
                        </p>
                        <p dir="ltr" className="font-mono-tabular text-[11px] text-[#A497B8] truncate">
                          @{g.handle} · [{g.clanTag ?? 'VICE'}]
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onToggleFriend(g.id)}
                        aria-label={g.isFriend ? `حذف دوستی ${g.handle}` : `ادد کردن ${g.handle}`}
                        className={`h-8 px-2.5 rounded-md text-[11.5px] font-bold transition cursor-pointer ${
                          g.isFriend
                            ? 'bg-[#38E8FF]/15 text-[#9EF5FF] border border-[#38E8FF]/40'
                            : 'bg-white/8 hover:bg-[#FF3B8B] text-white'
                        }`}
                      >
                        {g.isFriend ? <Check className="w-3.5 h-3.5" /> : 'ادد'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDirectChat(g.id)}
                        aria-label={`چت با ${g.handle}`}
                        className="h-8 w-8 rounded-md bg-white/6 hover:bg-white/14 text-[#C5B9D6] hover:text-white flex items-center justify-center transition cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Club Spotlight */}
            {spotlightClub && (
              <div className="rounded-xl border border-white/12 bg-[#130E1D]/92 overflow-hidden">
                <div className="relative h-28 bg-[#0B0814]">
                  <img
                    src={spotlightClub.bannerUrl}
                    alt={spotlightClub.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#130E1D] via-[#130E1D]/45 to-transparent"
                  />
                  <div className="absolute bottom-2.5 right-4 left-4 flex items-center justify-between">
                    <span className="text-[13.5px] font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#FF944D]" />
                      {spotlightClub.name}
                    </span>
                    <span dir="ltr" className="font-mono-tabular text-[12px] font-bold text-[#38E8FF]">
                      [{spotlightClub.tag}]
                    </span>
                  </div>
                </div>
                <div className="p-4 space-y-2.5">
                  <p className="text-[12.5px] text-[#D6CBE6] leading-relaxed">
                    {spotlightClub.announcements[0]?.text ?? spotlightClub.mottoFa}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-white/10 text-[12px]">
                    <span className="text-[#A497B8] tabular-nums">
                      {faNum(spotlightClub.membersCount)} عضو فعال
                    </span>
                    <button
                      type="button"
                      onClick={() => onSelectTab('clubs')}
                      className="font-semibold text-[#FF8EC2] hover:text-white cursor-pointer"
                    >
                      ورود به مقر کلاب
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Create Post Modal (GTA VI Vice City Composer) */}
      {isCreatePostOpen && (
        <div
          data-testid="create-post-modal"
          className="fixed inset-0 z-50 bg-black/78 backdrop-blur-md flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSubmitCreatePost}
            className="w-full max-w-xl rounded-2xl border border-[#FF3B8B]/40 bg-[#140E20] p-5 sm:p-6 space-y-4 max-h-[92dvh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h2 className="text-[18px] font-bold text-white">انتشار پست جدید در وایس‌سیتی</h2>
                <p className="text-[12px] text-[#B8ABC9] mt-0.5">
                  <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                    @{socialState.userHandle}
                  </span>{' '}
                  · <span dir="ltr" className="font-mono-tabular">[{socialState.userCrewTag}]</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                aria-label="بستن پنجره پست جدید"
                className="w-9 h-9 rounded-lg hover:bg-white/10 text-[#C5B9D6] hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label htmlFor="create-post-caption" className="block text-[12.5px] font-semibold text-[#D6CBE6] mb-1.5">
                متن پست
              </label>
              <textarea
                id="create-post-caption"
                data-testid="create-post-caption"
                rows={3}
                dir="rtl"
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
                placeholder="از میتینگ امشب، رکورد جدید یا کلاب خودتان بنویسید..."
                className="w-full p-3.5 rounded-lg border border-white/15 bg-[#0D0916] text-[13.5px] text-white placeholder:text-[#8E7FA6] focus:outline-none focus:border-[#FF3B8B] resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-post-district" className="block text-[12px] font-medium text-[#D6CBE6] mb-1">
                  منطقه در وایس‌سیتی
                </label>
                <input
                  id="create-post-district"
                  type="text"
                  value={postDistrict}
                  onChange={(e) => setPostDistrict(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#0D0916] text-[13px] text-white focus:outline-none focus:border-[#FF3B8B]"
                />
              </div>

              <div>
                <label htmlFor="create-post-gametag" className="block text-[12px] font-medium text-[#D6CBE6] mb-1">
                  تگ بازی یا رویداد
                </label>
                <input
                  id="create-post-gametag"
                  type="text"
                  dir="ltr"
                  value={postGameTag}
                  onChange={(e) => setPostGameTag(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-white/15 bg-[#0D0916] text-[13px] font-mono-tabular text-white focus:outline-none focus:border-[#FF3B8B]"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-semibold text-[#D6CBE6] flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#FF944D]" />
                  <span>انتخاب تصویر صحنه وایس‌سیتی</span>
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#38E8FF] hover:underline cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>آپلود از دستگاه</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleUploadPostImage}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {GTA6_MEDIA_PRESETS.map((preset) => {
                  const selected = postMediaUrl === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPostMediaUrl(preset.url)}
                      className={`relative rounded-lg overflow-hidden aspect-[16/10] border-2 transition cursor-pointer ${
                        selected ? 'border-[#FF3B8B]' : 'border-white/12 hover:border-white/30'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.label}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute inset-x-0 bottom-0 px-1.5 py-1 bg-black/70 text-[10.5px] text-white truncate">
                        {preset.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {postError && <p className="text-[12.5px] text-rose-300">{postError}</p>}

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsCreatePostOpen(false)}
                className="h-10 px-4 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-[#D6CBE6] text-[13px] font-medium transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                data-testid="create-post-submit"
                className="h-10 px-5 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer"
              >
                انتشار پست
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Player Profile Modal */}
      {selectedProfileGamer && (
        <PlayerProfileModal
          gamer={selectedProfileGamer}
          allGamers={socialState.gamers}
          onClose={() => setSelectedProfileHandle(null)}
          onToggleFriend={onToggleFriend}
          onOpenDirectChat={handleOpenDirectChat}
          onPostFanClubMessage={onPostFanClubMessage}
        />
      )}
    </div>
  );
};
