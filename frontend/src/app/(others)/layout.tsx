'use client';

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

  const handleNavigation = (path: string) => {
    window.location.href = path;
  };

  const navItems = [
    { text: 'Home', icon: '🏠', path: '/' },
    { text: 'Create Product', icon: '🎨', path: '/Selling/create' },
    { text: 'Collections', icon: '📦', path: '/Selling/product' },
    { text: 'Discover', icon: '🔍', path: '/discover' }
  ];

  const router = useRouter();

  useEffect(() => {
    const checkToken = async () => {
      const result = await TokenChecker();
      if (!result.success) {
        router.push('/login');
      }
      setLoading(false);
    };
    checkToken();
  }, []);

  const FlowerDecoration = () => {
    const petalColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9999'];

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
      <div className="flex justify-center items-center h-screen w-full bg-stone-50">
        <motion.div
          className="w-12 h-12 border-4 border-t-stone-800 border-stone-200 rounded-full animate-spin"
        />
      </div>
    );
  }else{
    
  return (
    <div className="flex h-[100vh] w-full bg-stone-50 overflow-hidden">
      {/* Sidebar */}
      <motion.nav
        className="relative bg-white shadow-lg flex flex-col border-r border-stone-200"
        animate={{ width: isExpanded ? '280px' : '80px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {/* Toggle Button */}
        <motion.button
          className="absolute -right-3 top-6 w-6 h-6 bg-stone-800 rounded-full flex items-center justify-center text-stone-100 shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <X size={14} /> : <Menu size={14} />}
        </motion.button>

        {/* Logo */}
        <motion.div className="h-32 flex items-center justify-center border-b border-stone-200" whileHover={{ scale: 1.02 }}>
          <motion.div className="text-2xl font-serif bg-clip-text text-stone-800" onClick={() => handleNavigation('/')}>
            {isExpanded ? 'IDEAL SPACE' : 'IS'}
          </motion.div>
        </motion.div>

        {/* Navigation */}
        <div className="flex-1 px-3 py-8 space-y-4">
          {navItems.map((item) => (
            <motion.div
              key={item.text}
              className="relative"
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                className="w-full bg-transparent hover:bg-stone-100 text-stone-700 border-none flex items-center gap-4 p-4 rounded-xl transition-all duration-300 shadow-lg"
                onClick={() => handleNavigation(item.path)}
              >
                <motion.span className="text-xl">{item.icon}</motion.span>
                {isExpanded && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex-1 text-left font-light tracking-wide">
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
      </motion.nav>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-hidden bg-stone-50">
        <div className="bg-white rounded-xl shadow-sm p-8 max-h-[calc(100vh-64px)] overflow-auto no-scrollbar">
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {children}
          </motion.div>
        </div>
      </main>

    </div>
  );
};


}
export default Layout;
