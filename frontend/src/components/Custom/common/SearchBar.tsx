'use client'
import { useState, useEffect } from "react";
import { FiSearch } from "react-icons/fi";
import { useRouter } from "next/navigation";
import OnlyBtn from "./OnlyButton";
import OnlyAvatar from "./Avater";
import AnimatedButton from "./AnimatedButton";

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

  const handleSelect = (value:any) => {
    setQuery(value.name);
    router.push(`/product/search/${value.id}`);
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
      <ul className="absolute w-full bg-black text-white rounded-xl mt-2 border border-gray-700 shadow-lg max-h-60 overflow-y-auto z-50">
        {loading ? (
          <li className="px-4 py-2 text-gray-400">Loading...</li>
        ) : (
          suggestions.map((item: any, index: any) => (
            <li
              key={item.id}
              onClick={() => handleSelect(item)}
              className="px-4 py-2 cursor-pointer hover:bg-gray-800 transition-all"
            >
              {item.name}
            </li>
          ))
        )}
      </ul>



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
