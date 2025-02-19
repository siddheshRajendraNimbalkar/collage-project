"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MenuItem {
  label: string;
  href: string;
}

interface AnimatedButtonProps {
  buttonText: string;
  menuItems: MenuItem[];
  menuBgColor?: string; 
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  buttonText,
  menuItems,
  menuBgColor = "white",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const route = useRouter();

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        className={`
          px-6 py-3 
          bg-black text-white 
          border-[1.5px] border-white rounded-full
          transition-all duration-300 ease-out
          hover:-translate-y-1
          hover:shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]
          ${isOpen ? "-translate-y-1 shadow-[6px_6px_0px_0px_rgba(255,255,255,1)]" : ""}
        `}
        onClick={() => {
          route.push(`/${buttonText}`);
        }}
      >
        {buttonText}
      </button>

      {isOpen && (
        <div
          className="absolute left-0 top-full w-48 py-2 
                     border-[1px] border-black rounded-xl 
                     shadow-[10px_10px_0px_0px_rgba(255,255,255,1)]
                     animate-in fade-in slide-in-from-top-1 duration-200"
          style={{ backgroundColor: menuBgColor }} 
        >
          <div className="flex flex-col">
            {menuItems.map((item) => (
              <div
                key={item.label}
                className="px-4 py-2 text-left rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => {
                  route.push(`${item.href}`);
                }}
              >
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedButton;
