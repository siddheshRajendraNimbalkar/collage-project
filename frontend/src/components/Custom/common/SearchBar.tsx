'use client'
import { useState, useEffect, useRef } from "react";
import { FiSearch, FiClock, FiTrendingUp } from "react-icons/fi";
import { useRouter } from "next/navigation";
import OnlyBtn from "./OnlyButton";
import OnlyAvatar from "./Avater";
import AnimatedButton from "./AnimatedButton";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (query.length >= 1) {
      const fetchSuggestions = async () => {
        setLoading(true);
        try {
          // Use new Redis autocomplete endpoint
          const res = await fetch(`/api/autocomplete?prefix=${encodeURIComponent(query)}&limit=8`);
          console.log('Response status:', res.status);
          if (!res.ok) {
            console.error('Search failed:', res.status, res.statusText);
            const errorText = await res.text();
            console.error('Error response:', errorText);
            return;
          }
          const data = await res.json();
          console.log('Autocomplete data:', data);
          console.log('Items found:', data.items?.length || 0);
          const items = data.items || [];
          setSuggestions(items.map((item: any) => ({
            id: item.id,
            name: item.title,
            image: item.image || '/placeholder.jpg',
            category: item.category,
            type: item.type
          })));
          setShowSuggestions(true);
          setSelectedIndex(-1);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      };

      const debounce = setTimeout(fetchSuggestions, 150);
      return () => clearTimeout(debounce);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSelect = (value: any) => {
    setQuery(value.name);
    setShowSuggestions(false);
    router.push(`/product/search/${value.id}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="px-10 w-full relative">
      <form onSubmit={handleSubmit} className="relative">
        <FiSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-600" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search Products"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="w-full py-2 px-3 pl-12 text-white bg-black
                   focus:outline-none focus:ring-2 focus:ring-[#FF90E8]
                   transition-all duration-300 border-2 border-black
                   placeholder-gray-500 text-xl hover:border-[#FF90E8]
                   focus:border-transparent rounded"
        />
      </form>

      {/* Advanced Search Suggestions */}
      {showSuggestions && (query.length > 0) && (
        <div className="absolute w-[93vw] bg-black/95 backdrop-blur-sm text-white rounded-xl mt-2 border border-gray-700 shadow-2xl max-h-80 overflow-hidden z-50">
          {loading ? (
            <div className="px-4 py-6 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#FF90E8] mx-auto mb-2"></div>
              <span className="text-gray-400">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul ref={suggestionsRef} className="overflow-y-auto max-h-80">
              {suggestions.map((item: any, index: number) => (
                <li
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-4 border-b border-gray-800 last:border-b-0 ${
                    index === selectedIndex 
                      ? 'bg-[#FF90E8]/20 border-[#FF90E8]/50' 
                      : 'hover:bg-gray-800/50'
                  }`}
                >
                  <div className="relative">
                    <img 
                      src={item.image || '/placeholder.jpg'} 
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-black"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {item.name.replace('*', '')}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2">
                      <FiTrendingUp className="w-3 h-3" />
                      <span>{item.name.includes('*') ? 'Complete match' : 'Suggestion'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    <FiClock className="w-3 h-3" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-6 text-center text-gray-400">
              <FiSearch className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <div>No results found for "{query}"</div>
              <div className="text-xs mt-1">Try different keywords</div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-4">
        <OnlyBtn onClick={() => router.push('/')} className="bg-white text-black">
          All
        </OnlyBtn>

        <AnimatedButton
          buttonText="Art"
          menuItems={[
            { label: 'Photograph', href: '/Art/photograph' },
            { label: 'Pattern', href: '/Art/pattern' },
            { label: '3D', href: '/Art/3d' },
            { label: 'Picture', href: '/Art/picture' }
          ]}
          menuBgColor="#FFFF00"
        />

        <AnimatedButton
          buttonText="Poster"
          menuItems={[
            { label: 'Cars', href: '/Poster/cars' },
            { label: 'Nature', href: '/Poster/nature' },
            { label: 'Wildlife', href: '/Poster/wildlife' },
            { label: 'Other', href: '/Poster/other' }
          ]}
          menuBgColor="#7B68EE"
        />

        <AnimatedButton
          buttonText="Design"
          menuItems={[
            { label: 'Logo', href: '/Design/logo' },
            { label: 'UI/UX', href: '/Design/uiux' },
            { label: 'Illustration', href: '/Design/illustration' },
            { label: 'Branding', href: '/Design/branding' },
            { label: 'Motion', href: '/Design/motion' }
          ]}
          menuBgColor="#FF4500"
        />

        <AnimatedButton
          buttonText="Tech"
          menuItems={[
            { label: 'AI', href: '/Tech/ai' },
            { label: 'Blockchain', href: '/Tech/blockchain' },
            { label: 'Cybersecurity', href: '/Tech/cybersecurity' },
            { label: 'Cloud Computing', href: '/Tech/cloud' },
            { label: 'IoT', href: '/Tech/iot' }
          ]}
          menuBgColor="#4169E1"
        />

        <AnimatedButton
          buttonText="Photography"
          menuItems={[
            { label: 'Nature', href: '/Photography/nature' },
            { label: 'Portrait', href: '/Photography/portrait' },
            { label: 'Street', href: '/Photography/street' },
            { label: 'Travel', href: '/Photography/travel' },
            { label: 'Wildlife', href: '/Photography/wildlife' }
          ]}
          menuBgColor="#C71585"
        />

        <AnimatedButton
          buttonText="Fashion"
          menuItems={[
            { label: 'Babys', href: '/Fashion/babys' },
            { label: 'Women', href: '/Fashion/women' },
            { label: 'Men', href: '/Fashion/men' },
            { label: 'Kids', href: '/Fashion/kids' },
            { label: 'Animals', href: '/Fashion/animals' }
          ]}
          menuBgColor="#8B008B"
        />


        <AnimatedButton
          buttonText="Electronics"
          menuItems={[
            { label: 'Mobile', href: '/Electronics/mobile' },
            { label: 'Laptop', href: '/Electronics/laptop' },
            { label: 'Skin', href: '/Electronics/skin' },
            { label: 'TV', href: '/Electronics/tv' }
          ]}
          menuBgColor="#4B0082"
        />

        <AnimatedButton
          buttonText="Books"
          menuItems={[
            { label: 'Story', href: '/Books/story' },
            { label: 'Knowledge', href: '/Books/knowledge' },
            { label: 'Manga', href: '/Books/manga' },
            { label: 'Fiction', href: '/Books/fiction' },
            { label: 'Business', href: '/Books/business' }
          ]}
          menuBgColor="#008000"
        />

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