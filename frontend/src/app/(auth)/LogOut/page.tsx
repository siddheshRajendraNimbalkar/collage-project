'use client'
import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const Page = () => {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("expireToken");
    localStorage.removeItem("expireRefreshToken");

    router.push("/login"); 
  };

  // Crazy animation variants
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.5,
      rotate: -180
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      rotate: 0,
      transition: { 
        type: "spring",
        stiffness: 100,
        damping: 10,
        when: "beforeChildren"
      }
    },
    exit: {
      opacity: 0,
      scale: 1.5,
      rotate: 360,
      transition: { duration: 0.5 }
    }
  };

  const titleVariants = {
    hidden: { y: -100, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 10
      }
    },
    hover: {
      scale: 1.2,
      rotate: [0, -10, 10, 0],
      color: ["#000", "#ff0000", "#00ff00", "#0000ff"],
      transition: {
        duration: 1,
        repeat: Infinity
      }
    }
  };

  const buttonVariants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.1,
      rotate: [0, -10, 10, 0],
      boxShadow: "0px 0px 20px rgba(255,0,0,0.5)",
      background: ["#ef4444", "#3b82f6", "#10b981", "#ef4444"],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  // Floating emojis data
  const floatingEmojis = ["🔥", "✨", "🎉", "💥", "🚀", "🌈"];
  
  return (
    <div className="min-h-screen flex justify-center items-center overflow-hidden">
      <AnimatePresence>
        <motion.div
          key="main-content"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          className="relative z-10 text-center"
        >
          {/* Crazy floating emojis background */}
          {floatingEmojis.map((emoji, index) => (
            <motion.span
              key={index}
              className="absolute text-4xl pointer-events-none"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
              animate={{
                y: [0, -100, 0],
                rotate: [0, 360],
                scale: [1, 1.5, 1]
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            >
              {emoji}
            </motion.span>
          ))}

          <motion.h2 
            variants={titleVariants}
            whileHover="hover"
            className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 bg-clip-text text-transparent"
          >
            WELCOME TO THE MATRIX
          </motion.h2>

          <motion.button
            onClick={handleLogout}
            variants={buttonVariants}
            initial="rest"
            whileHover="hover"
            className="text-2xl py-4 px-8 rounded-full bg-blue-500 text-white relative overflow-hidden"
          >
            <span className="relative z-10">ESCAPE THE MATRIX</span>
            <motion.div
              className="absolute inset-0 bg-white opacity-0"
              animate={{
                opacity: [0, 0.2, 0],
                x: [-100, 300]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity
              }}
            />
          </motion.button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Page;