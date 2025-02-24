'use client'

import React from 'react'
import Navbar from '@/components/Custom/common/Navebar'
import Footer from '@/components/Custom/common/Footer'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative min-h-screen flex flex-col">
      
      <div className="fixed top-0 left-0 w-full z-50"><Navbar  /></div>
      <div className="flex-1 mt-[4rem] z-10"> 
        {children}
      </div>

      <div className="relative z-50"><Footer  /></div>
      
    </div>
  )
}

export default Layout
