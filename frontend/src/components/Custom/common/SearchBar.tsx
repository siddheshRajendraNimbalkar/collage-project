'use client'
import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";
import OnlyBtn from "./OnlyButton";
import OnlyAvatar from "./Avater";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (query.length > 1) {
      const fetchSuggestions = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/search?q=${query}`);
          const data = await res.json();
          console.log("Suggestions:", data.results);
          setSuggestions(data.results || []);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setLoading(false);
        }
      };

      const debounce = setTimeout(fetchSuggestions, 300); 
      return () => clearTimeout(debounce);
    } else {
      setSuggestions([]);
    }
  }, [query]);

  const handleSelect = (value: string) => {
    setQuery(value);
    setSuggestions([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      console.log("Search:", query);
    }
  };

  return (
    <div className="px-10 w-full relative">
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

      {/* Search Suggestions */}
      {suggestions.length > 0 && (
        <ul className="absolute w-full bg-black text-white rounded-xl mt-2 border border-gray-700 shadow-lg max-h-60 overflow-y-auto">
          {loading ? (
            <li className="px-4 py-2 text-gray-400">Loading...</li>
          ) : (
            suggestions.map((item, index) => (
              <li
                key={index}
                onClick={() => handleSelect(item)}
                className="px-4 py-2 cursor-pointer hover:bg-gray-800 transition-all"
              >
                {item}
              </li>
            ))
          )}
        </ul>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <OnlyBtn onClick={() => router.push('/')} className="bg-white text-black">
          All
        </OnlyBtn>
        <OnlyAvatar
          src="https://imgs.search.brave.com/sLqQS8mv9Yeh-OrDvoWYExWU7QoHekyYWBehzPHCdBE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by9t/ZWRpdW0tc2hvdC1h/bmltZS1zdHlsZS1t/YW4tcG9ydHJhaXRf/MjMtMjE1MTA2NzQ1/MS5qcGc_c2VtdD1h/aXNfaHlicmlk"
          alt="avatar"
          onClick={() => router.push('/users')}
        />
      </div>
    </div>
  );
};

export default SearchBar;
