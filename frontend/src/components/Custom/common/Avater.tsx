'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import gsap from 'gsap';
import React from 'react';
import clsx from 'clsx';

interface OnlyAvatarProps extends HTMLMotionProps<'div'> {
  src: string;
  alt: string;
  size?: number | string;
  className?: string;
  onClick?: () => void;
}

export default function OnlyAvatar({ 
  src, 
  alt, 
  size = 48, 
  className = '', 
  onClick,
  ...divProps 
}: OnlyAvatarProps) {
  const handleHover = (event: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, {
      y: -8, // Move up slightly more
      boxShadow: '10px 10px 0px 2px rgba(0, 0, 0, 1)', // Bigger shadow
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, {
      y: 0,
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  // Convert size to string with px if it's a number
  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        className={clsx(
          'relative border-2 border-black rounded-full overflow-hidden transition-all cursor-pointer',
          className
        )}
        style={{ 
          width: sizeStyle, 
          height: sizeStyle 
        }}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        onClick={onClick}
        {...divProps}
      >
        <img 
          src={src} 
          alt={alt} 
          className="w-full h-full object-cover"
        />
      </motion.div>
    </div>
  );
}