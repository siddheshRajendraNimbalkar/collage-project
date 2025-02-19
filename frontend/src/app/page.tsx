'use client'

import Footer from "@/components/Custom/common/Footer";
import Navbar from "@/components/Custom/common/Navebar";
import SearchBar from "@/components/Custom/common/SearchBar";

export default function Home() {
  return (
    <>
      {/* Navbar */}
      <div className="relative z-50">
        <Navbar />
      </div>

      {/* Search Bar */}
      <div className="min-h-[25vh] pt-6">
        <SearchBar />
      </div>
      

      {/* Footer */}
      <Footer />
    </>
  );
}
