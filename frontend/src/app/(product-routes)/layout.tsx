'use client'

import Navebar from "@/components/Custom/common/Navebar";
import Footer from "@/components/Custom/common/Footer"
import SearchBar from "@/components/Custom/common/SearchBar"

const layout = ({children}:{children:React.ReactNode}) => {
  return (
    <>
    <div className="relative z-50">
        <Navebar />
      </div>

      {/* Search Bar */}
      <div className="min-h-[25vh] pt-6">
        <SearchBar />
      </div>
      

      {/* Footer */}
      <Footer />
    </>
  )
}

export default layout