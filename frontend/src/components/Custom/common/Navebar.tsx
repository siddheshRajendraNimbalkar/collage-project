'use client'
import React from 'react'
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const Navebar = () => {
  return (
    <div className="w-full bg-black text-white">
      {/* Navbar */}
      <div className="flex justify-between items-center h-24 bg-black shadow-lg">
        {/* Animated Button */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <motion.button
            className="h-24 px-6 text-xl font-bold rounded-lg text-white"
            animate={{ backgroundColor: ["#6B46C1", "#FF0080", "#FFBF00", "#00D4FF", "#6B46C1"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            BE MY GUEST
          </motion.button>
        </motion.div>

        {/* Navigation Links */}
        <div className="flex space-x-4">
          {["HOME", "About", "Features", "About us"].map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button variant="secondary" className="hover:rounded-2xl hover:bg-white hover:text-black px-6 py-2 text-lg transition-transform">
                {item}
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Auth Buttons */}
        <div className="flex">
          <motion.div whileHover={{ scale: 1.1 }}>
            <Button variant="outline" className="h-24 px-8 text-lg font-semibold">
              LogIn
            </Button>
          </motion.div>

          <motion.div>
            <Button
              variant="destructive"
              className="bg-[#FF90E8] hover:bg-green-600 h-24 px-6 text-lg font-bold"
            >
              Selling Details
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Navebar