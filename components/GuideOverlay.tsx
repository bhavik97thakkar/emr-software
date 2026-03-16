
import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, X, Sparkles, SkipForward } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface GuideStep {
  target: string;
  title: string;
  description: string;
  route?: string;
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
    width: '380px',
    zIndex: 1100,
    pointerEvents: 'auto'
  };

  const [cardStyle, setCardStyle] = useState<React.CSSProperties>(centeredCardStyle);

  const step = steps[currentStep];

  const findElement = (selector: string) => {
    if (!selector) return null;
    return (
      document.querySelector(`.${selector}`) ||
      document.querySelector(`#${selector}`) ||
      document.querySelector(selector)
    );
  };

  const handleSkip = () => {
    localStorage.setItem(`medcore_guide_${guideKey}`, 'completed');
    onClose();
  };

  const handleFinish = () => {
    localStorage.setItem(`medcore_guide_${guideKey}`, 'completed');
    onComplete();
  };

  // Navigate when step changes
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

        const padding = 18;
        const cardWidth = 380;
        const cardHeight = 260;

        let top: number;
        let left: number;

        const targetCenterX = rect.left + rect.width / 2;
        const isOnLeftSide = targetCenterX < window.innerWidth * 0.35;
        const isOnRightSide = targetCenterX > window.innerWidth * 0.65;
        const isNearTop = rect.top < window.innerHeight * 0.4;

        if (isOnLeftSide) {
          // Sidebar → card to the RIGHT of the element
          left = rect.right + padding;
          top = rect.top + rect.height / 2 - cardHeight / 2;
        } else if (isOnRightSide) {
          // Right panel → card to the LEFT
          left = rect.left - cardWidth - padding;
          top = rect.top + rect.height / 2 - cardHeight / 2;
        } else if (isNearTop) {
          // Near top → card below
          left = rect.left + rect.width / 2 - cardWidth / 2;
          top = rect.bottom + padding;
        } else {
          // Default → card above
          left = rect.left + rect.width / 2 - cardWidth / 2;
          top = rect.top - cardHeight - padding;
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
          transform: 'none',
          transition: 'top 0.35s cubic-bezier(0.4,0,0.2,1), left 0.35s cubic-bezier(0.4,0,0.2,1)'
        });

        // Always scroll target into view (works for sidebar overflow scroll too)
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        setTargetRect(null);
        setCardStyle(centeredCardStyle);
      }
    };

    const timer = setTimeout(update, 150);
    const interval = setInterval(update, 700);
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
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!step) return null;

  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[1000] pointer-events-none">
      {/* SVG Spotlight Mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="guide-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect
                x={targetRect.left - 8}
                y={targetRect.top - 8}
                width={targetRect.width + 16}
                height={targetRect.height + 16}
                rx="16"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(4, 7, 18, 0.82)"
          mask="url(#guide-mask)"
          className="pointer-events-auto"
        />
      </svg>

      {/* Animated Guide Card */}
      <div
        style={cardStyle}
        className="bg-white rounded-[1.8rem] shadow-[0_40px_80px_-16px_rgba(0,0,0,0.6)] border border-slate-100/60 overflow-hidden pointer-events-auto"
      >
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-1 bg-indigo-500 transition-all duration-500"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>

        <div className="p-7">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 bg-indigo-600 text-white rounded-lg flex items-center justify-center">
                <Sparkles size={13} />
              </div>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Step {currentStep + 1} of {steps.length}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-all"
              title="Close guide"
            >
              <X size={16} />
            </button>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <h3 className="text-[1.15rem] font-black font-serif-clinical text-slate-900 leading-snug">
              {step.title}
            </h3>
            <p className="text-[13px] text-slate-500 font-medium leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Footer */}
          <div className="mt-7 flex items-center justify-between">
            {/* Skip button */}
            <button
              onClick={handleSkip}
              className="flex items-center space-x-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-600 transition-colors"
            >
              <SkipForward size={12} />
              <span>Skip tour</span>
            </button>

            {/* Navigation */}
            <div className="flex items-center space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:text-slate-800 hover:bg-slate-100 transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
              )}
              <button
                onClick={handleNext}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all shadow-lg ${
                  isLastStep
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-900/20'
                }`}
              >
                <span>{isLastStep ? '🎉 Done' : 'Next'}</span>
                {!isLastStep && <ChevronRight size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideOverlay;
