import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Plus, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar = ({ onSearch }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showDropdown]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchTerm);
    } else {
      navigate(`/?query=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-neutral-200 px-4 md:px-6 h-16 flex items-center justify-between gap-4">
      {/* Brand Logo - Bigger, clean modern sans-serif, open letter spacing */}
      <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
        <img
          src="/logo-transparent.png"
          alt="StreamSpace"
          className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
        />
        <span className="font-bold text-xl tracking-tight text-neutral-900 whitespace-nowrap">
          StreamSpace
        </span>
      </Link>

      {/* Centered Search Bar */}
      <form
        onSubmit={handleSearchSubmit}
        className="flex-1 max-w-xl mx-2 md:mx-6"
      >
        <div className="relative flex items-center w-full">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search videos, creators, topics..."
            className="w-full h-10 pl-4 pr-10 text-sm bg-neutral-50 border border-neutral-300 rounded-full focus:outline-none focus:border-black focus:bg-white transition"
          />
          <button
            type="submit"
            className="absolute right-3 text-neutral-400 hover:text-black transition"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isAuthenticated ? (
          <>
            <Link
              to="/upload"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-900 text-xs font-semibold tracking-wide rounded-full border border-neutral-200 transition"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Upload
            </Link>

            <button
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-600 hover:text-black hover:bg-neutral-100 transition"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
            </button>

            {/* Profile Menu Dropdown with Outside Click Detection */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-9 h-9 rounded-full overflow-hidden border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-black flex items-center justify-center bg-neutral-100 transition hover:border-black"
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName || user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-neutral-600" />
                )}
              </button>

              {showDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-neutral-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-4 py-2.5 border-b border-neutral-100">
                    <p className="font-semibold text-neutral-900 tracking-wide text-sm truncate">
                      {user?.fullName || user?.username}
                    </p>
                    <p className="text-xs text-neutral-500 tracking-normal truncate mt-0.5">
                      @{user?.username}
                    </p>
                  </div>

                  <div className="py-1">
                    <Link
                      to={`/c/${user?.username}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-black text-xs font-medium tracking-wide transition"
                    >
                      <UserIcon className="w-4 h-4 text-neutral-500" />
                      <span>Your Channel</span>
                    </Link>
                  </div>

                  <div className="border-t border-neutral-100 my-1" />

                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      logout();
                    }}
                    className="w-full text-left flex items-center gap-2.5 px-4 py-2 hover:bg-neutral-50 text-neutral-800 hover:text-black text-xs font-medium tracking-wide transition"
                  >
                    <LogOut className="w-4 h-4 text-neutral-500" />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="px-4 py-1.5 bg-black text-white text-xs font-semibold tracking-wide rounded-full hover:bg-neutral-800 transition"
            >
              Log In
            </Link>
            <Link
              to="/register"
              className="hidden sm:inline-block px-3.5 py-1.5 bg-neutral-100 text-black text-xs font-semibold tracking-wide rounded-full hover:bg-neutral-200 border border-neutral-200 transition"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};
