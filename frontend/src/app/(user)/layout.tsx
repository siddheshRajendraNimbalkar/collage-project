'use client';

import React, { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import axios from 'axios';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingBag, ShoppingCart, MessageSquare, Target, Menu, X } from 'lucide-react';
import { CgProfile } from "react-icons/cg";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  organization_name: string;
  user_image: string;
}

export default function ArtistLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        router.push('/');
        return;
      }
      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/v1/api/userId`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );
        if (response.data.message) {
          setError(response.data.message);
          router.push('/');
        } else {
          setUserData(response.data.user);
        }
      } catch (err) {
        setError('Failed to fetch user data');
        router.push('/');
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [router, pathname]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const menuItems = [
    { name: 'Home', icon: <Home size={22} />, path: '/users' },
    { name: 'Profile', icon: <CgProfile size={22} />, path: '/user-profile' },
    { name: 'Cart', icon: <ShoppingCart size={22} />, path: '/users/cart' },
    { name: 'Orders', icon: <ShoppingBag size={22} />, path: '/users/orders' },
    { name: 'Products', icon: <Target size={22} />, path: '/selling/create' },
    { name: 'Messages', icon: <MessageSquare size={22} />, path: '/users/messages' },
  ];

  const activeItem = menuItems.find(item => item.path === pathname)?.name || 'Home';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="relative w-20 h-20">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-2 left-2 w-16 h-16 border-4 border-gray-600 border-t-transparent border-r-transparent rounded-full animate-spin animation-delay-300"></div>
          <div className="absolute top-4 left-4 w-12 h-12 border-4 border-gray-300 border-t-transparent border-r-transparent border-b-transparent rounded-full animate-spin animation-delay-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <motion.div 
        className="bg-black fixed h-full z-10 overflow-hidden"
        animate={{ width: isOpen ? 280 : 80 }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
        <div className="flex justify-end p-4">
          <motion.button 
            onClick={toggleSidebar} 
            className="text-white hover:text-gray-300"
            whileHover={{ scale: 1.1 }}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </motion.button>
        </div>
        <motion.div className="flex flex-col items-center p-4 mb-8">
          <div className={`relative ${
            isOpen ? 'w-20 h-20 mb-3 ring-2' : 'w-12 h-12 mb-1 ring-1'
            } rounded-full overflow-hidden ring-white transition-all`}>
            <motion.img 
              src={userData?.user_image || '/default-artist-avatar.png'} 
              alt="Artist" 
              className="w-full h-full object-cover"
              layout="position"
            />
          </div>
          <AnimatePresence>
            {isOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <h3 className="font-medium text-xl text-white mb-1 truncate max-w-[200px]">
                  {userData?.name || 'Artist'}
                </h3>
                <p className="text-sm text-gray-400 truncate max-w-[200px]">
                  {userData?.email || 'artist@example.com'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <nav className="px-4">
          <ul className="space-y-3">
            {menuItems.map((item, index) => (
              <motion.li key={index} whileHover={{ scale: 1.02 }}>
                <Link href={item.path}>
                  <motion.div className={`flex items-center p-3 rounded-full transition-all ${
                    activeItem === item.name ? 'bg-white text-black' : 'text-white hover:bg-gray-800'
                    }`}>
                    {item.icon}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="ml-3 font-medium truncate"
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              </motion.li>
            ))}
          </ul>
        </nav>
      </motion.div>

      {/* Main content */}
      <motion.main
        className="flex-1 p-8 overflow-hidden bg-stone-50"
        animate={{
          marginLeft: isOpen ? 280 : 80,
        }}
        transition={{ type: 'tween', duration: 0.3 }}
      >
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
      </motion.main>
    </div>
  );
}