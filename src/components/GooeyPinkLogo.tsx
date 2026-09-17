import React from 'react';

interface GooeyPinkLogoProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const GooeyPinkLogo: React.FC<GooeyPinkLogoProps> = ({
  size = 28,
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`transition-transform duration-300 ${animate ? 'hover:scale-110 active:scale-95' : ''}`}
      >
        <defs>
          {/* Gooey filter */}
          <filter id="gooey-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>

          {/* Pink Jelly Gradient */}
          <linearGradient id="pink-blob-grad" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ff70a6" />
            <stop offset="45%" stopColor="#ff2a85" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>

          {/* Glossy liquid highlight */}
          <linearGradient id="liquid-shine" x1="12" y1="8" x2="24" y2="28" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Secondary droplet gradient */}
          <radialGradient id="drop-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ff9ec6" />
            <stop offset="100%" stopColor="#f43f5e" />
          </radialGradient>
        </defs>

        {/* Ambient Gooey Aura */}
        <path
          d="M24 2C24 14.1503 14.1503 24 2 24C14.1503 24 24 33.8497 24 46C24 33.8497 33.8497 24 46 24C33.8497 24 24 14.1503 24 2Z"
          fill="#ff2a85"
          opacity="0.3"
          filter="url(#gooey-glow)"
          transform="scale(1.08) translate(-1.8, -1.8)"
        />

        {/* Main Gooey Star Body (Gemini 4-point star with rounded liquid tips) */}
        <path
          d="M24 4C24 15.0457 15.0457 24 4 24C15.0457 24 24 32.9543 24 44C24 32.9543 32.9543 24 44 24C32.9543 24 24 15.0457 24 4Z"
          fill="url(#pink-blob-grad)"
        />

        {/* Gooey Organic Bubbles / Droplets that give that authentic liquid slime/blob feel */}
        <circle cx="34" cy="14" r="3.2" fill="url(#drop-grad)" opacity="0.9" />
        <circle cx="37" cy="11" r="1.6" fill="#fff" opacity="0.8" />
        <circle cx="14" cy="34" r="2.8" fill="url(#drop-grad)" opacity="0.85" />
        <circle cx="38" cy="27" r="2" fill="url(#drop-grad)" opacity="0.75" />

        {/* Liquid Gel Specular Highlight */}
        <path
          d="M24 8C24 16 18 22 10 23C13 18 18 13 24 8Z"
          fill="url(#liquid-shine)"
        />

        {/* Center Jelly Core Specular Gleam */}
        <circle cx="21" cy="19" r="2.4" fill="#ffffff" opacity="0.7" />
      </svg>
    </div>
  );
};
