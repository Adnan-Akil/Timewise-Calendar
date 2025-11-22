
import React, { useState, useEffect } from 'react';
import { SparklesIcon, CalendarIcon, ListIcon } from './Icons';
import { ViewMode } from '../types';

interface TourProps {
  onComplete: () => void;
  onViewChange: (view: ViewMode, openChat: boolean) => void;
}

const steps = [
  {
    title: "Welcome",
    desc: "Experience a new era of student organization powered by advanced AI.",
    icon: <SparklesIcon className="w-8 h-8 text-royal-500" />,
    view: ViewMode.MONTH,
    chat: false
  },
  {
    title: "Infinite Timeline",
    desc: "Scroll seamlessly through your schedule. Jump to any date instantly.",
    icon: <ListIcon className="w-8 h-8 text-royal-600" />,
    view: ViewMode.WEEK,
    chat: false
  },
  {
    title: "AI Assistant",
    desc: "Ask questions, generate events, and get insights about your time.",
    icon: <SparklesIcon className="w-8 h-8 text-royal-700" />,
    view: ViewMode.WEEK,
    chat: false
  }
];

const Tour: React.FC<TourProps> = ({ onComplete, onViewChange }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Sync app state with tour step
    const step = steps[currentStep];
    onViewChange(step.view, step.chat);
  }, [currentStep, onViewChange]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pointer-events-none">
      {/* Dimmed Background - allowing user to see app behind */}
      <div className="absolute inset-0 bg-black/40 pointer-events-auto transition-opacity" onClick={onComplete} />
      
      <div className="relative w-full max-w-md mx-auto bg-[#1C1C1E] border-t border-white/10 shadow-2xl pb-safe animate-in slide-in-from-bottom-full duration-500 rounded-t-3xl pointer-events-auto">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
             <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-neutral-800 flex items-center justify-center border border-white/5 shadow-inner">
                    {steps[currentStep].icon}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                    {steps[currentStep].title}
                    </h2>
                    <div className="flex gap-1.5">
                    {steps.map((_, i) => (
                        <div 
                        key={i} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-6 bg-royal-500' : 'w-1.5 bg-neutral-700'}`}
                        />
                    ))}
                    </div>
                </div>
             </div>
             <button 
                onClick={onComplete}
                className="text-xs font-medium text-neutral-500 hover:text-white px-2 py-1"
             >
                SKIP
             </button>
          </div>

          <p className="text-neutral-400 text-base leading-relaxed mb-6 pl-1">
            {steps[currentStep].desc}
          </p>

          <button
            onClick={handleNext}
            className="w-full py-3.5 bg-white text-black rounded-xl font-bold text-base shadow-lg hover:bg-neutral-200 active:scale-[0.98] transition-all"
          >
            {currentStep === steps.length - 1 ? "Get Started" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Tour;