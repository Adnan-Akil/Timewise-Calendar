import React, { useRef } from 'react';
import { ChevronRightIcon } from './Icons';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface Option {
  value: string;
  label: string;
}

interface SwipeSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
}

const SwipeSelect: React.FC<SwipeSelectProps> = ({ 
  value, 
  onChange, 
  options,
  className = '' 
}) => {
  const currentIndex = options.findIndex(opt => opt.value === value);
  
  const handlePrev = () => {
    const newIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
    onChange(options[newIndex].value);
  };

  const handleNext = () => {
    const newIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
    onChange(options[newIndex].value);
  };

  // Swipe gestures
  const swipeHandlers = useSwipeGesture({
    onSwipeLeft: handleNext,
    onSwipeRight: handlePrev,
  }, { threshold: 30 }); // Low threshold for easy swiping

  return (
    <div 
      className={`relative flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-xl p-1 ${className}`}
      {...swipeHandlers}
    >
      <button 
        type="button"
        onClick={handlePrev}
        className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-white active:scale-90 transition-all"
      >
        <ChevronRightIcon className="w-5 h-5 rotate-180" />
      </button>

      <div className="flex-1 text-center overflow-hidden">
        <div className="text-white font-medium text-sm animate-fade-in select-none">
          {options[currentIndex]?.label || value}
        </div>
      </div>

      <button 
        type="button"
        onClick={handleNext}
        className="w-10 h-10 flex items-center justify-center text-neutral-500 hover:text-white active:scale-90 transition-all"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default SwipeSelect;
