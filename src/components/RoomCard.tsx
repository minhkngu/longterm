import React, { useState, useEffect } from 'react';
import { Waves, ChevronRight, Maximize2 } from 'lucide-react';
import { RoomType } from '../types';
import { useCloudinaryImages } from '../hooks/useCloudinaryImages';
import { AmenityList } from './AmenityList';

const priceFormatter = new Intl.NumberFormat('vi-VN');

const formatPrice = (price: number | null | undefined) => {
  if (!price || price === 0) return 'N/A';
  return `${priceFormatter.format(price)} VND`;
};

interface RoomCardProps {
  room: RoomType;
  t: any;
  branchTag?: string;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, t, branchTag }) => {
  const cloudinaryTag = branchTag && room.tag ? `${branchTag}_${room.tag}` : undefined;
  const { images, loading } = useCloudinaryImages(cloudinaryTag);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (currentImageIndex >= images.length) {
      setCurrentImageIndex(0);
    }
  }, [images.length, currentImageIndex]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full hover:shadow-xl transition-all duration-300">
      {/* Image Section */}
      <div className="w-full aspect-[4/3] relative group bg-slate-100 shrink-0 overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-7 h-7 border-2 border-slate-200 border-t-brand-primary rounded-full animate-spin" />
          </div>
        ) : images.length > 0 ? (
          <img
            key={images[currentImageIndex]}
            src={images[currentImageIndex]}
            alt={room.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <Waves size={36} strokeWidth={1} />
          </div>
        )}

        {/* Floating Top Left Overlay Badge (Image index indicator) */}
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-black/40 backdrop-blur-md rounded-full text-white text-[10px] font-semibold tracking-wider">
          {images.length > 0 ? `${currentImageIndex + 1}/${images.length}` : '1/1'}
        </div>

        {/* Floating Top Right Area Badge (Square meters) */}
        {room.sqm && room.sqm > 0 && (
          <div className="absolute top-2.5 right-2.5 px-2.5 py-0.5 bg-[#4F46E5] text-white backdrop-blur-md rounded-full flex items-center gap-1 text-[10px] font-bold shadow-md">
            <Maximize2 size={11} strokeWidth={2.5} />
            <span>{room.sqm} {t.sqm}</span>
          </div>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <div className="absolute inset-0 flex items-center justify-between px-2 opacity-90 group-hover:opacity-100 transition-opacity pointer-events-none">
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
                className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all active:scale-95 shadow-md pointer-events-auto"
              >
                <ChevronRight size={14} className="rotate-180" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
                className="w-7 h-7 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/50 transition-all active:scale-95 shadow-md pointer-events-auto"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Bottom Dots Indicator */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 px-2 py-0.5 bg-black/30 backdrop-blur-md rounded-full">
              {images.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${idx === currentImageIndex ? 'bg-white w-3.5' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Main Details Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        {/* Title */}
        <div>
          <h4 className="text-base font-bold text-slate-900 tracking-tight leading-snug">
            {room.name}
          </h4>
        </div>

        {/* Amenities as Pills */}
        <div className="flex-1">
          <AmenityList
            included={room.amenities}
            excluded={room.excludedAmenities}
            variant="pill"
          />
        </div>
      </div>

      {/* Structured Pricing Footer */}
      <div className="border-t border-slate-100 bg-slate-50/40 p-3.5 space-y-2">
        <div className="grid grid-cols-2 gap-2.5 items-start">
          {/* Column 1: Short Term / Base Rate */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block">
              {t.monthlyPriceShort} {room.pricing.minContractMonths} {t.months}
            </span>
            <span className="text-xs font-extrabold text-[#4F46E5] block">
              {formatPrice(room.pricing.monthly_under)}
            </span>
          </div>

          {/* Column 2: Long Term / Standard Rate & Fees */}
          <div className="space-y-0.5">
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tight block">
              {t.monthlyPrice} {room.pricing.minContractMonths} {t.months} + PHÍ
            </span>
            <span className="text-xs font-extrabold text-[#4F46E5] block">
              {formatPrice(room.pricing.monthly)}
            </span>

            {/* Sub-fees placed directly under column 2 */}
            {room.pricing.fees && (
              <div className="pt-1.5 text-[8.5px] text-slate-500 leading-tight whitespace-pre-line border-t border-slate-200/50 mt-1">
                {room.pricing.fees}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};