import React, { useState, useRef, useEffect } from 'react';
import { ChevronRightIcon } from './Icons';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = 'Select...', 
  className = '' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white flex items-center justify-between focus:border-white/20 focus:outline-none transition-colors min-h-[48px]"
      >
        <span className={`text-sm ${!selectedOption ? 'text-neutral-500' : ''}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronRightIcon 
          className={`w-4 h-4 text-neutral-500 transition-transform duration-200 ${isOpen ? '-rotate-90' : 'rotate-90'}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-[#1C1C1E] border border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center justify-between ${
                  value === option.value 
                    ? 'bg-white/10 text-white font-medium' 
                    : 'text-neutral-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {option.label}
                {value === option.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomSelect;
