import React, { useState, useEffect } from 'react';
import { Post, Comment, Destination, Trip } from '../types/index.ts';
import { api } from '../services/api.ts';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Trash2,
  Flag,
  Send,
  Image as ImageIcon,
  MapPin,
  Calendar,
  X,
  Compass,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface CommunityFeedProps {
  destinations: Destination[];
  trips: Trip[];
  onSelectUser: (userId: string) => void;
  openReportModal: (item: { reportedPost?: string; reportedUser?: string }) => void;
}

export const CommunityFeed: React.FC<CommunityFeedProps> = ({
  destinations,
  trips,
  onSelectUser,
  openReportModal,
}) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // New post state
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedDest, setSelectedDest] = useState<string>('');
  const [selectedTrip, setSelectedTrip] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showImageInput, setShowImageInput] = useState(false);

  // Comments state
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const loadFeed = async () => {
    try {
      const data = await api.getPosts();
      setPosts(data.posts);
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!caption.trim() && !imageUrl.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await api.createPost({
        caption: caption.trim(),
        images: imageUrl ? [imageUrl.trim()] : [],
        destination: selectedDest || null,
        trip: selectedTrip || null,
      });

      setCaption('');
      setImageUrl('');
      setSelectedDest('');
      setSelectedTrip('');
      setShowImageInput(false);
      await loadFeed();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;
    // Optimistic update
    setPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          const currentlyLiked = p.isLiked;
          return {
            ...p,
            isLiked: !currentlyLiked,
            likesCount: (p.likesCount || 0) + (currentlyLiked ? -1 : 1),
          };
        }
        return p;
      })
    );

    try {
      await api.toggleLikePost(postId);
    } catch {
      // Rollback on error
      await loadFeed();
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
    } else {
      setActiveCommentsPostId(postId);
      if (!commentsMap[postId]) {
        try {
          const res = await api.getComments(postId);
          setCommentsMap(prev => ({ ...prev, [postId]: res.comments }));
        } catch {
          // quiet fallback
        }
      }
    }
  };

  const handleAddComment = async (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCommentText.trim()) return;

    setCommentSubmitting(true);
    try {
      const res = await api.addComment(postId, newCommentText.trim());
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), res.comment],
      }));
      setPosts(prev =>
        prev.map(p => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
      );
      setNewCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this travel post?')) return;
    try {
      await api.deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    try {
      await api.deleteComment(commentId);
      setCommentsMap(prev => ({
        ...prev,
        [postId]: prev[postId].filter(c => c.id !== commentId),
      }));
      setPosts(prev =>
        prev.map(p =>
          p.id === postId ? { ...p, commentsCount: Math.max(0, (p.commentsCount || 0) - 1) } : p
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-display text-[#174D3C] tracking-tight">
          Community Feed
        </h1>
        <p className="text-xs text-[#5E6963] mt-1">
          Travel stories, field photography, destination tips, and trip updates from verified travelers.
        </p>
      </div>

      {/* Create Post Box */}
      {user && (
        <form
          onSubmit={handleCreatePost}
          className="bg-white rounded-xl p-5 border border-[#E5E3D8] shadow-sm space-y-4"
        >
          <div className="flex items-start gap-3">
            <img
              src={user.profilePhoto}
              alt={user.fullName}
              className="w-10 h-10 rounded-full object-cover border border-[#E5E3D8]"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1">
              <textarea
                rows={3}
                placeholder="Share a travel highlight, packing tip, or photo from your journey..."
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full p-3 bg-[#F8F7F2] border border-[#E5E3D8] rounded-xl text-xs text-[#202824] placeholder-[#8A9790] focus:outline-none focus:ring-1 focus:ring-[#174D3C] resize-none"
              />
            </div>
          </div>

          {showImageInput && (
            <div className="space-y-1.5 pl-13">
              <label className="text-[11px] font-medium text-[#5E6963]">
                Photo URL or Asset Path:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="https://... or /src/assets/images/..."
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowImageInput(false)}
                  className="p-1.5 text-[#8A9790] hover:text-[#202824] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#EFECE3]">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F8F7F2] hover:bg-[#EFECE3] text-[#5E6963] text-xs font-medium rounded-lg transition-colors cursor-pointer"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#27866A]" />
                <span>Attach Photo</span>
              </button>

              {/* Tag destination */}
              <select
                value={selectedDest}
                onChange={e => setSelectedDest(e.target.value)}
                aria-label="Tag a destination"
                className="px-2.5 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#5E6963] focus:outline-none"
              >
                <option value="">Tag Destination (optional)</option>
                {destinations.map(d => (
                  <option key={d.id} value={d.id}>
                    {d.destinationName}
                  </option>
                ))}
              </select>

              {/* Tag trip */}
              <select
                value={selectedTrip}
                onChange={e => setSelectedTrip(e.target.value)}
                aria-label="Tag an upcoming trip"
                className="px-2.5 py-1.5 bg-[#F8F7F2] border border-[#E5E3D8] rounded-lg text-xs text-[#5E6963] focus:outline-none max-w-[160px] truncate"
              >
                <option value="">Tag Trip (optional)</option>
                {trips.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.tripTitle}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!caption.trim() && !imageUrl.trim())}
              className="px-5 py-2 bg-[#174D3C] hover:bg-[#1F644E] text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-40"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Post'}
            </button>
          </div>
        </form>
      )}

      {/* Feed Stream */}
      {loading ? (
        <div className="text-center py-12 text-xs text-[#8A9790]">Loading travel stories...</div>
      ) : posts.length === 0 ? (
        <div className="bg-white p-8 rounded-xl border border-[#E5E3D8] text-center space-y-3">
          <Compass className="w-10 h-10 text-[#8A9790] mx-auto" />
          <h3 className="text-base font-semibold text-[#174D3C]">Community feed is quiet</h3>
          <p className="text-xs text-[#5E6963]">
            Be the first traveler to post a story or share photography from your adventures.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => {
            const isOwner = user?.id === post.author;
            const comments = commentsMap[post.id] || [];
            const isCommentsOpen = activeCommentsPostId === post.id;

            return (
              <article
                key={post.id}
                className="bg-white rounded-xl border border-[#E5E3D8] shadow-sm overflow-hidden"
              >
                {/* Post Author Bar */}
                <div className="p-4 flex items-center justify-between">
                  <div
                    onClick={() => onSelectUser(post.author)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <img
                      src={post.authorProfile?.profilePhoto}
                      alt={post.authorProfile?.fullName}
                      className="w-10 h-10 rounded-full object-cover border border-[#E5E3D8]"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="text-xs font-semibold text-[#202824] group-hover:text-[#174D3C] transition-colors">
                        {post.authorProfile?.fullName || 'Traveler'}
                      </div>
                      <div className="text-[11px] text-[#8A9790]">
                        @{post.authorProfile?.username || 'user'} · {new Date(post.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#8A9790]">
                    {isOwner ? (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                        title="Delete post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        onClick={() => openReportModal({ reportedPost: post.id, reportedUser: post.author })}
                        className="p-1.5 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        title="Report inappropriate content"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="px-5 pb-3 text-xs sm:text-sm text-[#202824] leading-relaxed whitespace-pre-line">
                    {post.caption}
                  </div>
                )}

                {/* Tagged Destination / Trip strip */}
                {(post.destinationDetails || post.tripDetails) && (
                  <div className="px-5 pb-3 flex flex-wrap items-center gap-2 text-xs">
                    {post.destinationDetails && (
                      <span className="inline-flex items-center gap-1 text-[#174D3C] font-medium bg-[#F8F7F2] px-2.5 py-1 rounded-md border border-[#E5E3D8]">
                        <MapPin className="w-3 h-3 text-[#27866A]" />
                        <span>{post.destinationDetails.destinationName}</span>
                      </span>
                    )}
                    {post.tripDetails && (
                      <span className="inline-flex items-center gap-1 text-[#174D3C] font-medium bg-[#F8F7F2] px-2.5 py-1 rounded-md border border-[#E5E3D8]">
                        <Calendar className="w-3 h-3 text-[#27866A]" />
                        <span>{post.tripDetails.tripTitle}</span>
                      </span>
                    )}
                  </div>
                )}

                {/* Post Images */}
                {post.images && post.images.length > 0 && (
                  <div className="relative aspect-[16/10] bg-[#EFECE3] overflow-hidden">
                    <img
                      src={post.images[0]}
                      alt="Travel moment"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Interactions Row */}
                <div className="p-4 border-t border-[#EFECE3] flex items-center justify-between text-xs text-[#5E6963]">
                  <div className="flex items-center gap-6">
                    {/* Like button */}
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${
                        post.isLiked ? 'text-red-600 font-semibold' : 'hover:text-[#174D3C]'
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-mono tabular-nums">{post.likesCount || 0}</span>
                    </button>

                    {/* Comments trigger */}
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className="flex items-center gap-1.5 hover:text-[#174D3C] transition-colors cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-mono tabular-nums">{post.commentsCount || 0}</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-[#8A9790]">
                    Verified Travel Post
                  </span>
                </div>

                {/* Expanded Comments Thread */}
                {isCommentsOpen && (
                  <div className="bg-[#F8F7F2] border-t border-[#E5E3D8] p-4 space-y-4 animate-in fade-in duration-150">
                    {/* Comments list */}
                    <div className="space-y-3">
                      {comments.length === 0 ? (
                        <div className="text-center py-2 text-xs text-[#8A9790]">
                          No comments yet. Start the conversation!
                        </div>
                      ) : (
                        comments.map(c => (
                          <div key={c.id} className="flex items-start justify-between gap-3 text-xs">
                            <div className="flex items-start gap-2.5">
                              <img
                                src={c.authorProfile?.profilePhoto}
                                alt={c.authorProfile?.fullName}
                                className="w-6 h-6 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <div className="font-semibold text-[#202824] inline mr-2">
                                  {c.authorProfile?.fullName}
                                </div>
                                <span className="text-[#5E6963] leading-relaxed">
                                  {c.commentText}
                                </span>
                                <div className="text-[10px] text-[#8A9790] mt-0.5">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>

                            {user?.id === c.author && (
                              <button
                                onClick={() => handleDeleteComment(post.id, c.id)}
                                className="text-red-400 hover:text-red-600 p-1 cursor-pointer shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Write comment input */}
                    {user && (
                      <form
                        onSubmit={e => handleAddComment(post.id, e)}
                        className="flex items-center gap-2 pt-2 border-t border-[#E5E3D8]"
                      >
                        <input
                          type="text"
                          placeholder="Write a constructive travel tip or reply..."
                          value={newCommentText}
                          onChange={e => setNewCommentText(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-[#E5E3D8] rounded-lg text-xs text-[#202824] focus:outline-none focus:ring-1 focus:ring-[#174D3C]"
                        />
                        <button
                          type="submit"
                          disabled={commentSubmitting || !newCommentText.trim()}
                          className="px-3.5 py-1.5 bg-[#174D3C] text-white rounded-lg text-xs font-semibold hover:bg-[#1F644E] cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          <span>Reply</span>
                        </button>
                      </form>
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
