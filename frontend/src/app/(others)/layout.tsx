'use client'

import React, { ReactNode, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TokenChecker from '@/tokenchecker';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [loading, setLoading] = useState(true);
  const route = useRouter();

  const handleNavigation = (path: string) => {
    route.push(path);
  };

  const navItems = [
    { text: 'Home', icon: '🏠', path: '/' },
    { text: 'Create Product', icon: '🎨', path: '/selling/create' },
    { text: 'Collections', icon: '📦', path: '/selling/product' },
    { text: 'User', icon: '👥', path: '/users' }
  ];

  useEffect(() => {
    const checkToken = async () => {
      const result = await TokenChecker();
      if (!result.success) {
        route.push('/login');
      }
      setLoading(false);
    };
    checkToken();
  }, [route]);

  const FlowerDecoration = () => {
    const petalColors = ['#1A120B', '#3C2A21', '#3B9797', '#E5E5CB', '#FFEEAD', '#FF9999'];

    return (
      <motion.div
        className="relative flex justify-center items-center w-16 h-16"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
      >
        {petalColors.map((color, index) => (
          <motion.div
            key={index}
            className="absolute w-4 h-8 rounded-full"
            style={{
              backgroundColor: color,
              transform: `rotate(${index * 60}deg) translateY(-20px)`
            }}
          />
        ))}
        <div className="absolute w-4 h-4 bg-yellow-500 rounded-full" />
      </motion.div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full bg-stone-50 overflow-x-hidden">
        <motion.div
          className="w-12 h-12 border-4 border-t-stone-800 border-stone-200 rounded-full animate-spin"
        />
      </div>
    );
  }

  return (
    // root: hide horizontal overflow and use flex layout
    <div className="h-screen w-full  flex bg-[#1A120B] overflow-y-hidden">
      {/* Sidebar */}
      <nav
        // toggle class-based width for stable layout (no animating inline width)
        className={`relative bg-[#D5CEA3] shadow-lg flex flex-col border-r border-[#3C2A21] flex-shrink-0 transition-all duration-300 ease-in-out
          ${isExpanded ? 'w-72' : 'w-20'}`}
      >
        {/* Toggle Button - placed at the right edge of nav but visually overlapping */}
        <button
          aria-label="Toggle sidebar"
          className="absolute right-0 top-5 transform translate-x-1/2 w-7 h-7 bg-[#3C2A21] rounded-full flex items-center justify-center text-stone-100 shadow-lg z-30"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <X size={14} /> : <Menu size={14} />}
        </button>

        {/* Logo */}
        <div className="h-32 flex items-center justify-center border-b border-stone-200 px-3">
          <div
            className="text-2xl font-serif text-stone-800 cursor-pointer select-none"
            onClick={() => handleNavigation('/')}
          >
            {isExpanded ? 'IDEAL SPACE' : 'IS'}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-8 space-y-4">
          {navItems.map((item) => (
            <motion.div
              key={item.text}
              className="relative"
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              onClick={() => handleNavigation(item.path)}
            >
              <Button
                className="w-full bg-transparent hover:bg-[#3C2A21] text-[#1A120B] hover:text-stone-50 border-none flex items-center gap-4 p-4 rounded-xl transition-all duration-300 shadow-sm"
              >
                <span className="text-xl">{item.icon}</span>
                {isExpanded && (
                  <motion.span initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.15 }} className="flex-1 text-left font-light tracking-wide">
                    {item.text}
                  </motion.span>
                )}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Footer with Flower Animation */}
        <div className="p-4 border-t border-stone-200 flex flex-col items-center">
          <motion.div className="text-xs text-stone-500 text-center font-light mb-2" animate={{ opacity: isExpanded ? 1 : 0 }}>
            Curating Excellence
          </motion.div>
          <FlowerDecoration />
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 bg-[#1A120B] min-h-screen overflow-x-hidden">
        <div className="max-w-6xl mx-auto bg-[#3C2A21] rounded-xl shadow-sm p-4 md:p-8">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
