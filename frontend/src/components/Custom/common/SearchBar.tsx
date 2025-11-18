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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const fetchSuggestions = async () => {
      console.log('🔍 Fetching suggestions for:', query);
      setLoading(true);
      setOffset(0);
      try {
        const url = `http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(query)}&limit=20&offset=0`;
        console.log('📡 API URL:', url);
        const response = await fetch(url);
        console.log('📥 Response status:', response.status);
        
        if (!response.ok) {
          console.error('❌ Search failed:', response.status);
          return;
        }
        
        const data = await response.json();
        console.log('📊 Response data:', data);
        const uniqueItems = [];
        const seenNames = new Set();
        for (const item of data.items || []) {
          if (!seenNames.has(item.name) && uniqueItems.length < 5) {
            uniqueItems.push(item);
            seenNames.add(item.name);
          }
        }
        setSuggestions(uniqueItems);
        setHasMore(uniqueItems.length === 5);
        setOffset(5);
        setShowSuggestions(true);
      } catch (error) {
        console.error('⚠️ Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const loadMore = async () => {
    if (!hasMore || loading) return;
    setLoading(true);
    try {
      const url = `http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(query)}&limit=20&offset=${offset}`;
      const response = await fetch(url);
      if (!response.ok) return;
      const data = await response.json();
      const existingNames = new Set(suggestions.map(s => s.name));
      const newItems = [];
      for (const item of data.items || []) {
        if (!existingNames.has(item.name) && newItems.length < 5) {
          newItems.push(item);
          existingNames.add(item.name);
        }
      }
      setSuggestions(prev => [...prev, ...newItems]);
      setHasMore(newItems.length === 5);
      setOffset(prev => prev + 20);
    } catch (error) {
      console.error('Load more error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && hasMore) {
      loadMore();
    }
  };

  const handleSelect = async (value: any) => {
    setQuery(value.name);
    setShowSuggestions(false);
    
    // Check if multiple products exist with same name
    try {
      const response = await fetch(`http://localhost:9090/api/autocomplete?prefix=${encodeURIComponent(value.name)}&limit=50`);
      const data = await response.json();
      const sameNameProducts = (data.items || []).filter(item => item.name.toLowerCase() === value.name.toLowerCase());
      
      if (sameNameProducts.length > 1) {
        router.push(`/products/${encodeURIComponent(value.name)}`);
      } else {
        router.push(`/product/${value.category}/${value.id}`);
      }
    } catch (error) {
      router.push(`/product/${value.id}`);
    }
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
      router.push(`/search?query=${encodeURIComponent(query)}`);
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

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div 
          className="absolute z-50 left-10 right-10 mt-2 bg-black/90 backdrop-blur-sm border border-[#FF90E8] rounded-lg shadow-2xl max-h-80 overflow-auto"
          onScroll={handleScroll}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              onMouseDown={() => handleSelect(suggestion)}
              className={`px-4 py-3 cursor-pointer border-b border-gray-700 last:border-b-0 transition-all duration-200 ${
                index === selectedIndex 
                  ? 'bg-[#FF90E8]/20 text-[#FF90E8]' 
                  : 'hover:bg-white/10 text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <img 
                  src={suggestion.image} 
                  alt={suggestion.name}
                  className="w-12 h-12 object-cover rounded-lg border border-gray-600"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold">{suggestion.name}</span>
                  <span className="text-xs text-gray-400">{suggestion.category} • {suggestion.type}</span>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="px-4 py-3 text-center text-gray-400 text-sm">
              Loading more...
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