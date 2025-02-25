'use client';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation, Variants } from 'framer-motion';
import gsap from 'gsap';
import clsx from 'clsx';
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';

interface AvatarProps {
  size?: number | string;
  className?: string;
  onChange?: (imageUrl: string) => void;
}

export default function Avatar({ 
  size = 48, 
  className = '',
  onChange
}: AvatarProps) {
  const defaultImage = "https://wallpaperaccess.com/full/355397.png"
  
  const avatarOptions = [
    defaultImage,
    "https://wallpaperaccess.com/full/10137576.png",
    "https://w0.peakpx.com/wallpaper/181/349/HD-wallpaper-naruto-baryon-mode-naruto-yuki.jpg",
    "https://i.pinimg.com/736x/62/88/60/628860e1044a9460aff19aace5fb56b9.jpg"
  ];

  const [selectedImage, setSelectedImage] = useState(defaultImage);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const avatarControls = useAnimation();
  const settingsControls = useAnimation();

  const sizeStyle = typeof size === 'number' ? `${size}px` : size;

  // GSAP hover animations
  const handleHover = (event: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, {
      y: -8,
      boxShadow: '10px 10px 0px 2px rgba(0, 0, 0, 1)',
      duration: 0.3,
      ease: 'power2.out',
    });
    
    // Animate the settings icon
    settingsControls.start({ 
      rotate: 180,
      scale: 1.2,
      transition: { duration: 0.3 }
    });
  };

  const handleLeave = (event: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(event.currentTarget, {
      y: 0,
      boxShadow: 'none',
      duration: 0.3,
      ease: 'power2.out',
    });
    
    // Reset settings icon
    settingsControls.start({ 
      rotate: 0,
      scale: 1,
      transition: { duration: 0.3 }
    });
  };

  // Image selection with animation
  const handleImageSelect = (imageUrl: string) => {
    if (imageUrl === selectedImage) return;
    
    setIsChanging(true);
    
    // Animate out
    avatarControls.start({
      scale: 0.8,
      opacity: 0,
      rotateY: 90,
      transition: { duration: 0.3 }
    }).then(() => {
      setSelectedImage(imageUrl);
      
      // Animate in
      avatarControls.start({
        scale: 1,
        opacity: 1,
        rotateY: 0,
        transition: { duration: 0.3 }
      }).then(() => {
        setIsChanging(false);
      });
    });
    
    setIsMenuOpen(false);
    
    if (onChange) {
      onChange(imageUrl);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          avatarRef.current && !avatarRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef, avatarRef]);

  // Menu item animation variants
  const itemVariants: Variants = {
    hidden: { opacity: 0, scale: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3,
        type: "spring",
        stiffness: 260,
        damping: 20
      }
    }),
    hover: { 
      scale: 1.15, 
      boxShadow: "0px 5px 10px rgba(0,0,0,0.2)",
      borderColor: "#3b82f6",
      transition: { duration: 0.2 }
    },
    tap: { 
      scale: 0.95, 
      boxShadow: "0px 2px 5px rgba(0,0,0,0.1)",
      transition: { duration: 0.1 }
    },
    selected: {
      scale: 1.15,
      borderColor: "#3b82f6",
      borderWidth: "3px",
      boxShadow: "0px 0px 0px 2px rgba(59,130,246,0.5), 0px 5px 15px rgba(0,0,0,0.2)"
    }
  };

  // Menu animation variants
  const menuVariants: Variants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transformOrigin: "top center" 
    },
    visible: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: { 
        duration: 0.3,
        type: "spring",
        stiffness: 500,
        damping: 25,
        staggerChildren: 0.05,
        delayChildren: 0.1
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      y: -10,
      transition: { 
        duration: 0.2,
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      <motion.div
        ref={avatarRef}
        className={clsx(
          'relative border-2 border-black rounded-full overflow-hidden transition-all',
          className
        )}
        style={{ width: sizeStyle, height: sizeStyle }}
        onMouseEnter={handleHover}
        onMouseLeave={handleLeave}
        animate={avatarControls}
        initial={{ scale: 1, opacity: 1, rotateY: 0 }}
      >
        <motion.img 
          src={selectedImage} 
          alt="User Avatar" 
          className="w-full h-full object-cover"
          initial={{ scale: 1 }}
          animate={{ 
            scale: isChanging ? [1, 1.1, 1] : 1,
            transition: { duration: 0.6, times: [0, 0.5, 1] }
          }}
        />
        
        <Button
          type="button"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="absolute top-0 right-0 z-10 bg-white/70 hover:bg-white/90 rounded-full p-1 shadow-sm border border-gray-200"
          size="icon"
          variant="ghost"
        >
          <motion.div
            animate={settingsControls}
            initial={{ rotate: 0, scale: 1 }}
          >
            <Settings size={16} className="text-gray-700" />
          </motion.div>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            ref={menuRef}
            className="absolute top-full mt-2 p-3 bg-white rounded-lg border-2 border-black shadow-lg z-20"
            style={{ width: 'max-content', minWidth: '240px' }}
            variants={menuVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.h3 
              className="text-sm font-medium mb-2 text-gray-700"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              Choose Avatar
            </motion.h3>
            <div className="grid grid-cols-3 gap-2">
              {avatarOptions.map((url, index) => (
                <motion.div
                  key={index}
                  onClick={() => handleImageSelect(url)}
                  className={clsx(
                    'w-16 h-16 rounded-full overflow-hidden border-2 cursor-pointer',
                    selectedImage === url ? 'border-blue-500' : 'border-gray-200'
                  )}
                  variants={itemVariants}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  whileHover={selectedImage !== url ? "hover" : "selected"}
                  whileTap="tap"
                >
                  <motion.img 
                    src={url} 
                    alt={`Avatar option ${index + 1}`} 
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.15 }}
                    transition={{ duration: 0.2 }}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}