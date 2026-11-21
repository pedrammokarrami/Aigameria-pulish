import React, { useState } from 'react';
import {
  Check,
  Copy,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Share2,
  ThumbsDown,
  ThumbsUp,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { GtaGamerProfile, GtaSocialPost } from '../../utils/gtaSocialRules';

interface GtaSocialFeedPanelProps {
  posts: GtaSocialPost[];
  gamers: GtaGamerProfile[];
  userHandle: string;
  userCrewTag: string;
  onToggleReaction: (postId: string, reaction: 'like' | 'dislike') => void;
  onAddComment: (postId: string, text: string) => void;
  onToggleCommentLike: (postId: string, commentId: string) => void;
  onSharePost: (postId: string, targetChannelId?: string) => void;
  onToggleFriend: (gamerId: string) => void;
  onOpenDirectChat: (gamerId: string) => void;
  onOpenProfileByHandle: (handle: string) => void;
  onOpenCreatePost: () => void;
}

const FEED_FILTERS = [
  { id: 'all', label: 'همه پست‌ها' },
  { id: 'drift', label: 'اوشن درایو' },
  { id: 'clubs', label: 'کلاب و هایست' },
] as const;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function faNum(n: number | string): string {
  return String(n).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)] ?? d);
}

export const GtaSocialFeedPanel: React.FC<GtaSocialFeedPanelProps> = ({
  posts,
  gamers,
  userHandle,
  userCrewTag,
  onToggleReaction,
  onAddComment,
  onToggleCommentLike,
  onSharePost,
  onToggleFriend,
  onOpenDirectChat,
  onOpenProfileByHandle,
  onOpenCreatePost,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'drift' | 'clubs'>('all');
  const [openCommentsPostId, setOpenCommentsPostId] = useState<string | null>(
    posts[0]?.id ?? null
  );
  const [openSharePostId, setOpenSharePostId] = useState<string | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [shareToastByPost, setShareToastByPost] = useState<Record<string, string>>({});
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const visiblePosts = posts.filter((post) => {
    if (filterMode === 'all') return true;
    const combined = `${post.districtFa} ${post.gameTag} ${post.captionFa}`.toLowerCase();
    if (filterMode === 'drift') {
      return (
        combined.includes('اوشن') ||
        combined.includes('دریفت') ||
        combined.includes('وایس') ||
        combined.includes('ocean')
      );
    }
    return (
      combined.includes('کلاب') ||
      combined.includes('هایست') ||
      combined.includes('heist') ||
      combined.includes('club') ||
      combined.includes('مارینا')
    );
  });

  const handleSubmitComment = (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const text = (commentDrafts[postId] ?? '').trim();
    if (!text) return;
    onAddComment(postId, text);
    setCommentDrafts((prev) => ({ ...prev, [postId]: '' }));
    setOpenCommentsPostId(postId);
  };

  const triggerShareFeedback = (postId: string, label: string) => {
    setShareToastByPost((prev) => ({ ...prev, [postId]: label }));
    window.setTimeout(() => {
      setShareToastByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    }, 2800);
  };

  const handleCopyShareLink = (post: GtaSocialPost) => {
    const shareUrl = `${window.location.origin}/?social_post=${encodeURIComponent(post.id)}`;
    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    onSharePost(post.id);
    setOpenSharePostId(null);
    triggerShareFeedback(post.id, 'لینک پست کپی شد و شمارنده اشتراک‌گذاری به‌روزرسانی شد');
  };

  const handleShareToChannel = (post: GtaSocialPost, channelId: string, label: string) => {
    onSharePost(post.id, channelId);
    setOpenSharePostId(null);
    triggerShareFeedback(post.id, label);
  };

  return (
    <div data-testid="gta-panel-feed" className="space-y-5">
      {/* Quick Compose Prompt Bar + Segmented Feed Filter */}
      <div className="rounded-xl border border-white/12 bg-[#130E1D]/88 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src="/src/assets/images/athlete_avatar_1794943635940.jpg"
              alt={userHandle}
              referrerPolicy="no-referrer"
              className="w-11 h-11 rounded-lg object-cover border border-[#FF3B8B]/50 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-white truncate">
                لحظه‌های وایس‌سیتی خودت را به اشتراک بگذار
              </p>
              <p className="text-[12px] text-[#C5B9D6] truncate">
                <span dir="ltr" className="font-mono-tabular text-[#FF944D]">
                  @{userHandle}
                </span>{' '}
                · <span dir="ltr" className="font-mono-tabular">[{userCrewTag}]</span> · فید زنده لئونیدا
              </p>
            </div>
          </div>

          <button
            type="button"
            data-testid="feed-open-composer-btn"
            onClick={onOpenCreatePost}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-gradient-to-l from-[#FF3B8B] to-[#FF7A45] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
          >
            <ImageIcon className="w-4 h-4" />
            <span>انتشار پست جدید</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-white/10">
          <div
            role="tablist"
            aria-label="فیلتر فید سوشال مدیا"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-black/35 border border-white/10 max-w-full"
          >
            {FEED_FILTERS.map((f) => {
              const active = filterMode === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilterMode(f.id)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-md text-[11.5px] sm:text-[12px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#FF3B8B] text-white'
                      : 'text-[#C5B9D6] hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <span className="text-[12px] text-[#B8ABC9] tabular-nums whitespace-nowrap">
            {faNum(visiblePosts.length)} پست فعال
          </span>
        </div>
      </div>

      {/* Feed Posts Stream */}
      {visiblePosts.length === 0 ? (
        <div className="rounded-xl border border-white/12 bg-[#130E1D]/88 p-8 text-center space-y-3">
          <p className="text-[15px] font-bold text-white">هنوز پستی در این دسته ثبت نشده است</p>
          <p className="text-[13px] text-[#B8ABC9]">
            اولین پست وایس‌سیتی را منتشر کنید تا اعضای کلاب واکنش نشان دهند.
          </p>
          <button
            type="button"
            onClick={onOpenCreatePost}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer"
          >
            انتشار اولین پست
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {visiblePosts.map((post) => {
            const matchedGamer = gamers.find(
              (g) => g.handle.toLowerCase() === post.authorHandle.toLowerCase()
            );
            const isCommentsOpen = openCommentsPostId === post.id;
            const isShareOpen = openSharePostId === post.id;
            const isLiked = post.userReaction === 'like';
            const isDisliked = post.userReaction === 'dislike';
            const shareNotice = shareToastByPost[post.id];

            return (
              <article
                key={post.id}
                data-testid={`social-post-${post.id}`}
                data-user-reaction={post.userReaction ?? 'none'}
                className="rounded-xl border border-white/12 bg-[#130E1D]/90 overflow-hidden"
              >
                {/* Post Header (Clean unboxed metadata + quick Add Friend / DM) */}
                <div className="p-4 sm:p-5 pb-3 flex items-start justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onOpenProfileByHandle(post.authorHandle)}
                    className="flex items-center gap-3 min-w-0 text-right cursor-pointer group"
                  >
                    <img
                      src={post.avatarUrl}
                      alt={post.authorHandle}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-lg object-cover border border-white/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="text-[14px] font-bold text-white group-hover:text-[#FF8EC2] transition truncate">
                          {post.authorDisplayNameFa}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono-tabular text-[12px] font-semibold text-[#FF944D]"
                        >
                          @{post.authorHandle}
                        </span>
                        <span
                          dir="ltr"
                          className="font-mono-tabular text-[11.5px] text-[#38E8FF]"
                        >
                          [{post.authorTag}]
                        </span>
                      </div>
                      <p className="text-[12px] text-[#B8ABC9] mt-0.5 truncate">
                        {post.districtFa} · {post.gameTag} · {post.timestamp}
                      </p>
                    </div>
                  </button>

                  {matchedGamer && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        data-testid={`post-add-friend-${post.id}`}
                        onClick={() => onToggleFriend(matchedGamer.id)}
                        className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border text-[12px] font-semibold transition cursor-pointer whitespace-nowrap ${
                          matchedGamer.isFriend
                            ? 'border-[#38E8FF]/45 bg-[#38E8FF]/12 text-[#8EF4FF]'
                            : 'border-white/15 bg-white/6 hover:bg-white/12 text-white'
                        }`}
                      >
                        {matchedGamer.isFriend ? (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>دوست</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>ادد</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Caption */}
                <p className="px-4 sm:px-5 pb-3.5 text-[14.5px] leading-relaxed text-[#F5EFFC]">
                  {post.captionFa}
                </p>

                {/* Post Visual Media (16:9 Vice City Art with resilient fallback) */}
                {post.mediaUrl && (
                  <div className="relative w-full aspect-[16/9] bg-[#0B0814] border-y border-white/10 overflow-hidden">
                    {brokenImages[post.id] ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2B1238] via-[#170E26] to-[#3B1830] text-center p-6">
                        <ImageIcon className="w-8 h-8 text-[#FF944D] mb-2" />
                        <p className="text-[13px] font-semibold text-white">{post.districtFa}</p>
                      </div>
                    ) : (
                      <img
                        src={post.mediaUrl}
                        alt={post.captionFa}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [post.id]: true }))
                        }
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/75 via-black/25 to-transparent"
                    />
                    <div className="absolute bottom-3 right-4 left-4 flex items-center justify-between text-[12px] text-white/90">
                      <span className="font-medium drop-shadow">{post.districtFa}</span>
                      <span dir="ltr" className="font-mono-tabular text-[#FFD4A8] drop-shadow">
                        {post.gameTag}
                      </span>
                    </div>
                  </div>
                )}

                {/* Interactive Action Bar: Like, Dislike, Comment, Share */}
                <div className="px-4 sm:px-5 py-3 grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-between gap-2 border-b border-white/10">
                  <div className="contents sm:flex sm:flex-wrap sm:items-center sm:gap-2">
                    <button
                      type="button"
                      data-testid={`post-like-btn-${post.id}`}
                      aria-pressed={isLiked}
                      onClick={() => onToggleReaction(post.id, 'like')}
                      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        isLiked
                          ? 'border-[#FF3B8B] bg-[#FF3B8B]/20 text-[#FF99C2]'
                          : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4 shrink-0" />
                      <span>لایک</span>
                      <span
                        data-testid={`post-like-count-${post.id}`}
                        className="tabular-nums font-bold"
                      >
                        {faNum(post.likesCount)}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid={`post-dislike-btn-${post.id}`}
                      aria-pressed={isDisliked}
                      onClick={() => onToggleReaction(post.id, 'dislike')}
                      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        isDisliked
                          ? 'border-[#FF944D] bg-[#FF944D]/20 text-[#FFD0A8]'
                          : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <ThumbsDown className="w-4 h-4 shrink-0" />
                      <span>دیسلایک</span>
                      <span
                        data-testid={`post-dislike-count-${post.id}`}
                        className="tabular-nums font-bold"
                      >
                        {faNum(post.dislikesCount)}
                      </span>
                    </button>

                    <button
                      type="button"
                      data-testid={`post-comment-toggle-${post.id}`}
                      aria-expanded={isCommentsOpen}
                      onClick={() =>
                        setOpenCommentsPostId((cur) => (cur === post.id ? null : post.id))
                      }
                      className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                        isCommentsOpen
                          ? 'border-[#38E8FF]/60 bg-[#38E8FF]/15 text-[#9EF5FF]'
                          : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>کامنت</span>
                      <span
                        data-testid={`post-comment-count-${post.id}`}
                        className="tabular-nums font-bold"
                      >
                        {faNum(post.comments.length)}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    data-testid={`post-share-btn-${post.id}`}
                    aria-expanded={isShareOpen}
                    onClick={() =>
                      setOpenSharePostId((cur) => (cur === post.id ? null : post.id))
                    }
                    className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-[12.5px] sm:text-[13px] font-semibold transition cursor-pointer whitespace-nowrap ${
                      post.sharedByMe || isShareOpen
                        ? 'border-[#38E8FF]/60 bg-[#38E8FF]/15 text-[#9EF5FF]'
                        : 'border-white/12 bg-white/5 hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <Share2 className="w-4 h-4 shrink-0" />
                    <span>اشتراک‌گذاری</span>
                    <span
                      data-testid={`post-share-count-${post.id}`}
                      className="tabular-nums font-bold"
                    >
                      {faNum(post.sharesCount)}
                    </span>
                  </button>
                </div>

                {/* Inline Share Feedback Banner */}
                {shareNotice && (
                  <div
                    data-testid={`post-share-toast-${post.id}`}
                    className="px-4 sm:px-5 py-2.5 bg-[#38E8FF]/12 border-b border-[#38E8FF]/25 text-[12.5px] text-[#9EF5FF] flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{shareNotice}</span>
                  </div>
                )}

                {/* Interactive Share Tray (Copy Link / Repost to Vice City Chat / Send to Friend DM) */}
                {isShareOpen && (
                  <div
                    data-testid={`post-share-tray-${post.id}`}
                    className="px-4 sm:px-5 py-3.5 bg-[#0D0916] border-b border-white/10 space-y-2.5"
                  >
                    <p className="text-[12px] font-semibold text-[#D6CBE6]">
                      اشتراک‌گذاری این پست در شبکه وایس‌سیتی:
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        data-testid={`share-copy-btn-${post.id}`}
                        onClick={() => handleCopyShareLink(post)}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-[12.5px] font-semibold text-white transition cursor-pointer whitespace-nowrap"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#FF944D]" />
                        <span>کپی لینک پست</span>
                      </button>

                      <button
                        type="button"
                        data-testid={`share-to-chat-btn-${post.id}`}
                        onClick={() =>
                          handleShareToChannel(
                            post,
                            'global-vice',
                            'پست در چت عمومی رادیو وایس‌سیتی به اشتراک گذاشته شد'
                          )
                        }
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#FF3B8B]/45 bg-[#FF3B8B]/18 hover:bg-[#FF3B8B]/28 text-[12.5px] font-semibold text-[#FFD1E5] transition cursor-pointer whitespace-nowrap"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال در چت عمومی کلاب</span>
                      </button>

                      {gamers.slice(0, 2).map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => {
                            handleShareToChannel(
                              post,
                              `dm-${g.id}`,
                              `پست به دایرکت @${g.handle} ارسال شد`
                            );
                          }}
                          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-white/15 bg-white/6 hover:bg-white/12 text-[12px] font-medium text-[#D6CBE6] hover:text-white transition cursor-pointer whitespace-nowrap"
                        >
                          <span>ارسال برای</span>
                          <span dir="ltr" className="font-mono-tabular text-[#38E8FF]">
                            @{g.handle}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expandable Comments Thread + Live Comment Input */}
                {isCommentsOpen && (
                  <div
                    data-testid={`post-comments-section-${post.id}`}
                    className="px-4 sm:px-5 py-4 bg-[#0D0916]/85 space-y-4"
                  >
                    {post.comments.length === 0 ? (
                      <p className="text-[12.5px] text-[#A497B8]">
                        هنوز کامنتی ثبت نشده — اولین نفر باشید که نظر می‌دهید.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {post.comments.map((cm) => (
                          <div
                            key={cm.id}
                            data-testid={`post-comment-item-${cm.id}`}
                            className="flex items-start gap-3 pb-3 border-b border-white/8 last:border-b-0 last:pb-0"
                          >
                            <img
                              src={cm.avatarUrl}
                              alt={cm.authorHandle}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-md object-cover border border-white/15 shrink-0 mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0 text-[12px]">
                                  <button
                                    type="button"
                                    onClick={() => onOpenProfileByHandle(cm.authorHandle)}
                                    dir="ltr"
                                    className="font-mono-tabular font-bold text-[#FF944D] hover:underline cursor-pointer truncate"
                                  >
                                    @{cm.authorHandle}
                                  </button>
                                  <span dir="ltr" className="font-mono-tabular text-[#38E8FF]">
                                    [{cm.authorTag}]
                                  </span>
                                  <span className="text-[#9E90B5]">· {cm.timestamp}</span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => onToggleCommentLike(post.id, cm.id)}
                                  aria-label={`لایک کامنت ${cm.authorHandle}`}
                                  className={`inline-flex items-center gap-1 text-[11.5px] font-mono-tabular transition cursor-pointer shrink-0 ${
                                    cm.likedByMe
                                      ? 'text-[#FF3B8B] font-bold'
                                      : 'text-[#A497B8] hover:text-white'
                                  }`}
                                >
                                  <Heart
                                    className={`w-3.5 h-3.5 ${cm.likedByMe ? 'fill-current' : ''}`}
                                  />
                                  <span>{faNum(cm.likesCount)}</span>
                                </button>
                              </div>
                              <p className="text-[13px] text-[#EDE6F7] mt-1 leading-relaxed break-words">
                                {cm.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add New Comment Form */}
                    <form
                      onSubmit={(e) => handleSubmitComment(e, post.id)}
                      className="flex items-center gap-2 pt-1"
                    >
                      <input
                        type="text"
                        dir="rtl"
                        data-testid={`post-comment-input-${post.id}`}
                        value={commentDrafts[post.id] ?? ''}
                        onChange={(e) =>
                          setCommentDrafts((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        placeholder="کامنت خود را بنویسید..."
                        aria-label={`ارسال کامنت برای پست ${post.authorHandle}`}
                        className="flex-1 min-w-0 h-10 px-3.5 rounded-lg border border-white/15 bg-[#171124] text-[13px] text-white placeholder:text-[#9E90B5] focus:outline-none focus:border-[#FF3B8B]"
                      />
                      <button
                        type="submit"
                        data-testid={`post-comment-submit-${post.id}`}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-[#FF3B8B] hover:brightness-110 text-white text-[13px] font-bold transition cursor-pointer whitespace-nowrap shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>ارسال</span>
                      </button>
                    </form>

                    {matchedGamer && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => onOpenDirectChat(matchedGamer.id)}
                          className="text-[12px] text-[#38E8FF] hover:underline cursor-pointer"
                        >
                          ارسال پیام خصوصی (چت) به @{matchedGamer.handle}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
