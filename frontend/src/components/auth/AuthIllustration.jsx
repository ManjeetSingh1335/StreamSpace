import React, { useState, useRef } from 'react';
import heroImg from '../../assets/hero-signup-3d.png';

export const AuthIllustration = () => {
  const containerRef = useRef(null);
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // 3D Mouse Parallax Tilt Physics
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    const maxTilt = 12; // degrees
    const rotateY = (x / (rect.width / 2)) * maxTilt;
    const rotateX = -(y / (rect.height / 2)) * maxTilt;

    setRotate({ x: rotateX, y: rotateY });
  };

  const handleMouseEnter = () => setIsHovered(true);

  const handleMouseLeave = () => {
    setIsHovered(false);
    setRotate({ x: 0, y: 0 });
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 600);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className="relative w-full max-w-[420px] aspect-square flex items-center justify-center p-4 cursor-pointer select-none mx-auto"
      style={{ perspective: '1200px' }}
    >
      {/* 1. Ambient Background Layer (Parallax plane Z: -40px) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: isHovered
            ? `translate(${rotate.y * -2.5}px, ${rotate.x * 2.5}px)`
            : 'none',
        }}
      >
        {/* Soft Organic Clay Shapes / Blobs behind */}
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Top-left organic ear/round blob */}
          <div className="absolute top-8 left-10 w-36 h-36 bg-neutral-100 rounded-[50px] rotate-[-25deg] border border-neutral-200/70 shadow-sm animate-float-blob" />
          <div className="absolute top-12 left-14 w-20 h-20 bg-neutral-200/50 rounded-full blur-xs" />

          {/* Right sleek dark 3D fin shape */}
          <div className="absolute top-16 right-10 w-24 h-48 bg-black rounded-[45px] rotate-[22deg] shadow-xl transition-transform duration-500 group-hover:rotate-[26deg]" />

          {/* Bottom soft cloud/supportive cushion shapes */}
          <div className="absolute bottom-10 left-12 w-48 h-20 bg-neutral-100 rounded-full -rotate-6 border border-neutral-200/50" />
          <div className="absolute bottom-8 right-14 w-36 h-16 bg-neutral-200/60 rounded-full rotate-3" />

          {/* Deep ambient light bloom */}
          <div className="absolute w-72 h-72 bg-neutral-200/40 rounded-full blur-3xl -z-10" />
        </div>
      </div>

      {/* 2. Dynamic 3D Rigged Card (Isometric Tablet) */}
      <div
        className={`relative w-[310px] sm:w-[340px] aspect-[4/3.2] flex flex-col items-center justify-center transition-transform ${
          isHovered
            ? 'duration-150 ease-out'
            : 'duration-700 ease-out animate-float-isometric'
        }`}
        style={{
          transformStyle: 'preserve-3d',
          transform: isHovered
            ? `perspective(1000px) rotateY(${-15 + rotate.y}deg) rotateX(${8 + rotate.x}deg) rotateZ(-2deg) scale3d(1.04, 1.04, 1.04)`
            : undefined,
        }}
      >
        {/* Grounding Contact Shadow */}
        <div
          className="absolute -bottom-8 w-4/5 h-10 bg-black/20 rounded-full blur-xl animate-shadow-pulse pointer-events-none"
          style={{
            transform: `translateZ(-50px) scale(${isHovered ? 1.08 : 1})`,
          }}
        />

        {/* 3. The 3D Isometric Screen Body */}
        <div
          className="relative w-full h-full rounded-[28px] bg-white border-[3.5px] border-black shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35),0_10px_20px_-5px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col justify-between"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'translateZ(15px)',
          }}
        >
          {/* Main White Screen Area */}
          <div className="relative flex-1 bg-white p-5 flex flex-col justify-between overflow-hidden">
            {/* Dynamic Glass Specular Sheen Beam */}
            <div
              className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-neutral-100/80 to-transparent skew-x-[-25deg] pointer-events-none animate-screen-shine"
              style={{ transformStyle: 'preserve-3d' }}
            />

            {/* Subtle Camera / Sensor dot at top-center */}
            <div className="flex justify-center opacity-30">
              <div className="w-1.5 h-1.5 rounded-full bg-black" />
            </div>

            {/* Central Black Play Button (Elevated in 3D: Z +30px) */}
            <div
              className="self-center my-auto transition-transform duration-300"
              style={{
                transformStyle: 'preserve-3d',
                transform: `translateZ(30px) scale(${isClicked ? 1.25 : 1})`,
              }}
            >
              <div className="relative group/play animate-play-pulse">
                {/* Backdrop Glow Halo */}
                <div className="absolute -inset-2 bg-black/15 rounded-3xl blur-md opacity-80" />

                {/* Rounded Black Squircle Play Button */}
                <div className="w-16 h-16 rounded-[22px] bg-black text-white flex items-center justify-center shadow-xl border border-neutral-800 transition-transform hover:scale-105 active:scale-95">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-7 h-7 fill-white text-white ml-1 filter drop-shadow-sm"
                  >
                    <path d="M6 4L18 12L6 20V4Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Floating Mini Badge on Lower-Left (Z +40px) */}
            <div
              className="self-start transition-transform animate-badge-3d"
              style={{
                transformStyle: 'preserve-3d',
                transform: 'translateZ(40px)',
              }}
            >
              <div className="px-2.5 py-1.5 rounded-xl bg-white border border-neutral-300 shadow-md flex items-center gap-1.5 hover:scale-105 transition-transform">
                <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
                <span className="text-[10px] font-extrabold text-black tracking-tight">10s ⟳</span>
              </div>
            </div>
          </div>

          {/* Bottom Dark Chin Bar (Video Player Scrubber & Controls) */}
          <div
            className="w-full h-11 bg-neutral-950 px-4 flex items-center justify-between text-white border-t border-neutral-800"
            style={{
              transformStyle: 'preserve-3d',
              transform: 'translateZ(20px)',
            }}
          >
            {/* Play/Pause Mini Icon */}
            <div className="flex items-center gap-3 w-full">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white flex-shrink-0">
                <path d="M6 4L18 12L6 20V4Z" />
              </svg>

              {/* Progress Scrubber Bar */}
              <div className="flex-1 relative flex items-center">
                <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                  <div className="w-[45%] h-full bg-white rounded-full" />
                </div>
                {/* Glowing Scrubber Handle Dot */}
                <div className="absolute left-[45%] -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_6px_#ffffff]" />
              </div>

              {/* Volume / Fullscreen Mini Glyphs */}
              <div className="flex items-center gap-2 opacity-60">
                <div className="w-2 h-2 rounded-xs border border-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
