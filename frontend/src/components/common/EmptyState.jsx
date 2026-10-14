import React from 'react';
import { Film, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export const EmptyState = ({
  icon: Icon = Film,
  title = "No videos found",
  description = "No videos have been uploaded yet. Be the first to share your content!",
  actionLabel = "Upload Video",
  actionLink = "/upload",
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4 border border-neutral-200">
        <Icon className="w-8 h-8 text-neutral-600 stroke-[1.5]" />
      </div>
      <h3 className="text-lg font-bold text-black mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-sm mb-6">{description}</p>
      {actionLabel && actionLink && (
        <Link
          to={actionLink}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition"
        >
          <Plus className="w-4 h-4" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
};
