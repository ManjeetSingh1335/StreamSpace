import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Share2, MessageSquare, MoreVertical, Trash2, Send, Image as ImageIcon } from 'lucide-react';
import { formatTimeAgo } from '../../utils/formatters';
import { toggleTweetLike, deleteTweet } from '../../api/tweet.api';
import { getTweetComments, addTweetComment, deleteComment } from '../../api/comment.api';

export const PostCard = ({ post, currentUser, onPostDeleted }) => {
  const [likesCount, setLikesCount] = useState(post?.likesCount || 0);
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Comments state
  const [commentsCount, setCommentsCount] = useState(post?.commentsCount || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const menuRef = useRef(null);

  const isOwner = currentUser?._id && (post?.owner?._id === currentUser._id || post?.owner === currentUser._id);

  // Close 3-dots menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showMenu]);

  const handleLike = async () => {
    if (!currentUser) {
      alert('Please log in to like posts');
      return;
    }

    const previousLiked = isLiked;
    const previousCount = likesCount;

    // Optimistic UI update
    setIsLiked(!previousLiked);
    setLikesCount(previousLiked ? Math.max(0, previousCount - 1) : previousCount + 1);
    if (!previousLiked && isDisliked) setIsDisliked(false);

    try {
      await toggleTweetLike(post._id);
    } catch (err) {
      console.error('Error toggling tweet like:', err);
      // Revert on error
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
    }
  };

  const handleDislike = () => {
    if (!currentUser) {
      alert('Please log in');
      return;
    }
    setIsDisliked(!isDisliked);
    if (!isDisliked && isLiked) {
      setIsLiked(false);
      setLikesCount((prev) => Math.max(0, prev - 1));
      toggleTweetLike(post._id).catch(() => {});
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      setIsDeleting(true);
      await deleteTweet(post._id);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post.');
      setIsDeleting(false);
    }
  };

  const handleToggleComments = async () => {
    const nextState = !showComments;
    setShowComments(nextState);
    if (nextState && comments.length === 0) {
      try {
        setCommentsLoading(true);
        const res = await getTweetComments(post._id);
        const fetched = res?.data?.docs || res?.data || [];
        setComments(fetched);
        if (res?.data?.totalDocs !== undefined) {
          setCommentsCount(res.data.totalDocs);
        }
      } catch (err) {
        console.error('Error fetching tweet comments:', err);
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Please log in to add a comment.');
      return;
    }
    if (!newComment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const res = await addTweetComment(post._id, newComment.trim());
      const added = res?.data;
      if (added) {
        setComments((prev) => [added, ...prev]);
        setCommentsCount((prev) => prev + 1);
        setNewComment('');
      }
    } catch (err) {
      console.error('Error adding tweet comment:', err);
      alert('Failed to post comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentsCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Failed to delete comment.');
    }
  };

  // Helper to format text with clickable hashtags
  const renderFormattedContent = (content) => {
    if (!content) return null;
    const parts = content.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#')) {
        return (
          <span key={index} className="text-blue-600 font-medium hover:underline cursor-pointer">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3 transition duration-200 hover:border-neutral-300">
      {/* Top Header: Avatar, Name, Time, Menu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
            {post.owner?.avatar ? (
              <img
                src={post.owner.avatar}
                alt={post.owner.fullName || post.owner.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-sm text-neutral-600">
                {(post.owner?.fullName || post.owner?.username || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-900 tracking-tight leading-none">
                {post.owner?.fullName || post.owner?.username}
              </span>
              <span className="text-xs text-neutral-400 font-normal">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
            {post.owner?.username && (
              <span className="text-[11px] text-neutral-400 font-medium block pt-0.5">
                @{post.owner.username}
              </span>
            )}
          </div>
        </div>

        {/* 3-dots Menu */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 text-neutral-400 hover:text-black rounded-full hover:bg-neutral-100 transition"
              title="More options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-36 bg-white border border-neutral-200 rounded-xl shadow-lg py-1 z-30">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 font-medium hover:bg-red-50 transition disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Post Text Content */}
      {post.content && (
        <div className="text-sm text-neutral-800 leading-relaxed font-normal whitespace-pre-line tracking-normal">
          {renderFormattedContent(post.content)}
        </div>
      )}

      {/* Attached Image (if present) */}
      {post.image && (
        <div className="rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-950 flex items-center justify-center max-h-[520px]">
          <img
            src={post.image}
            alt="Post content"
            className="w-full h-auto max-h-[520px] object-contain rounded-xl"
            loading="lazy"
          />
        </div>
      )}

      {/* Action Footer: Like, Dislike, Share, Comments */}
      <div className="flex items-center gap-6 pt-2 text-neutral-600 text-xs">
        {/* Like */}
        <button
          type="button"
          onClick={handleLike}
          className={`flex items-center gap-1.5 py-1 px-2 rounded-full hover:bg-neutral-100 transition cursor-pointer ${
            isLiked ? 'text-black font-semibold' : ''
          }`}
          title="Like"
        >
          <ThumbsUp className={`w-4 h-4 ${isLiked ? 'fill-black text-black' : ''}`} />
          <span className="text-xs font-medium">{likesCount > 0 ? likesCount : ''}</span>
        </button>

        {/* Dislike */}
        <button
          type="button"
          onClick={handleDislike}
          className={`p-1.5 rounded-full hover:bg-neutral-100 transition cursor-pointer ${
            isDisliked ? 'text-black' : ''
          }`}
          title="Dislike"
        >
          <ThumbsDown className={`w-4 h-4 ${isDisliked ? 'fill-black text-black' : ''}`} />
        </button>

        {/* Comments Count Button */}
        <button
          type="button"
          onClick={handleToggleComments}
          className={`flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-neutral-100 transition cursor-pointer ${
            showComments ? 'text-black font-semibold bg-neutral-100' : 'text-neutral-600 hover:text-black'
          }`}
          title="Comments"
        >
          <MessageSquare className={`w-4 h-4 ${showComments ? 'fill-neutral-300' : ''}`} />
          <span className="text-xs font-medium">{commentsCount}</span>
        </button>
      </div>

      {/* Expandable Comments Drawer */}
      {showComments && (
        <div className="border-t border-neutral-100 pt-3.5 mt-2 space-y-3.5">
          {/* New Comment Input */}
          <form onSubmit={handleAddComment} className="flex gap-2.5 items-center">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName || currentUser.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-bold text-xs text-neutral-600">
                  {(currentUser?.fullName || currentUser?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 relative flex items-center">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={currentUser ? 'Add a comment...' : 'Log in to comment...'}
                disabled={!currentUser || isSubmittingComment}
                className="w-full text-xs placeholder:text-neutral-400 bg-neutral-50 hover:bg-neutral-100/70 focus:bg-white border border-neutral-200 focus:border-black rounded-full py-2 pl-3.5 pr-10 outline-none transition disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!currentUser || isSubmittingComment || !newComment.trim()}
                className="absolute right-1.5 p-1.5 bg-black hover:bg-neutral-800 disabled:opacity-30 text-white rounded-full transition cursor-pointer"
                title="Post comment"
              >
                <Send className="w-3 h-3" />
              </button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="space-y-2.5 py-2">
              <div className="h-3.5 bg-neutral-100 rounded w-1/3 animate-pulse" />
              <div className="h-3 bg-neutral-100 rounded w-2/3 animate-pulse" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-[11px] text-neutral-400 py-2 text-center font-normal">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-2.5 pt-1 max-h-80 overflow-y-auto pr-1">
              {comments.map((comment) => {
                const isCommentOwner =
                  currentUser?._id &&
                  (comment.owner?._id === currentUser._id || comment.owner === currentUser._id);
                return (
                  <div key={comment._id} className="flex gap-2.5 items-start text-xs group">
                    <div className="w-7 h-7 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200 mt-0.5">
                      {comment.owner?.avatar ? (
                        <img
                          src={comment.owner.avatar}
                          alt={comment.owner.fullName || comment.owner.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-[10px] text-neutral-600">
                          {(comment.owner?.fullName || comment.owner?.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-neutral-50/80 hover:bg-neutral-50 rounded-xl px-3 py-2 space-y-0.5 border border-neutral-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-neutral-900 text-[11px]">
                            {comment.owner?.fullName || comment.owner?.username}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                        {isCommentOwner && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-neutral-400 hover:text-red-600 transition p-0.5 cursor-pointer opacity-0 group-hover:opacity-100"
                            title="Delete comment"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-neutral-700 text-xs leading-relaxed whitespace-pre-line">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
