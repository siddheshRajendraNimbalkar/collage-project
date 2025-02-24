'use client';

import React from "react";
import clsx from "clsx";

interface DarkGridBackgroundProps {
  children: React.ReactNode;
  className?: string;
}

const DarkGridBackground: React.FC<DarkGridBackgroundProps> = ({ children, className }) => {
  return (
    <div className={clsx("relative  min-h-[50vh]", className)}>
      {/* Grid Background */}
      <div
        className="absolute inset-0  h-full bg-black pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "20px 20px",
          zIndex: -1,
        }}
      />

      {/* Main Content */}
      <div className="relative  h-full">{children}</div>
    </div>
  );
};

export default DarkGridBackground;
