'use client'
import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X } from 'lucide-react'; 
import { useRouter } from 'next/navigation';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const route = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkAuth();
    
    // Listen for token changes in localStorage
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const handleAuthAction = () => {
    if (isLoggedIn) {
      localStorage.removeItem('token');
      setIsLoggedIn(false);
    }
    route.push(isLoggedIn ? '/LogOut' : '/login');
  };

  const navItems = [
    { name: "HOME", route: "/" }, 
    { name: "About", route: "/about" },
    { name: "Features", route: "/features" },
    { name: "About Us", route: "/about-us" }
  ];

  return (
    <div className="w-full bg-black text-white">
      {/* Navbar */}
      <div className="flex justify-between items-center h-24 bg-black shadow-lg">
        {/* Animated Logo Button */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => route.push('/')}>
          <motion.button
            className="h-24 px-6 text-xl font-bold rounded-lg text-white"
            animate={{ backgroundColor: ["#6B46C1", "#FF0080", "#FFBF00", "#00D4FF", "#6B46C1"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            
          >
            BE MY GUEST
          </motion.button>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-4">
          {navItems.map((item, index) => (
            <motion.div key={index} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => route.push(item.route)}
            >
              <Button
                variant="secondary"
                className="hover:rounded-2xl hover:bg-white hover:text-black px-6 py-2 text-lg transition-transform"
                
              >
                {item.name}
              </Button>
            </motion.div >
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Button
              variant="outline"
              className="h-24 px-8 text-lg font-semibold"
              onClick={handleAuthAction}
            >
              {isLoggedIn ? 'LogOut' : 'LogIn'}
            </Button>
          </motion.div>

          <motion.div>
            <Button
              variant="destructive"
              className="bg-[#FF90E8] hover:bg-white hover:text-black h-24 px-6 text-lg font-bold"
              onClick={() => route.push('/selling/create')}
            >
              Selling Details
            </Button>
          </motion.div>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-sm absolute top-24 left-0 w-full px-4 py-4 space-y-6">
          {navItems.map((item, index) => (
            <motion.div key={index} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsMenuOpen(false);
              route.push(item.route);
            }}
            >
              <Button
                variant="secondary"
                className="w-full text-lg text-white px-6 py-2 hover:bg-white hover:text-black"
                
              >
                {item.name}
              </Button>
            </motion.div>
          ))}

          {/* Auth Buttons in Mobile Menu */}
          <div className="flex flex-col ">
            <motion.div whileHover={{ scale: 1.1 }}>
              <Button
                variant="outline"
                className="w-full  text-lg font-semibold"
                onClick={() => {
                  setIsMenuOpen(false);
                  handleAuthAction();
                }}
              >
                {isLoggedIn ? 'LogOut' : 'LogIn'}
              </Button>
            </motion.div>

            <motion.div>
              <Button
                variant="destructive"
                className="w-full bg-[#FF90E8] hover:bg-green-600 text-lg font-bold"
                onClick={() => {
                  setIsMenuOpen(false);
                  route.push('/Selling/create');
                }}
              >
                Selling Details
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Navbar;
