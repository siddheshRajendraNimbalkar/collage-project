"use client";
import { useEffect, useState, ReactNode } from 'react';

const AuthBG = ({ children }: { children?: ReactNode }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#D4A5A5'];
  const [boxes, setBoxes] = useState<string[]>([]);

  // Initialize grid with random colors
  useEffect(() => {
    const initialColors = Array(2500).fill(null).map(() => 
      colors[Math.floor(Math.random() * colors.length)]
    );
    setBoxes(initialColors);
  }, []);

  // Animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setBoxes(prev => prev.map(color => 
        Math.random() < 0.1 ? colors[Math.floor(Math.random() * colors.length)] : color
      ));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Background Grid */}
      <div 
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: 'repeat(50, minmax(0, 1fr))',
          gridTemplateRows: 'repeat(50, minmax(0, 1fr))'
        }}
      >
        {boxes.map((color, index) => (
          <div
            key={index}
            className="border border-black/10 transition-colors duration-500 min-h-[1px] min-w-[1px]"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="relative z-10 flex items-center justify-center h-full">
        <div className="">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthBG;