import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Home, User, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSubscribedChannels } from '../../api/subscription.api';

// YouTube-style stacked Subscriptions icon
const SubscriptionsIcon = ({ className = 'w-4 h-4' }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 6h16" />
    <path d="M7 3h10" />
    <rect x="2" y="9" width="20" height="12" rx="2" />
    <polygon points="10 12 15 15 10 18" fill="currentColor" />
  </svg>
);

export const Sidebar = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [showPopover, setShowPopover] = useState(false);
  const [showAllSubs, setShowAllSubs] = useState(false);
  const hoverTimeoutRef = useRef(null);

  // Fetch subscribed channels when user changes
  useEffect(() => {
    if (!user?._id) {
      setSubscriptions([]);
      return;
    }
    getSubscribedChannels(user._id)
      .then((res) => {
        const list = res?.data || [];
        setSubscriptions(list.map((s) => s.channel).filter(Boolean));
      })
      .catch((err) => console.error('Error fetching subscriptions in sidebar:', err));
  }, [user]);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 250);
  };

  return (
    <aside className="w-48 sm:w-56 flex-shrink-0 border-r border-neutral-200 bg-white min-h-[calc(100vh-4rem)] p-3 hidden md:flex flex-col justify-between relative">
      <div className="flex flex-col gap-1">
        {/* Home */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-colors ${
              isActive
                ? 'bg-neutral-100 text-black font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
            }`
          }
        >
          <Home className="w-4 h-4 stroke-[2]" />
          <span>Home</span>
        </NavLink>

        {/* Subscriptions - with Hover Popover */}
        <div
          className="relative"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <NavLink
            to="/subscriptions"
            className={({ isActive }) =>
              `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-colors ${
                isActive
                  ? 'bg-neutral-100 text-black font-bold'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
              }`
            }
          >
            <SubscriptionsIcon className="w-4 h-4" />
            <span>Subscriptions</span>
          </NavLink>

          {/* YouTube-style Subscriptions Hover Popover */}
          {showPopover && (
            <div
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              className="absolute left-full top-0 ml-2 w-64 bg-[#1f1f1f] text-white rounded-2xl shadow-2xl p-2.5 z-50 border border-neutral-800 animate-in fade-in duration-150"
            >
              <div className="px-2.5 py-1.5 flex items-center justify-between border-b border-neutral-800/80 mb-1">
                <span className="text-xs font-bold text-white tracking-wide">Subscriptions</span>
                {subscriptions.length > 0 && (
                  <span className="text-[10px] text-neutral-400 font-medium">
                    {subscriptions.length}
                  </span>
                )}
              </div>

              {!user ? (
                <div className="p-3 text-center space-y-2">
                  <p className="text-xs text-neutral-400">
                    Sign in to see your subscribed channels
                  </p>
                  <Link
                    to="/login"
                    onClick={() => setShowPopover(false)}
                    className="inline-block px-3.5 py-1 bg-white text-black text-[11px] font-semibold rounded-full hover:bg-neutral-200 transition"
                  >
                    Sign In
                  </Link>
                </div>
              ) : subscriptions.length === 0 ? (
                <div className="p-3 text-center">
                  <p className="text-xs text-neutral-400">No subscriptions yet</p>
                  <Link
                    to="/"
                    onClick={() => setShowPopover(false)}
                    className="text-[11px] text-blue-400 hover:underline mt-1 block"
                  >
                    Discover channels
                  </Link>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {(showAllSubs ? subscriptions : subscriptions.slice(0, 6)).map((channel) => (
                    <Link
                      key={channel._id}
                      to={`/subscriptions?channelId=${channel._id}`}
                      onClick={() => setShowPopover(false)}
                      className="flex items-center justify-between px-2.5 py-1.5 rounded-xl hover:bg-neutral-800/90 transition group cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-700 flex-shrink-0">
                          {channel.avatar ? (
                            <img
                              src={channel.avatar}
                              alt={channel.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center font-bold text-[9px] text-neutral-300">
                              {(channel.fullName || channel.username || 'C')
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-xs font-medium text-neutral-200 group-hover:text-white truncate">
                          {channel.fullName || channel.username}
                        </span>
                      </div>
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                    </Link>
                  ))}

                  {subscriptions.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllSubs(!showAllSubs)}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 mt-1 text-xs text-neutral-400 hover:text-white hover:bg-neutral-800/60 rounded-xl transition cursor-pointer"
                    >
                      {showAllSubs ? (
                        <>
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3.5 h-3.5" />
                          <span>Show more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <NavLink
          to={user ? `/c/${user.username}` : '/login'}
          className={({ isActive }) =>
            `flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-sm transition-colors ${
              isActive
                ? 'bg-neutral-100 text-black font-bold'
                : 'text-neutral-600 hover:text-black hover:bg-neutral-50 font-medium'
            }`
          }
        >
          <User className="w-4 h-4 stroke-[2]" />
          <span>Profile</span>
        </NavLink>
      </div>
    </aside>
  );
};
