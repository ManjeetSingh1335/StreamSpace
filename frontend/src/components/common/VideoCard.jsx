import React from 'react';
import { Link } from 'react-router-dom';
import { formatDuration, formatViews, formatTimeAgo } from '../../utils/formatters';

export const VideoCard = ({ video }) => {
  if (!video) return null;

  const owner = video.owner || {};
  const channelName = owner.fullName || owner.username || "Creator";
  const channelUsername = owner.username || "";
  const avatarUrl = owner.avatar;

  return (
    <div className="flex flex-col group cursor-pointer">
      <Link to={`/watch/${video._id}`} className="relative aspect-video rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
        {video.thumbnail ? (
          <img
            src={video.thumbnail}
            alt={video.title}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-neutral-100 text-neutral-400">
            No Thumbnail
          </div>
        )}
        {video.duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/85 text-white text-[11px] font-semibold rounded tracking-wider">
            {formatDuration(video.duration)}
          </span>
        )}
      </Link>

      <div className="flex gap-3 mt-3 items-start">
        <Link to={`/c/${channelUsername}`} className="flex-shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={channelName}
              className="w-9 h-9 rounded-full object-cover border border-neutral-200 hover:opacity-85 transition"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-neutral-200 flex items-center justify-center text-xs font-bold text-neutral-700">
              {channelName.charAt(0).toUpperCase()}
            </div>
          )}
        </Link>

        <div className="flex flex-col flex-grow min-w-0">
          <Link
            to={`/watch/${video._id}`}
            className="text-sm font-medium sm:font-semibold tracking-wide text-neutral-900 truncate hover:text-black transition-colors block"
            title={video.title}
          >
            {video.title}
          </Link>
          <Link
            to={`/c/${channelUsername}`}
            className="text-xs text-neutral-500 hover:text-neutral-800 tracking-normal mt-1 truncate"
          >
            {channelName}
          </Link>
          <div className="text-xs text-neutral-500 mt-0.5">
            {formatViews(video.views)} • {formatTimeAgo(video.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
};
