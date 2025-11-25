import React, { useRef, useEffect, useState } from 'react';

interface TimeWheelProps {
  value: string; // HH:mm (24h format)
  onChange: (value: string) => void;
  className?: string;
}

const TimeWheel: React.FC<TimeWheelProps> = ({ value, onChange, className = '' }) => {
  // Parse current value
  const [hours24, minutes] = value.split(':').map(Number);
  const isPm = hours24 >= 12;
  const hours12 = hours24 % 12 || 12;
  const minuteStr = String(minutes).padStart(2, '0');
  const period = isPm ? 'PM' : 'AM';

  // Generate arrays
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const allMins = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  const updateTime = (newHour12: number, newMin: string, newPeriod: string) => {
    let h = newHour12;
    if (newPeriod === 'PM' && h !== 12) h += 12;
    if (newPeriod === 'AM' && h === 12) h = 0;
    onChange(`${String(h).padStart(2, '0')}:${newMin}`);
  };

  // Infinite Wheel Column Component
  const WheelColumn = ({ 
    items, 
    selectedValue, 
    onSelect,
    loop = false
  }: { 
    items: (string | number)[], 
    selectedValue: string | number, 
    onSelect: (val: any) => void,
    loop?: boolean
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const itemHeight = 40;
    // Create a tripled list for infinite scrolling illusion
    const displayItems = loop ? [...items, ...items, ...items] : items;
    const [isScrolling, setIsScrolling] = useState(false);

    // Initial scroll to center
    useEffect(() => {
      if (containerRef.current) {
        const index = items.indexOf(selectedValue);
        if (index !== -1) {
          // If looping, scroll to the middle set
          const offset = loop ? items.length : 0;
          containerRef.current.scrollTop = (offset + index) * itemHeight;
        }
      }
    }, []);

    const handleScroll = () => {
      if (!containerRef.current || !loop) return;
      
      const scrollTop = containerRef.current.scrollTop;
      const totalHeight = items.length * itemHeight;
      
      // If we scroll too far up (into the first set), jump to the middle set
      if (scrollTop < itemHeight) {
        containerRef.current.scrollTop += totalHeight;
      } 
      // If we scroll too far down (into the third set), jump to the middle set
      else if (scrollTop > totalHeight * 2 - itemHeight * 5) { // Buffer
        containerRef.current.scrollTop -= totalHeight;
      }
    };

    return (
      <div 
        ref={containerRef}
        className="h-32 overflow-y-auto no-scrollbar snap-y snap-mandatory py-10"
        onScroll={handleScroll}
      >
        {displayItems.map((item, i) => (
          <div 
            key={`${item}-${i}`}
            onClick={() => onSelect(item)}
            className={`h-10 flex items-center justify-center snap-center cursor-pointer transition-all ${
              item == selectedValue 
                ? 'text-white font-bold text-xl scale-110' 
                : 'text-neutral-600 text-sm'
            }`}
          >
            {item}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className={`flex items-center justify-center gap-2 bg-neutral-900 border border-neutral-800 rounded-xl p-2 ${className}`}>
      {/* Hours */}
      <div className="w-12 text-center relative">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent z-10 pointer-events-none" />
        <WheelColumn 
          items={hours} 
          selectedValue={hours12} 
          onSelect={(h) => updateTime(h, minuteStr, period)} 
          loop={true}
        />
      </div>

      <span className="text-white font-bold text-xl pb-1">:</span>

      {/* Minutes */}
      <div className="w-12 text-center relative">
        <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent z-10 pointer-events-none" />
        <WheelColumn 
          items={allMins} 
          selectedValue={minuteStr} 
          onSelect={(m) => updateTime(hours12, m, period)} 
          loop={true}
        />
      </div>

      {/* Period */}
      <div className="w-12 text-center relative ml-2">
         <div className="absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-neutral-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-neutral-900 to-transparent z-10 pointer-events-none" />
        <WheelColumn 
          items={periods} 
          selectedValue={period} 
          onSelect={(p) => updateTime(hours12, minuteStr, p)} 
          loop={false}
        />
      </div>
    </div>
  );
};

export default TimeWheel;
