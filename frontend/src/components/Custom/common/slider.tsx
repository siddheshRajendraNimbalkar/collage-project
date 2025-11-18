'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectFade, Autoplay } from 'swiper/modules';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type SwiperType from 'swiper';
import 'swiper/css';
import 'swiper/css/effect-fade';
import 'swiper/css/navigation';

interface SlideData {
  name: string;
  type: string;
  category: string;
  description: string;
  price: string;
  image: string;
}

interface SwiperSliderProps {
  slides: SlideData[];
}

const SwiperSlider = ({ slides }: SwiperSliderProps) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const handleSwiper = (swiper: SwiperType) => {
    swiperRef.current = swiper;
    swiper.on('autoplayTimeLeft', (_, timeLeft, percentage) => {
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${percentage * 100}%`;
      }
    });
    swiper.on('slideChange', () => {
      setCurrentSlide(swiper.realIndex + 1);
    });
  };

  return (
    <div
      className="relative bg-black overflow-hidden group rounded-xl m-9 transition-all duration-300 
      ease-in-out hover:shadow-[8px_8px_20px_rgba(255,255,255,0.25)]"
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/10 z-10">
        <div
          ref={progressBarRef}
          className="h-full bg-emerald-400 transition-all duration-100 ease-linear"
          style={{ width: '100%' }}
        />
      </div>

      <Swiper
        modules={[Navigation, EffectFade, Autoplay]}
        effect={'fade'}
        speed={800}
        loop={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        navigation={{
          nextEl: '.slide-next',
          prevEl: '.slide-prev',
        }}
        onSwiper={handleSwiper}
        className="h-full"
      >
        {/* Navigation Buttons & Counter */}
        <div className="absolute top-5 right-5 z-10 flex items-center gap-4">
          <button className="slide-prev p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-white text-sm font-mono">
            <span className="current-slide">{currentSlide}</span> / {slides.length}
          </div>
          <button className="slide-next p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </div>

        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            <div className="relative grid grid-cols-1 lg:grid-cols-2 h-full gap-6 p-6">
              {/* Image Container */}
              <div className="relative h-96 w-full rounded-2xl overflow-hidden">
                <Image
                  src={slide.image}
                  alt={slide.name}
                  fill
                  className="object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                {/* Details on Image for Mobile View */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white lg:hidden">
                  <h1 className="text-lg font-bold">{slide.name}</h1>
                  <span className="text-xs font-semibold text-emerald-400">{slide.category}</span>
                  <p className="text-sm text-gray-300 mt-2">{slide.description}</p>
                  <div className="text-xl font-bold text-amber-400 mt-2">{slide.price}</div>
                </div>
              </div>

              {/* Product Info - Desktop View */}
              <div className="hidden lg:flex flex-col justify-center bg-black text-white space-y-4 lg:pr-12">
                <div className="space-y-3">
                  <h1 className="text-3xl font-bold tracking-tight">{slide.name}</h1>
                  <span className="text-xs font-semibold text-emerald-400">{slide.category}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-400">{slide.type}</span>
                    <span className="w-1 h-1 bg-gray-400 rounded-full" />
                    <span className="text-sm text-gray-400">{slide.category}</span>
                  </div>
                </div>
                <p className="text-base text-gray-300 leading-relaxed max-w-xl">{slide.description}</p>
                <div className="text-3xl font-bold text-amber-400">{slide.price}</div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default SwiperSlider;