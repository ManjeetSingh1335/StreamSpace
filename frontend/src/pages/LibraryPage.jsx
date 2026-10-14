import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getChannelStats, getChannelVideos } from '../api/dashboard.api';
import { deleteVideo, togglePublishStatus } from '../api/video.api';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/common/EmptyState';
import { formatViews, formatTimeAgo } from '../utils/formatters';
import { Trash2, Eye, EyeOff, Video, Users, ThumbsUp, Plus } from 'lucide-react';

export const LibraryPage = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, videosRes] = await Promise.all([
          getChannelStats().catch(() => null),
          getChannelVideos().catch(() => null),
        ]);
        if (statsRes?.data) setStats(statsRes.data);
        if (videosRes?.data) {
          setVideos(videosRes.data.docs || videosRes.data || []);
        }
      } catch (err) {
        console.error('Library fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;
    try {
      await deleteVideo(videoId);
      setVideos(videos.filter((v) => v._id !== videoId));
      if (stats) {
        setStats({ ...stats, totalVideos: Math.max(0, stats.totalVideos - 1) });
      }
    } catch (err) {
      console.error('Delete video error:', err);
      alert('Failed to delete video.');
    }
  };

  const handleTogglePublish = async (videoId) => {
    try {
      const res = await togglePublishStatus(videoId);
      const isPublished = res?.data?.isPublished;
      setVideos(
        videos.map((v) => (v._id === videoId ? { ...v, isPublished: isPublished ?? !v.isPublished } : v))
      );
    } catch (err) {
      console.error('Toggle publish error:', err);
    }
  };

  if (!user) {
    return (
      <EmptyState
        title="Sign in to view your Library"
        description="Log in to manage your uploaded videos, channel statistics, and activity."
        actionLabel="Log In"
        actionLink="/login"
      />
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-neutral-200 rounded-xl" />
          ))}
        </div>
        <div className="h-64 bg-neutral-200 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-black tracking-tight">Your Library & Studio</h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Manage your channel uploads and review overall performance.
          </p>
        </div>
        <Link
          to="/upload"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-full hover:bg-neutral-800 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          Upload Video
        </Link>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
            <Video className="w-5 h-5 text-black stroke-[1.75]" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 font-medium">Total Videos</p>
            <p className="text-lg font-black text-black">{stats?.totalVideos ?? videos.length}</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
            <Eye className="w-5 h-5 text-black stroke-[1.75]" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 font-medium">Total Views</p>
            <p className="text-lg font-black text-black">{formatViews(stats?.totalViews ?? 0)}</p>
          </div>
        </div>

        <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 flex items-center justify-center">
            <Users className="w-5 h-5 text-black stroke-[1.75]" />
          </div>
          <div>
            <p className="text-[11px] text-neutral-500 font-medium">Subscribers</p>
            <p className="text-lg font-black text-black">{stats?.totalSubscribers ?? 0}</p>
          </div>
        </div>
      </div>

      {/* Videos List */}
      <div className="space-y-4">
        <h2 className="text-xs font-black tracking-wider uppercase text-black">
          Uploaded Videos ({videos.length})
        </h2>

        {videos.length === 0 ? (
          <EmptyState
            title="No videos uploaded yet"
            description="You haven't uploaded any videos to your channel yet."
            actionLabel="Upload Your First Video"
            actionLink="/upload"
          />
        ) : (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
            {videos.map((vid) => (
              <div
                key={vid._id}
                className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50 transition"
              >
                <div className="flex gap-3 items-center min-w-0">
                  <Link to={`/watch/${vid._id}`} className="w-24 sm:w-28 aspect-video rounded-lg overflow-hidden bg-neutral-200 flex-shrink-0">
                    <img
                      src={vid.thumbnail}
                      alt={vid.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="min-w-0">
                    <Link
                      to={`/watch/${vid._id}`}
                      className="text-xs sm:text-sm font-medium tracking-wide text-neutral-900 hover:text-black truncate block"
                      title={vid.title}
                    >
                      {vid.title}
                    </Link>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      {formatViews(vid.views)} • {formatTimeAgo(vid.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <button
                    onClick={() => handleTogglePublish(vid._id)}
                    className={`px-3 py-1 text-[11px] font-bold rounded-full border transition flex items-center gap-1.5 ${
                      vid.isPublished !== false
                        ? 'bg-neutral-100 text-neutral-800 border-neutral-300'
                        : 'bg-neutral-200 text-neutral-500 border-neutral-300'
                    }`}
                    title="Toggle Publish Status"
                  >
                    {vid.isPublished !== false ? (
                      <>
                        <Eye className="w-3 h-3" />
                        Published
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3 h-3" />
                        Unpublished
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDelete(vid._id)}
                    className="p-2 text-neutral-400 hover:text-black rounded-lg hover:bg-neutral-200 transition"
                    title="Delete Video"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
