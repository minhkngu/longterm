import React, { useState, useEffect, lazy, Suspense } from 'react';
import { MapPin, ChevronRight } from 'lucide-react';
import { Property, Policy } from './types';
import { fetchProperties } from './services/dataService';
import { translations } from './translations';
import { SurchargeBanner } from './components/SurchargeBanner';
import { DateAdjustment } from './types';
import { AmenityList } from './components/AmenityList';

const GeneralPolicies = lazy(() => import('./components/GeneralPolicies').then(m => ({ default: m.GeneralPolicies })));
const RoomCard = lazy(() => import('./components/RoomCard').then(m => ({ default: m.RoomCard })));

export default function App() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [generalPolicies, setGeneralPolicies] = useState<Policy[]>([]);
  const [dateAdjustments, setDateAdjustments] = useState<DateAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activePropertyId, setActivePropertyId] = useState<string>('');

  const t = translations.vi;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { properties, generalPolicies, dateAdjustments } = await fetchProperties();
        const activeProps = properties.filter(p => !p.isHidden);
        setProperties(activeProps);
        setGeneralPolicies(generalPolicies);
        setDateAdjustments(dateAdjustments);
        if (activeProps.length > 0) {
          setActivePropertyId(activeProps[0].id);
        }
      } catch (error) {
        console.error('Failed to load properties:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const activeProperty = properties.find(p => p.id === activePropertyId) || properties[0];
  const visibleRooms = activeProperty ? activeProperty.rooms.filter(r => !r.isHidden) : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <SurchargeBanner adjustments={dateAdjustments} t={t} />

      {/* Top Header Navigation Tabs matching screenshot */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center space-x-2 sm:space-x-4 pt-3 overflow-x-auto scrollbar-hide">
            {properties.map(property => {
              const isActive = property.id === activePropertyId;
              return (
                <button
                  key={property.id}
                  onClick={() => setActivePropertyId(property.id)}
                  className={`pb-3 px-4 sm:px-6 text-sm sm:text-base font-bold transition-all relative whitespace-nowrap ${isActive ? 'text-[#4F46E5]' : 'text-slate-500 hover:text-slate-800'
                    }`}
                >
                  {property.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#4F46E5] rounded-t-md" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-primary rounded-full animate-spin mb-4" />
            <p className="text-slate-500 font-medium">{t.loading}</p>
          </div>
        ) : loadError ? (
          <p className="text-center py-24 text-slate-600">Không thể tải dữ liệu phòng. Vui lòng thử lại sau.</p>
        ) : activeProperty ? (
          <div className="space-y-8 sm:space-y-10">
            {/* General Policies Section at the top */}
            <Suspense fallback={<div className="h-20 animate-pulse bg-slate-200 rounded-2xl" />}>
              {generalPolicies.length > 0 && <GeneralPolicies policies={generalPolicies} t={t} />}
            </Suspense>

            {/* Title Section matching screenshot */}
            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Không gian sống <span className="text-[#4F46E5] underline decoration-[#4F46E5]/30 underline-offset-4">hiện đại</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-500 font-medium">
                Ở đây có một không gian xinh xắn, chờ bạn đến viết nên câu chuyện riêng
              </p>
            </div>

            {/* Property Overview Card matching screenshot */}
            <div className="bg-[#EEF2FF]/60 rounded-3xl p-6 sm:p-8 border border-[#E0E7FF] space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
                {/* Left Side: Property Info & Amenities */}
                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#4F46E5] font-bold text-lg mb-1">
                      <MapPin size={20} strokeWidth={2.5} />
                      <span>{activeProperty.name}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#4F46E5]/80 font-medium">
                      {activeProperty.address}
                    </p>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                      TIỆN ÍCH CƠ SỞ
                    </h4>
                    <AmenityList
                      included={activeProperty.amenities}
                      excluded={activeProperty.excludedAmenities}
                      variant="pill"
                    />
                  </div>
                </div>

                {/* Right Side: Rental Policies */}
                <div className="lg:col-span-7">
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    CHÍNH SÁCH THUÊ
                  </h4>
                  <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-100 shadow-sm space-y-3">
                    {activeProperty.policies.map((policy, idx) => (
                      <div key={idx} className={idx !== 0 ? 'pt-3 border-t border-slate-100' : ''}>
                        {policy.title && (
                          <h5 className="text-xs font-bold text-slate-900 mb-1">{policy.title}</h5>
                        )}
                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                          {policy.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Room List Section */}
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {t.roomTypeList}
                </h3>
              </div>

              <Suspense fallback={<div className="h-64 animate-pulse bg-slate-200 rounded-3xl" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {visibleRooms.length > 0 ? (
                    visibleRooms.map(room => (
                      <div key={room.id} className="h-full">
                        <RoomCard room={room} t={t} branchTag={activeProperty.tag} />
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full bg-white p-12 rounded-3xl border border-dashed border-slate-200 text-center">
                      <p className="text-slate-500 text-sm">{t.noPropertiesSub}</p>
                    </div>
                  )}
                </div>
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin size={32} className="text-slate-300" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{t.noProperties}</h2>
            <p className="text-slate-500 max-w-xs mx-auto text-sm">{t.noPropertiesSub}</p>
          </div>
        )}
      </main>
    </div>
  );
}
