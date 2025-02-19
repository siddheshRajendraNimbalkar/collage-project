'use client';
import { motion, HTMLMotionProps } from 'framer-motion';
import gsap from 'gsap';
import React from 'react';
import clsx from 'clsx';

interface OnlyBtnProps extends HTMLMotionProps<'button'> {
  children: React.ReactNode;
  className?: string;
}

export default function OnlyBtn({ children, className = '', ...buttonProps }: OnlyBtnProps) {
  const handleHover = (event: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(event.currentTarget, {
      y: -8, // Move up slightly more
      boxShadow: '10px 10px 0px 2px rgba(0, 0, 0, 1)', // Bigger shadow
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleLeave = (event: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(event.currentTarget, {
      y: 0,
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        className={clsx(
          'relative px-6 py-3 border-2 border-black rounded-lg transition-all',
          className
        )}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        {...buttonProps}
      >
        {children}
      </motion.button>
    </div>
  );
}
