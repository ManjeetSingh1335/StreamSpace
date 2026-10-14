import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Eye, EyeOff, AlertCircle, Upload, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { AuthIllustration } from '../components/auth/AuthIllustration';

export const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [coverImageFile, setCoverImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const avatarInputRef = useRef(null);

  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !username.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!avatarFile) {
      setError('Profile avatar image is required.');
      return;
    }

    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('fullName', fullName.trim());
    formData.append('email', email.trim());
    formData.append('username', username.trim().toLowerCase());
    formData.append('password', password);
    formData.append('avatar', avatarFile);
    if (coverImageFile) {
      formData.append('coverImage', coverImageFile);
    }

    try {
      await register(formData);
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK' || !err.response) {
        setError('Cannot reach backend server. Please ensure the backend is running on port 4500 (npm run dev in Backend_02).');
      } else {
        setError(
          typeof err.response?.data === 'string'
            ? 'Registration failed. Please check your connection and inputs.'
            : 'Registration failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex flex-col md:flex-row">
      {/* Left Column (Brand & Illustration) - Expanded prominent area */}
      <div className="w-full md:w-[62%] lg:w-[64%] p-8 sm:p-12 lg:p-16 flex flex-col justify-between bg-neutral-50/40 border-b md:border-b-0 border-neutral-200">
        <div>
          <Link to="/" className="inline-flex items-center gap-3 group mb-6 sm:mb-8">
            <img
              src="/logo-transparent.png"
              alt="StreamSpace"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105 drop-shadow-xs"
            />
            <span className="font-bold text-xl sm:text-2xl tracking-tight text-neutral-900">
              StreamSpace
            </span>
          </Link>

          {/* Creative Hero Heading - Bigger than title with gradient accent and subtle underline */}
          <div>
            <h1 className="text-2xl sm:text-[28px] lg:text-[32px] font-semibold tracking-tight text-neutral-900 whitespace-nowrap">
              Create your{' '}
              <span className="relative inline-block font-extrabold bg-gradient-to-r from-black via-neutral-800 to-neutral-500 bg-clip-text text-transparent">
                StreamSpace
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-gradient-to-r from-black to-neutral-300 rounded-full" />
              </span>{' '}
              account
            </h1>
            <p className="text-xs sm:text-sm font-normal text-neutral-500 mt-3 tracking-normal leading-relaxed">
              Join millions of creators and viewers around the world.
            </p>
          </div>
        </div>

        {/* 3D Animation centered in the remaining open space */}
        <div className="my-auto py-4 sm:py-6 flex justify-center w-full">
          <AuthIllustration />
        </div>

        <div className="text-xs text-neutral-400">
          © {new Date().getFullYear()} StreamSpace. All rights reserved.
        </div>
      </div>

      {/* Crisp Vertical Divider Line */}
      <div className="hidden md:block w-[1px] bg-neutral-200 self-stretch flex-shrink-0" />

      {/* Right Column (Sign Up Form) - Compact, less area */}
      <div className="w-full md:w-[38%] lg:w-[36%] p-6 sm:p-10 lg:p-12 flex items-center justify-center bg-white">
        <div className="w-full max-w-[340px] space-y-4">
          <div>
            <h2 className="text-2xl font-black text-black tracking-tight">
              Create account
            </h2>
            <p className="text-xs text-neutral-500 mt-1">
              Fill in your details
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-neutral-100 border border-neutral-300 rounded-xl text-xs text-black">
              <AlertCircle className="w-4 h-4 text-black flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-black block">
                Full name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username e.g. nature_explorer"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-3.5 py-2 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-black block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-3.5 py-2 pr-10 text-xs bg-neutral-50 border border-neutral-300 rounded-xl focus:outline-none focus:border-black focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2 text-neutral-400 hover:text-black transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Avatar Selector */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-black block">
                Avatar Image (Required)
              </label>
              <div
                onClick={() => avatarInputRef.current?.click()}
                className="flex items-center gap-3 p-2.5 bg-neutral-50 border border-neutral-300 rounded-xl cursor-pointer hover:border-black transition"
              >
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Avatar preview"
                    className="w-10 h-10 rounded-full object-cover border border-neutral-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                    <Upload className="w-4 h-4" />
                  </div>
                )}
                <div className="text-xs flex-1">
                  <p className="font-semibold text-black">
                    {avatarFile ? avatarFile.name : 'Select profile avatar'}
                  </p>
                  <p className="text-[10px] text-neutral-400">JPG or PNG image</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-neutral-800 disabled:opacity-50 transition shadow-sm"
            >
              {loading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-3">
            <div className="border-t border-neutral-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold text-neutral-400 uppercase tracking-widest absolute">
              OR
            </span>
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => alert('Google authentication is ready to connect with your OAuth provider.')}
            className="w-full py-2 bg-white border border-neutral-300 text-black text-xs font-semibold rounded-xl hover:bg-neutral-50 transition flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </button>

          <p className="text-center text-xs text-neutral-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-black hover:underline">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
