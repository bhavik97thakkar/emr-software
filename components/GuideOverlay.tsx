
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, AlertCircle } from 'lucide-react';

export interface GuideStep {
  target: string; // CSS selector or unique identifier
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuideOverlayProps {
  steps: GuideStep[];
  onComplete: () => void;
  onClose: () => void;
  guideKey: string;
}

const GuideOverlay: React.FC<GuideOverlayProps> = ({ steps, onComplete, onClose, guideKey }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setIsVisible(false);
      localStorage.setItem(`medcore_guide_${guideKey}`, 'completed');
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!isVisible || !step) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none overflow-hidden">
      {/* Dimmed Background Overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto" />

      {/* Guide Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
        <div className={`pointer-events-auto w-full max-w-sm bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 p-10 animate-in zoom-in-95 duration-300 relative`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-4">
            <h3 className="text-xl font-black font-serif-clinical text-slate-900">{step.title}</h3>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Footer / Controls */}
          <div className="mt-10 flex items-center justify-between">
            <div className="flex space-x-1.5">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-blue-600' : 'w-1.5 bg-slate-200'}`} />
              ))}
            </div>
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button onClick={handlePrev} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all">
                  <ChevronLeft size={20} />
                </button>
              )}
              <button onClick={handleNext} className="flex items-center space-x-2 bg-[#050912] text-white px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Guide Pulse Pointer (Optional helper visual) */}
          <div className="absolute -top-4 -left-4 w-8 h-8 rounded-full bg-blue-500/20 animate-ping" />
        </div>
      </div>
    </div>
  );
};

export default GuideOverlay;
