'use client'
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import AnimatedButton from "./AnimatedButton";
import OnlyBtn from "./OnlyButton";
import { useRouter } from "next/navigation";
import OnlyAvatar from "./Avater";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const route = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Search:", query);
  };

  return (

    <div className="px-10 w-full ">
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

      <div className="mt-4 flex flex-wrap gap-4">

        <OnlyBtn onClick={() => {
          route.push('/')
        }} className="bg-white text-black">
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

        <OnlyAvatar src="https://imgs.search.brave.com/sLqQS8mv9Yeh-OrDvoWYExWU7QoHekyYWBehzPHCdBE/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by9t/ZWRpdW0tc2hvdC1h/bmltZS1zdHlsZS1t/YW4tcG9ydHJhaXRf/MjMtMjE1MTA2NzQ1/MS5qcGc_c2VtdD1h/aXNfaHlicmlk" alt="avater" 
          onClick={() => {
            route.push('/users')
          }}
        />

      </div>
    </div>
  );
};

export default SearchBar;