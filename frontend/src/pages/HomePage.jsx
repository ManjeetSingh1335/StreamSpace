import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAllVideos } from '../api/video.api';
import { VideoCard } from '../components/common/VideoCard';
import { EmptyState } from '../components/common/EmptyState';

export const HomePage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('query') || '';

  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getAllVideos({ query, limit: 12 });
        // The backend returns paginate docs in res.data.docs or res.data
        const videoList = res?.data?.docs || res?.data || [];
        setVideos(videoList);
      } catch (err) {
        console.error('Error fetching videos:', err);
        setError('Failed to load videos from the server.');
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [query]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-black tracking-wider text-black uppercase">
          {query ? `Search results for "${query}"` : 'Recommended For You'}
        </h2>
        {videos.length > 0 && (
          <span className="text-xs text-neutral-500 font-medium">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </span>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-video bg-neutral-200 rounded-xl" />
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-full bg-neutral-200 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-3/4" />
                  <div className="h-3 bg-neutral-200 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
          <p className="text-sm text-neutral-600 mb-3">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-1.5 text-xs font-semibold bg-black text-white rounded-full hover:bg-neutral-800"
          >
            Retry
          </button>
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          title={query ? 'No matching videos' : 'No videos yet'}
          description={
            query
              ? `We couldn't find any videos matching "${query}". Try searching for something else.`
              : 'Be the first creator to publish a video on StreamSpace!'
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};
