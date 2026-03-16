
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface GuideStep {
  target: string;
  title: string;
  description: string;
  route?: string; // optional route to navigate to when this step is shown
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
  const navigate = useNavigate();

  const centeredCardStyle: React.CSSProperties = {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '360px',
    zIndex: 1100,
    pointerEvents: 'auto'
  };

  const [cardStyle, setCardStyle] = useState<React.CSSProperties>(centeredCardStyle);

  const step = steps[currentStep];

  const findElement = (selector: string) => {
    if (!selector) return null;
    return document.querySelector(`.${selector}`) || document.querySelector(`#${selector}`) || document.querySelector(selector);
  };

  // Navigate to the step's route when step changes
  useEffect(() => {
    if (step?.route) {
      navigate(step.route);
    }
  }, [currentStep]);

  // Update card position based on target element
  useEffect(() => {
    const update = () => {
      if (!step) return;
      const el = findElement(step.target);

      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);

        const padding = 16;
        const cardWidth = 360;
        const cardHeight = 250;

        let top: number;
        let left: number;

        const targetCenterX = rect.left + rect.width / 2;
        const isOnLeftSide = targetCenterX < window.innerWidth * 0.35;
        const isOnRightSide = targetCenterX > window.innerWidth * 0.65;

        if (isOnLeftSide) {
          // Sidebar / left panel → card to the RIGHT
          left = rect.right + padding;
          top = rect.top + rect.height / 2 - cardHeight / 2;
        } else if (isOnRightSide) {
          // Right panel → card to the LEFT
          left = rect.left - cardWidth - padding;
          top = rect.top + rect.height / 2 - cardHeight / 2;
        } else {
          // Central content → card BELOW, flip to top if needed
          left = rect.left + rect.width / 2 - cardWidth / 2;
          top = rect.bottom + padding;
          if (top + cardHeight > window.innerHeight) {
            top = rect.top - cardHeight - padding;
          }
        }

        // Clamp within viewport
        left = Math.max(padding, Math.min(left, window.innerWidth - cardWidth - padding));
        top = Math.max(padding, Math.min(top, window.innerHeight - cardHeight - padding));

        setCardStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${cardWidth}px`,
          zIndex: 1100,
          pointerEvents: 'auto',
          transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)',
          transform: 'none'
        });

        // Scroll target into view if off-screen
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null);
        setCardStyle(centeredCardStyle);
      }
    };

    // Small delay to let the route render first, then find the element
    const timer = setTimeout(update, 100);
    const interval = setInterval(update, 600);
    window.addEventListener('resize', update);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('resize', update);
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
      {/* SVG spotlight mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="guide-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 6}
                y={targetRect.top - 6}
                width={targetRect.width + 12}
                height={targetRect.height + 12}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(5, 9, 18, 0.78)"
          mask="url(#guide-mask)"
          className="pointer-events-auto"
        />
      </svg>

      {/* Guide Card */}
      <div
        style={cardStyle}
        className="bg-white rounded-[2rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)] border border-slate-100 p-8 pointer-events-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles size={15} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Guide · {currentStep + 1} / {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2.5">
          <h3 className="text-[1.2rem] font-black font-serif-clinical text-slate-900 leading-tight">
            {step.title}
          </h3>
          <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
            {step.description}
          </p>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <div className="flex space-x-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? 'w-6 bg-indigo-600' : 'w-1.5 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-900 hover:bg-slate-100 transition-all"
              >
                <ChevronLeft size={16} />
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-5 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-indigo-900/20 hover:bg-indigo-700 transition-all"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish' : 'Next'}</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideOverlay;
