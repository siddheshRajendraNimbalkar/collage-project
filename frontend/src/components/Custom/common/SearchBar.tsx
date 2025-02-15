import { useState } from "react";
import { FiSearch } from "react-icons/fi";

const SearchBar = () => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle search logic
    console.log("Search:", query);
  };

  return (
    <div className="px-10 w-full">
      <form onSubmit={handleSubmit} className="relative">
        <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-600" />
        <input
          type="text"
          placeholder="Search Products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full py-2 px-3 pl-12 text-white bg-black
                   focus:outline-none focus:ring-2 focus:ring-[#FF90E8]
                   transition-all duration-300 border-2 border-black
                   placeholder-gray-500 text-xl hover:border-[#FF90E8]
                   focus:border-transparent rounded-xl"
        />
      </form>
    </div>
  );
};

export default SearchBar;