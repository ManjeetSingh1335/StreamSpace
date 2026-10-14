import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { VideoCard } from '../components/common/VideoCard';
import { EmptyState } from '../components/common/EmptyState';
import { PostCard } from '../components/common/PostCard';
import { getUserChannelProfile, updateUserCoverImage } from '../api/auth.api';
import { getAllVideos } from '../api/video.api';
import { toggleSubscription } from '../api/subscription.api';
import { createTweet, getUserTweets } from '../api/tweet.api';
import { useAuth } from '../context/AuthContext';
import { formatViews } from '../utils/formatters';
import { Upload, Film, Camera, Image, X, MessageSquareQuote, Video, Eye, Users } from 'lucide-react';

export const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser, setUser } = useAuth();

  const bannerInputRef = useRef(null);
  const postImageInputRef = useRef(null);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('Videos');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribersCount, setSubscribersCount] = useState(0);

  // New post form state
  const [newPostContent, setNewPostContent] = useState('');
  const [postImage, setPostImage] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postsLoading, setPostsLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fallback to logged-in user if no username param
  const targetUsername = username || currentUser?.username;

  useEffect(() => {
    if (!targetUsername) return;

    const fetchChannelData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getUserChannelProfile(targetUsername);
        const channelData = res?.data;
        setChannel(channelData);

        if (channelData) {
          setIsSubscribed(channelData.isSubscribed || false);
          setSubscribersCount(channelData.subscribersCount || 0);

          // Fetch videos by this user
          const videoRes = await getAllVideos({ userId: channelData._id });
          setVideos(videoRes?.data?.docs || videoRes?.data || []);

          // Fetch posts by this user
          try {
            const tweetRes = await getUserTweets(channelData._id);
            setPosts(tweetRes?.data || []);
          } catch (tErr) {
            console.log('Error fetching user posts:', tErr);
          }
        }
      } catch (err) {
        console.error('Error fetching channel:', err);
        setError('Channel not found.');
      } finally {
        setLoading(false);
      }
    };

    fetchChannelData();
  }, [targetUsername]);

  const handleSubscribe = async () => {
    if (!currentUser) {
      alert('Please log in to subscribe');
      return;
    }
    if (!channel?._id) return;

    try {
      await toggleSubscription(channel._id);
      setIsSubscribed(!isSubscribed);
      setSubscribersCount((prev) => (isSubscribed ? Math.max(0, prev - 1) : prev + 1));
    } catch (err) {
      console.error('Subscription error:', err);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file for the banner.');
      return;
    }

    const formData = new FormData();
    formData.append('coverImage', file);

    try {
      setIsUploadingBanner(true);
      const res = await updateUserCoverImage(formData);
      const updatedUser = res?.data;
      if (updatedUser?.coverImage) {
        setChannel((prev) => ({
          ...prev,
          coverImage: updatedUser.coverImage,
        }));
        if (setUser && currentUser) {
          const updatedAuthUser = { ...currentUser, coverImage: updatedUser.coverImage };
          setUser(updatedAuthUser);
          localStorage.setItem('user', JSON.stringify(updatedAuthUser));
        }
      }
    } catch (err) {
      console.error('Error uploading cover banner:', err);
      alert(err.response?.data?.message || 'Failed to update channel banner. Please try again.');
    } finally {
      setIsUploadingBanner(false);
      if (bannerInputRef.current) {
        bannerInputRef.current.value = '';
      }
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    setPostImage(file);
    setPostImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setPostImage(null);
    if (postImagePreview) {
      URL.revokeObjectURL(postImagePreview);
      setPostImagePreview(null);
    }
    if (postImageInputRef.current) {
      postImageInputRef.current.value = '';
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !postImage) return;

    const formData = new FormData();
    if (newPostContent.trim()) {
      formData.append('content', newPostContent.trim());
    }
    if (postImage) {
      formData.append('image', postImage);
    }

    try {
      setIsCreatingPost(true);
      const res = await createTweet(formData);
      const createdPost = res?.data;
      if (createdPost) {
        const formattedPost = {
          ...createdPost,
          owner: {
            _id: currentUser?._id,
            username: currentUser?.username,
            fullName: currentUser?.fullName,
            avatar: currentUser?.avatar,
          },
          likesCount: 0,
          isLiked: false,
        };
        setPosts((prev) => [formattedPost, ...prev]);
        setNewPostContent('');
        handleRemoveImage();
      }
    } catch (err) {
      console.error('Error creating post:', err);
      alert(err.response?.data?.message || 'Failed to publish post. Please try again.');
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-44 sm:h-52 bg-neutral-200 rounded-2xl w-full" />
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-neutral-200" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-neutral-200 rounded w-1/3" />
            <div className="h-3 bg-neutral-200 rounded w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !channel) {
    return (
      <div className="p-12 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
        <h3 className="text-lg font-bold text-black mb-2">Channel Not Found</h3>
        <p className="text-xs text-neutral-500 mb-4">{error || 'This creator channel does not exist.'}</p>
        <Link to="/" className="px-5 py-2 bg-black text-white text-xs font-semibold rounded-full">
          Back to Home
        </Link>
      </div>
    );
  }

  const isOwner = currentUser && currentUser._id === channel._id;

  return (
    <div className="space-y-6 pb-12">
      {/* Cover Banner */}
      <div className="w-full h-44 sm:h-56 rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200 relative group">
        {channel.coverImage ? (
          <img
            src={channel.coverImage}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-neutral-100 via-neutral-50 to-neutral-200 flex flex-col items-center justify-center gap-1.5 text-neutral-400">
            <span className="text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap text-neutral-500">
              StreamSpace Channel Banner
            </span>
          </div>
        )}

        {/* Change Banner Button (Owner Only) */}
        {isOwner && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20">
            <input
              type="file"
              ref={bannerInputRef}
              onChange={handleBannerChange}
              accept="image/*"
              className="hidden"
              disabled={isUploadingBanner}
            />
            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              disabled={isUploadingBanner}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-black/75 hover:bg-black text-white border border-white/20 backdrop-blur-md rounded-full text-xs font-semibold tracking-wide whitespace-nowrap shadow-sm transition duration-200 active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isUploadingBanner ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span className="font-medium tracking-wide">Uploading...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5 text-neutral-200" />
                  <span className="font-semibold tracking-wide">Change Banner</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Channel Info Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 px-2">
        <div className="flex gap-4 items-start sm:items-end">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-neutral-100 overflow-hidden shadow-sm flex-shrink-0 -mt-10 sm:-mt-12 relative z-10">
            {channel.avatar ? (
              <img
                src={channel.avatar}
                alt={channel.fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xl text-neutral-700">
                {channel.fullName?.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
              {channel.fullName || channel.username}
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              @{channel.username} • {formatViews(subscribersCount).replace('views', 'subscribers')} • {videos.length} {videos.length === 1 ? 'video' : 'videos'}
            </p>
            {channel.bio && (
              <p className="text-xs text-neutral-700 pt-1 max-w-lg">
                {channel.bio}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {!isOwner && (
          <div>
            <button
              onClick={handleSubscribe}
              className={`px-6 py-2 text-xs font-bold rounded-full transition ${
                isSubscribed
                  ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300'
                  : 'bg-black text-white hover:bg-neutral-800'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-neutral-200 text-xs font-bold px-2">
        {['Home', 'Videos', 'Posts', 'About'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 transition relative ${
              activeTab === tab
                ? 'text-black border-b-2 border-black'
                : 'text-neutral-500 hover:text-black'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content: Uploads */}
      {activeTab === 'Videos' || activeTab === 'Home' ? (
        <div className="space-y-4">
          <h2 className="text-xs font-black tracking-wider uppercase text-black">
            Uploads
          </h2>

          {videos.length === 0 ? (
            <EmptyState
              icon={Film}
              title="No uploads yet"
              description={`${channel.fullName || channel.username} hasn't published any videos yet.`}
              actionLabel={isOwner ? 'Upload Your First Video' : null}
              actionLink="/upload"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </div>
      ) : activeTab === 'Posts' ? (
        <div className="space-y-6 max-w-2xl mx-auto">
          {/* Create Post Box (Channel Owner Only) */}
          {isOwner && (
            <div className="bg-white border border-neutral-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 flex-shrink-0 border border-neutral-200">
                  {currentUser?.avatar ? (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.fullName || currentUser.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-sm text-neutral-600">
                      {(currentUser?.fullName || currentUser?.username || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <textarea
                    rows={3}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Share an update or post with your community..."
                    className="w-full text-sm placeholder:text-neutral-400 border border-neutral-200 focus:border-black rounded-xl p-3 outline-none resize-none transition bg-neutral-50/50 focus:bg-white"
                  />

                  {/* Image Preview if selected */}
                  {postImagePreview && (
                    <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-900 max-h-72 flex justify-center">
                      <img
                        src={postImagePreview}
                        alt="Preview"
                        className="max-h-72 object-contain"
                      />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 p-1.5 bg-black/75 hover:bg-black text-white rounded-full transition cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div>
                      <input
                        type="file"
                        ref={postImageInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                        disabled={isCreatingPost}
                      />
                      <button
                        type="button"
                        onClick={() => postImageInputRef.current?.click()}
                        disabled={isCreatingPost}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:text-black hover:bg-neutral-100 rounded-lg transition cursor-pointer disabled:opacity-50"
                      >
                        <Image className="w-4 h-4 text-neutral-500" />
                        <span>Add Image</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handleCreatePost}
                      disabled={isCreatingPost || (!newPostContent.trim() && !postImage)}
                      className="px-5 py-2 bg-black hover:bg-neutral-800 disabled:opacity-50 text-white rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition cursor-pointer flex items-center gap-2 shadow-xs"
                    >
                      {isCreatingPost ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Posting...</span>
                        </>
                      ) : (
                        <span>Post</span>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Posts List */}
          {posts.length === 0 ? (
            <EmptyState
              icon={MessageSquareQuote}
              title="No posts yet"
              description={`${channel.fullName || channel.username} hasn't shared any community posts yet.`}
              actionLabel={null}
            />
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUser={currentUser}
                  onPostDeleted={handlePostDeleted}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 max-w-3xl">
          {/* About Header */}
          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-black tracking-tight">About {channel.fullName}</h3>
            <p className="text-sm text-neutral-500 leading-relaxed font-normal max-w-lg">
              Welcome to the official channel of {channel.fullName}. Joined StreamSpace to share engaging video content with viewers around the globe.
            </p>
          </div>

          {/* Creative Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Total Videos */}
            <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-xs hover:border-neutral-300 transition group">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 group-hover:bg-neutral-200/70 flex items-center justify-center transition">
                <Video className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase">Total Videos</p>
                <p className="text-lg font-bold text-black leading-tight tracking-tight">{videos.length}</p>
              </div>
            </div>

            {/* Total Views */}
            <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-xs hover:border-neutral-300 transition group">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 group-hover:bg-neutral-200/70 flex items-center justify-center transition">
                <Eye className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase">Total Views</p>
                <p className="text-lg font-bold text-black leading-tight tracking-tight">
                  {formatViews(videos.reduce((sum, v) => sum + (v.views || 0), 0))}
                </p>
              </div>
            </div>

            {/* Subscribers */}
            <div className="flex items-center gap-4 bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-xs hover:border-neutral-300 transition group">
              <div className="w-11 h-11 rounded-xl bg-neutral-100 group-hover:bg-neutral-200/70 flex items-center justify-center transition">
                <Users className="w-5 h-5 text-neutral-600" />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400 font-medium tracking-wide uppercase">Subscribers</p>
                <p className="text-lg font-bold text-black leading-tight tracking-tight">{subscribersCount}</p>
              </div>
            </div>
          </div>

          {/* Channel Details */}
          <div className="bg-white border border-neutral-200 rounded-2xl px-5 py-4 shadow-xs space-y-3 max-w-md">
            <h4 className="text-xs font-bold text-black tracking-wide uppercase">Channel Details</h4>
            <div className="space-y-2 text-xs text-neutral-600">
              <div className="flex justify-between">
                <span className="text-neutral-400 font-medium">Username</span>
                <span className="font-semibold text-black">@{channel.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-medium">Full Name</span>
                <span className="font-semibold text-black">{channel.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400 font-medium">Email</span>
                <span className="font-semibold text-black">{channel.email || '—'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
