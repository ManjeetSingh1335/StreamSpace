import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ThumbsUp,
  ThumbsDown,
  Share2,
  Download,
  Bookmark,
  MoreHorizontal,
  Trash2,
  Send,
  Check,
} from 'lucide-react';
import { getVideoById, getAllVideos } from '../api/video.api';
import { toggleVideoLike } from '../api/like.api';
import { toggleSubscription, getSubscriptionStatus } from '../api/subscription.api';
import { getVideoComments, addComment, deleteComment } from '../api/comment.api';
import { useAuth } from '../context/AuthContext';
import { formatDuration, formatViews, formatTimeAgo } from '../utils/formatters';

export const WatchPage = () => {
  const { videoId } = useParams();
  const { user } = useAuth();

  const [video, setVideo] = useState(null);
  const [upNextVideos, setUpNextVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);
  const [copied, setCopied] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getVideoById(videoId);
        const videoData = res?.data;
        setVideo(videoData);

        if (videoData) {
          setLikesCount(videoData.likesCount || 0);

          // Check subscription status if user is logged in
          if (videoData.owner?._id) {
            try {
              const subRes = await getSubscriptionStatus(videoData.owner._id);
              setIsSubscribed(subRes?.data?.isSubscribed || false);
              setSubscribersCount(videoData.owner.subscribersCount || 0);
            } catch (err) {
              // Ignore if unauthenticated
            }
          }
        }

        // Fetch comments
        try {
          const commentsRes = await getVideoComments(videoId);
          setComments(commentsRes?.data?.docs || commentsRes?.data || []);
        } catch (err) {
          console.error('Error fetching comments:', err);
        }

        // Fetch up next videos
        try {
          const nextRes = await getAllVideos({ limit: 6 });
          const all = nextRes?.data?.docs || nextRes?.data || [];
          setUpNextVideos(all.filter((v) => v._id !== videoId));
        } catch (err) {
          console.error('Error fetching up next videos:', err);
        }
      } catch (err) {
        console.error('Error loading video:', err);
        setError('Video could not be loaded.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideoDetails();
    window.scrollTo(0, 0);
  }, [videoId]);

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like this video');
      return;
    }
    try {
      await toggleVideoLike(videoId);
      setIsLiked(!isLiked);
      setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error('Like toggle failed:', err);
    }
  };

  const handleSubscribe = async () => {
    if (!user) {
      alert('Please log in to subscribe');
      return;
    }
    const channelId = video?.owner?._id;
    if (!channelId) return;

    try {
      await toggleSubscription(channelId);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error('Subscription toggle failed:', err);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!user) {
      alert('Please log in to leave a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const res = await addComment(videoId, newComment.trim());
      const added = res?.data;
      if (added) {
        // Prepend new comment with current user info
        setComments([
          {
            ...added,
            owner: {
              _id: user._id,
              username: user.username,
              fullName: user.fullName,
              avatar: user.avatar,
            },
          },
          ...comments,
        ]);
        setNewComment('');
      }
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments(comments.filter((c) => c._id !== commentId));
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="aspect-video bg-neutral-200 rounded-2xl w-full" />
        <div className="h-6 bg-neutral-200 rounded w-1/2" />
        <div className="h-12 bg-neutral-200 rounded-xl w-full" />
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
        <h3 className="text-lg font-bold text-black mb-2">Video Unavailable</h3>
        <p className="text-sm text-neutral-500 mb-4">{error || 'This video does not exist.'}</p>
        <Link to="/" className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-full">
          Back to Home
        </Link>
      </div>
    );
  }

  const owner = video.owner || {};
  const channelName = owner.fullName || owner.username || 'Creator';
  const isOwner = user && user._id === owner._id;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
      {/* Main Video Area (Left 2 cols) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Video Player */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-neutral-200 shadow-sm">
          <video
            src={video.videoFile}
            poster={video.thumbnail}
            controls
            autoPlay
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        {/* Video Title - Medium to semi-bold, clean modern sans-serif, single line */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold tracking-wide text-neutral-900 truncate" title={video.title}>
          {video.title}
        </h1>

        {/* Channel & Action Row */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-2 border-b border-neutral-100">
          {/* Creator Profile */}
          <div className="flex items-center gap-3">
            <Link to={`/c/${owner.username}`}>
              {owner.avatar ? (
                <img
                  src={owner.avatar}
                  alt={channelName}
                  className="w-11 h-11 rounded-full object-cover border border-neutral-200 hover:opacity-85 transition"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-neutral-200 flex items-center justify-center font-bold text-sm">
                  {channelName.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>
            <div>
              <Link
                to={`/c/${owner.username}`}
                className="font-bold text-sm text-black hover:underline block leading-tight"
              >
                {channelName}
              </Link>
              <span className="text-xs text-neutral-500">
                {formatViews(subscribersCount).replace('views', 'subscribers')}
              </span>
            </div>

            {!isOwner && (
              <button
                onClick={handleSubscribe}
                className={`ml-3 px-5 py-2 text-xs font-bold rounded-full transition ${
                  isSubscribed
                    ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </button>
            )}
          </div>

          {/* Action Pills */}
          <div className="flex items-center flex-wrap gap-2 text-xs font-semibold">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full border transition ${
                isLiked
                  ? 'bg-black text-white border-black'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border-neutral-200'
              }`}
            >
              <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-white' : ''}`} />
              <span>{likesCount > 0 ? formatViews(likesCount).replace('views', '') : 'Like'}</span>
            </button>

            <button
              className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition"
              aria-label="Dislike"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share'}</span>
            </button>

            <a
              href={video.videoFile}
              download
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-neutral-50 hover:bg-neutral-100 text-neutral-800 border border-neutral-200 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          </div>
        </div>

        {/* Video Description Box */}
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-sm">
          <div className="flex gap-2 font-bold text-xs text-neutral-700 mb-2">
            <span>{formatViews(video.views)}</span>
            <span>•</span>
            <span>{formatTimeAgo(video.createdAt)}</span>
          </div>
          <p className="text-neutral-800 whitespace-pre-line leading-relaxed text-xs sm:text-sm">
            {video.description || 'No description provided.'}
          </p>
        </div>

        {/* Comments Section */}
        <div className="pt-6 space-y-4">
          <h3 className="font-bold text-base text-black">
            Comments ({comments.length})
          </h3>

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-3 items-start">
            <div className="w-9 h-9 rounded-full bg-neutral-200 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs">
              {user?.avatar ? (
                <img src={user.avatar} alt="You" className="w-full h-full object-cover" />
              ) : (
                'U'
              )}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-full focus:outline-none focus:border-black focus:bg-white transition"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 disabled:opacity-40 transition flex items-center gap-1"
              >
                <Send className="w-3 h-3" />
                Post
              </button>
            </div>
          </form>

          {/* Comment List */}
          <div className="space-y-4 pt-2">
            {comments.length === 0 ? (
              <p className="text-xs text-neutral-500 py-4 text-center">
                No comments yet. Be the first to share your thoughts!
              </p>
            ) : (
              comments.map((comment) => {
                const commentOwner = Array.isArray(comment.owner) ? comment.owner[0] : comment.owner;
                const authorName = commentOwner?.fullName || commentOwner?.username || 'User';
                const canDelete = user && (user._id === commentOwner?._id || isOwner);

                return (
                  <div key={comment._id} className="flex gap-3 text-xs items-start group">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 border border-neutral-200 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs">
                      {commentOwner?.avatar ? (
                        <img src={commentOwner.avatar} alt={authorName} className="w-full h-full object-cover" />
                      ) : (
                        authorName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-black">{authorName}</span>
                        <span className="text-[10px] text-neutral-400">
                          {formatTimeAgo(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-neutral-800 mt-1 leading-normal text-xs">
                        {comment.content}
                      </p>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black p-1 transition"
                        title="Delete comment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Up Next Sidebar (Right column) */}
      <div className="space-y-4">
        <h3 className="text-xs font-black tracking-wider uppercase text-black">
          Up Next
        </h3>

        <div className="space-y-3">
          {upNextVideos.length === 0 ? (
            <p className="text-xs text-neutral-500 py-4">No additional videos available.</p>
          ) : (
            upNextVideos.map((item) => {
              const itemOwner = item.owner || {};
              const itemName = itemOwner.fullName || itemOwner.username || 'Creator';

              return (
                <Link
                  key={item._id}
                  to={`/watch/${item._id}`}
                  className="flex gap-3 group items-start"
                >
                  <div className="relative w-36 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-neutral-400">
                        No Preview
                      </div>
                    )}
                    {item.duration > 0 && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-black/85 text-white text-[10px] font-semibold rounded">
                        {formatDuration(item.duration)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium tracking-wide text-neutral-900 truncate group-hover:text-black" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 mt-1 truncate">
                      {itemName}
                    </p>
                    <p className="text-[10px] text-neutral-400 mt-0.5">
                      {formatViews(item.views)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
