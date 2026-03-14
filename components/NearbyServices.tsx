
import React, { useState, useEffect } from 'react';
import { MapPin, Search, Loader2, Navigation, ExternalLink, Globe, Pill, Beaker } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const NearbyServices = () => {
  const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [results, setResults] = useState<string | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setError("Location access denied. Please enable GPS to find nearby services.")
    );
  }, []);

  const searchPlaces = async (type: string) => {
    if (!location) return;
    setIsLoading(true);
    setResults(null);
    setPlaces([]);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find 5 popular and highly rated ${type} near my current location. Provide a brief summary of each.`,
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: { latitude: location.lat, longitude: location.lng }
            }
          }
        }
      });

      setResults(response.text || "No places found.");
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setPlaces(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (err) {
      setError("Maps API encountered an error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl">
           <MapPin size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">Health Service Finder</h1>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Nearby Pharmacies & Diagnostic Infrastructure</p>
      </div>

      <div className="flex items-center justify-center space-x-4">
         <button 
           onClick={() => searchPlaces('Pharmacies')}
           disabled={isLoading || !location}
           className="px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:border-emerald-500 hover:bg-emerald-50 transition-all flex items-center space-x-3 shadow-sm disabled:opacity-50"
         >
           <Pill size={18} className="text-emerald-500" />
           <span>Find Pharmacies</span>
         </button>
         <button 
           onClick={() => searchPlaces('Diagnostic Labs')}
           disabled={isLoading || !location}
           className="px-8 py-4 bg-white border border-slate-200 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center space-x-3 shadow-sm disabled:opacity-50"
         >
           <Beaker size={18} className="text-blue-500" />
           <span>Find Labs</span>
         </button>
      </div>

      {isLoading && (
        <div className="py-20 text-center flex flex-col items-center space-y-4">
           <Loader2 className="animate-spin text-blue-600" size={40} />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Triangulating nearby health services...</p>
        </div>
      )}

      {error && (
        <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-[11px] font-bold text-center">
           {error}
        </div>
      )}

      {results && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm leading-relaxed text-sm text-slate-800 font-medium whitespace-pre-wrap">
             {results}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {places.map((chunk, idx) => (
              chunk.maps && (
                <a 
                  key={idx} 
                  href={chunk.maps.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-6 bg-[#050912] text-white rounded-[2rem] hover:bg-black transition-all group"
                >
                  <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center shrink-0">
                       <Navigation size={22} className="text-emerald-400" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-black truncate font-serif-clinical italic">{chunk.maps.title || 'Location Found'}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Open in Google Maps</p>
                    </div>
                  </div>
                  <ExternalLink size={18} className="text-slate-500 group-hover:text-white transition-colors" />
                </a>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyServices;
