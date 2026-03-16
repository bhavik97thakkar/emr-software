
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';

export interface GuideStep {
  target: string; // CSS selector
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface GuideOverlayProps {
  steps: GuideStep[];
  onComplete: () => void;
  onClose: () => void;
  guideKey: string;
}

const GuideOverlay: React.FC<GuideOverlayProps> = ({ steps, onComplete, onClose, guideKey }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [cardStyle, setCardStyle] = useState<React.CSSProperties>({});
  const requestRef = useRef<number>();

  const step = steps[currentStep];

  const updateTargetPosition = () => {
    if (!step) return;
    const element = document.querySelector(step.target === 'sidebar' ? `.${step.target}` : `.${step.target}`);
    // Support both direct class match and descriptive selector
    const el = document.querySelector(`.${step.target}`) || document.querySelector(step.target);
    
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      
      // Calculate Card Position
      const padding = 20;
      const cardWidth = 350;
      const cardHeight = 250;
      let top = rect.bottom + padding;
      let left = rect.left + (rect.width / 2) - (cardWidth / 2);

      // Auto-flip if out of bounds
      if (top + cardHeight > window.innerHeight) {
        top = rect.top - cardHeight - padding;
      }
      if (left < padding) left = padding;
      if (left + cardWidth > window.innerWidth - padding) left = window.innerWidth - cardWidth - padding;

      setCardStyle({
        position: 'fixed',
        top: `${Math.max(padding, top)}px`,
        left: `${left}px`,
        width: `${cardWidth}px`,
        zIndex: 1100,
        pointerEvents: 'auto'
      });

      // Smooth scroll into view
      if (top < 0 || top > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
      setCardStyle({
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '350px',
        zIndex: 1100,
        pointerEvents: 'auto'
      });
    }
    requestRef.current = requestAnimationFrame(updateTargetPosition);
  };

  useLayoutEffect(() => {
    requestRef.current = requestAnimationFrame(updateTargetPosition);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      localStorage.setItem(`medcore_guide_${guideKey}`, 'completed');
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!step) return null;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* SVG Spotlight Overlay */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="12"
                fill="black"
                className="transition-all duration-300"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(5, 9, 18, 0.7)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Interactive Guide Card */}
      <div style={cardStyle} className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-slate-200 p-8 animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <Sparkles size={16} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-900 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-black font-serif-clinical text-slate-900 leading-tight">{step.title}</h3>
          <p className="text-[12px] text-slate-500 font-medium leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex space-x-1.5">
            {steps.map((_, i) => (
              <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentStep ? 'w-4 bg-blue-600' : 'w-1 bg-slate-200'}`} />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button onClick={handlePrev} className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 transition-all">
                <ChevronLeft size={18} />
              </button>
            )}
            <button onClick={handleNext} className="flex items-center space-x-2 bg-[#050912] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-black transition-all">
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideOverlay;
