
import React, { useState } from 'react';
import { SearchCode, Sparkles, Loader2, Globe, ArrowUpRight, BookOpen, ShieldCheck } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const MedicalResearch = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsLoading(true);
    setResult(null);
    setSources([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', 
        contents: `Provide a detailed clinical summary and the latest 2024/2025 guidelines for the following medical query: "${query}". Focus on evidence-based medicine.`,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });

      setResult(response.text || "No detailed results found.");
      if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
        setSources(response.candidates[0].groundingMetadata.groundingChunks);
      }
    } catch (err) {
      setResult("Unable to connect to Medical Index. Please check your connectivity.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-[1.5rem] flex items-center justify-center mx-auto shadow-xl">
           <SearchCode size={32} />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight font-serif-clinical">MedIntel AI Research</h1>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em]">Real-time Clinical Grounding & Guideline Index</p>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="relative">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Latest WHO guidelines for Pediatric Asthma 2024"
            className="w-full pl-8 pr-32 py-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white font-bold text-sm transition-all shadow-inner"
          />
          <button 
            type="submit"
            disabled={isLoading}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-900 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Sparkles size={14} />}
            <span>Consult AI</span>
          </button>
        </form>
      </div>

      {result && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm leading-relaxed">
             <div className="flex items-center space-x-3 mb-8 border-b border-slate-100 pb-6">
                <ShieldCheck size={20} className="text-emerald-500" />
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Briefing</h3>
             </div>
             <div className="text-slate-800 font-medium whitespace-pre-wrap text-sm">
               {result}
             </div>
          </div>

          {sources.length > 0 && (
            <div className="space-y-4">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center px-4">
                 <Globe size={14} className="mr-3 text-blue-500" /> Verified Medical Sources
               </p>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-2">
                 {sources.map((chunk, idx) => (
                   chunk.web && (
                    <a 
                      key={idx} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] hover:border-blue-400 hover:shadow-lg transition-all group"
                    >
                      <div className="flex items-center space-x-4 overflow-hidden">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
                           <BookOpen size={18} />
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-black text-slate-900 truncate uppercase tracking-tight group-hover:text-blue-600">{chunk.web.title || 'Source Reference'}</p>
                          <p className="text-[9px] text-slate-400 font-bold truncate mt-1">{new URL(chunk.web.uri).hostname}</p>
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-200 group-hover:text-blue-600" />
                    </a>
                   )
                 ))}
               </div>
            </div>
          )}
        </div>
      )}

      {!result && !isLoading && (
        <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/20">
           <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 text-slate-200 shadow-inner">
              <SearchCode size={32} />
           </div>
           <p className="text-[11px] font-black text-slate-300 uppercase tracking-widest italic">Awaiting clinical query for AI synthesis...</p>
        </div>
      )}
    </div>
  );
};

export default MedicalResearch;
