import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { VideoCard } from '../components/common/VideoCard';
import { PostCard } from '../components/common/PostCard';
import { EmptyState } from '../components/common/EmptyState';
import { getSubscribedFeed, getSubscribedChannels } from '../api/subscription.api';
import { useAuth } from '../context/AuthContext';
import { TvMinimalPlay, Film, MessageSquareQuote, Users, Play, Sparkles } from 'lucide-react';

export const SubscriptionsPage = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChannelId = searchParams.get('channelId') || 'all';

  const [channels, setChannels] = useState([]);
  const [videos, setVideos] = useState([]);
  const [posts, setPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('All'); // 'All' | 'Videos' | 'Posts'
  const [loading, setLoading] = useState(true);

  // Fetch subscribed channels
  useEffect(() => {
    if (!user?._id) {
      setLoading(false);
      return;
    }

    const loadSubscribedChannels = async () => {
      try {
        const res = await getSubscribedChannels(user._id);
        const list = res?.data || [];
        setChannels(list.map((item) => item.channel).filter(Boolean));
      } catch (err) {
        console.error('Error fetching subscribed channels:', err);
      }
    };

    loadSubscribedChannels();
  }, [user]);

  // Fetch feed (videos and posts)
  useEffect(() => {
    if (!user?._id) return;

    const loadFeed = async () => {
      setLoading(true);
      try {
        const res = await getSubscribedFeed(
          selectedChannelId === 'all' ? null : selectedChannelId
        );
        setVideos(res?.data?.videos || []);
        setPosts(res?.data?.posts || []);
      } catch (err) {
        console.error('Error loading subscription feed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadFeed();
  }, [user, selectedChannelId]);

  const handleSelectChannel = (channelId) => {
    if (channelId === 'all') {
      searchParams.delete('channelId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ channelId });
    }
  };

  const handlePostDeleted = (deletedId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedId));
  };

  if (!user) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-black border border-neutral-200">
          <Users className="w-8 h-8 text-neutral-700" />
        </div>
        <h2 className="text-xl font-bold text-black tracking-tight">
          Don't miss new videos and posts
        </h2>
        <p className="text-xs text-neutral-500 font-medium">
          Sign in to see updates from your favorite StreamSpace channels.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header: Title & Channel Avatars Carousel */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight">
            Subscriptions
          </h1>
          {/* Content Type Filter: All / Videos / Posts */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-full text-xs font-semibold">
            {['All', 'Videos', 'Posts'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-1.5 rounded-full transition cursor-pointer ${
                  activeTab === tab
                    ? 'bg-black text-white shadow-xs'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Channels horizontal avatar strip */}
        {channels.length > 0 && (
          <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none border-b border-neutral-100">
            {/* All Channels Button */}
            <button
              onClick={() => handleSelectChannel('all')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition cursor-pointer border ${
                selectedChannelId === 'all'
                  ? 'bg-black text-white border-black shadow-xs'
                  : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>All Subscriptions</span>
            </button>

            {/* Individual Subscribed Channels */}
            {channels.map((channel) => {
              const isSelected = selectedChannelId === channel._id;
              return (
                <button
                  key={channel._id}
                  onClick={() => handleSelectChannel(channel._id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide whitespace-nowrap transition cursor-pointer border ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-xs'
                      : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0">
                    {channel.avatar ? (
                      <img
                        src={channel.avatar}
                        alt={channel.fullName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-[9px]">
                        {(channel.fullName || channel.username || 'C').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span>{channel.fullName || channel.username}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-video bg-neutral-200 rounded-2xl w-full" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex-shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : channels.length === 0 ? (
        /* Empty Subscriptions State */
        <EmptyState
          icon={Users}
          title="No subscriptions yet"
          description="When you subscribe to creators, their latest videos and community posts will appear here."
          actionLabel="Explore Videos"
          actionLink="/"
        />
      ) : videos.length === 0 && posts.length === 0 ? (
        /* No Content from Subscriptions */
        <EmptyState
          icon={Film}
          title="No updates yet"
          description="None of your subscribed creators have published videos or community posts yet."
          actionLabel="Explore Home"
          actionLink="/"
        />
      ) : (
        /* Feed Content */
        <div className="space-y-10">
          {/* Videos Section */}
          {(activeTab === 'All' || activeTab === 'Videos') && videos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-800 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  <span>Latest Videos</span>
                </h2>
                <span className="text-xs text-neutral-400 font-medium">
                  {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))}
              </div>
            </div>
          )}

          {/* Posts Section */}
          {(activeTab === 'All' || activeTab === 'Posts') && posts.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold tracking-wide uppercase text-neutral-800 flex items-center gap-2">
                  <MessageSquareQuote className="w-4 h-4" />
                  <span>Community Posts</span>
                </h2>
                <span className="text-xs text-neutral-400 font-medium">
                  {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                </span>
              </div>
              <div className="space-y-4 max-w-2xl mx-auto">
                {posts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    currentUser={user}
                    onPostDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
