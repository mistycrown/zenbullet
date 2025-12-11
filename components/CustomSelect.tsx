
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

const CustomSelect = ({ 
  value, 
  options, 
  onChange, 
  icon: Icon,
  placeholder = "Select..."
}: { 
  value: string | null;
  options: { label: string; value: string | null }[];
  onChange: (val: any) => void;
  icon?: any;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{top: number, left: number, width: number} | null>(null);

  // Unique ID for the portal container check
  const portalId = React.useId();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the main container
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        // Check if click is inside the portal content
        const portalEl = document.getElementById(`custom-select-portal-${portalId}`);
        if (portalEl && portalEl.contains(event.target as Node)) {
             return;
        }
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', () => setIsOpen(false));
    
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        window.removeEventListener('resize', () => setIsOpen(false));
    };
  }, [portalId]);

  // Calculate coordinates synchronously before paint to prevent fly-in
  useLayoutEffect(() => {
    if (isOpen && containerRef.current) {
        const updatePosition = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setCoords({
                    top: rect.bottom + 4,
                    left: rect.left,
                    width: rect.width
                });
            }
        };

        updatePosition();
        
        // Capture scroll on window to update position in real-time
        window.addEventListener('scroll', updatePosition, { capture: true });
        window.addEventListener('resize', updatePosition);

        return () => {
             window.removeEventListener('scroll', updatePosition, { capture: true });
             window.removeEventListener('resize', updatePosition);
        }
    } else {
        setCoords(null);
    }
  }, [isOpen]);

  const selectedLabel = options.find(o => o.value === value)?.label || placeholder;

  return (
    <div className="relative" ref={containerRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-50 hover:bg-stone-100 transition-colors rounded-lg px-3 py-2 text-sm text-ink flex items-center justify-between border border-transparent focus:border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-200"
      >
        <div className="flex items-center gap-2 text-stone-700 font-medium truncate">
          {Icon && <Icon size={16} className="text-stone-400 shrink-0" />}
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown size={14} className={`text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''} shrink-0`} />
      </button>

      {isOpen && coords && createPortal(
        <div 
           id={`custom-select-portal-${portalId}`}
           style={{ top: coords.top, left: coords.left, width: coords.width, position: 'fixed' }}
           className="bg-white rounded-lg shadow-xl border border-stone-100 z-[9999] py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto"
        >
          {options.map((option) => (
            <button
              key={String(option.value)}
              type="button"
              onClick={() => { onChange(option.value); setIsOpen(false); }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center gap-2 ${option.value === value ? 'text-ink font-semibold bg-stone-50' : 'text-stone-600'}`}
            >
              {option.value === value && <Check size={14} className="text-ink shrink-0" />}
              <span className={`truncate ${option.value === value ? '' : 'pl-5'}`}>{option.label}</span>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
};

export default CustomSelect;
