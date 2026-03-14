
import React, { useState, useEffect, useRef } from 'react';
import { Mic, Loader2, Sparkles, XCircle, AlertCircle, Square } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface VoiceInputProps {
  value: string;
  onTranscript: (text: string) => void;
  placeholder?: string;
  isTextArea?: boolean;
  className?: string;
  enableRefine?: boolean;
  readOnly?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ 
  value, 
  onTranscript, 
  placeholder, 
  isTextArea = false,
  className = "",
  enableRefine = false,
  readOnly = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [errorStatus, setErrorStatus] = useState<'none' | 'no-speech' | 'other'>('none');
  const [support, setSupport] = useState(true);
  
  const [localValue, setLocalValue] = useState(value);
  
  const recognitionRef = useRef<any>(null);
  const valueAtStartRef = useRef('');

  useEffect(() => {
    if (!isListening) {
      setLocalValue(value);
    }
  }, [value, isListening]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setSupport(false);
    }
  }, []);

  const toggleListening = () => {
    if (readOnly) return;
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    valueAtStartRef.current = value || '';

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = true;
    recognition.interimResults = true; 
    recognition.lang = 'en-IN'; 

    recognition.onstart = () => {
      setIsListening(true);
      setErrorStatus('none');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const combinedSpeech = (finalTranscript + interimTranscript).trim();
      const base = valueAtStartRef.current.trim();
      const separator = base ? (isTextArea ? '\n' : ' ') : '';
      const newValue = base + separator + combinedSpeech;
      
      setLocalValue(newValue);
      onTranscript(newValue);
    };

    recognition.onerror = (event: any) => {
      if (event.error !== 'no-speech') {
        setErrorStatus('other');
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const refineWithAI = async () => {
    if (!value || isRefining || readOnly || !process.env.API_KEY) return;
    setIsRefining(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a medical scribe. Refine this dictation into clean clinical text: "${value}"`,
        config: { temperature: 0.1, maxOutputTokens: 1000 }
      });
      if (response.text) {
        const refined = response.text.trim();
        setLocalValue(refined);
        onTranscript(refined);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefining(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    onTranscript(val);
  };

  if (!support) return null;

  const activeStyles = isListening ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50/20' : '';

  return (
    <div className="relative group w-full">
      {isTextArea ? (
        <textarea
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${className} pr-14 transition-all duration-150 ${activeStyles}`}
        />
      ) : (
        <input
          type="text"
          value={localValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          readOnly={readOnly}
          className={`${className} pr-12 transition-all duration-150 ${activeStyles}`}
        />
      )}
      
      {!readOnly && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1.5 z-10">
          {enableRefine && localValue.length > 5 && !isListening && process.env.API_KEY && (
            <button
              type="button"
              onClick={refineWithAI}
              className={`p-2 rounded-xl transition-all ${isRefining ? 'bg-purple-100 text-purple-600 animate-pulse' : 'bg-slate-100 text-slate-400 hover:bg-purple-100 hover:text-purple-600'}`}
            >
              {isRefining ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          )}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-2.5 rounded-xl transition-all border shadow-sm ${
              isListening 
                ? 'bg-rose-600 text-white border-rose-400 animate-pulse scale-105' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-400 hover:text-blue-600'
            }`}
            title={isListening ? "Click to Stop" : "Click to Speak"}
          >
            {isListening ? <Square size={18} fill="currentColor" /> : <Mic size={18} />}
          </button>
        </div>
      )}

      {isListening && (
        <div className="absolute -top-11 right-0 animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-none z-[100]">
          <div className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-1.5 rounded-full shadow-lg border border-white/20">
            <div className="flex space-x-1 items-end h-3">
               <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_0ms]"></div>
               <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_200ms]"></div>
               <div className="w-1 bg-white rounded-full animate-[bounce_0.6s_infinite_400ms]"></div>
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest">Live Typing</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceInput;
