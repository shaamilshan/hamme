import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// --- Helper Hooks and Data ---

// --- Helper Hooks and Data ---

const CURRENT_YEAR = new Date().getFullYear();
// Helper to generate numeric ranges
const generateRange = (start: number, end: number): number[] => {
  const out: number[] = [];
  for (let i = start; i <= end; i++) out.push(i);
  return out;
};
const YEARS = generateRange(CURRENT_YEAR - 100, CURRENT_YEAR);
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// --- SVG Icon ---
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// --- Type Definitions ---

// --- Main Component ---

function SetupDOB() {
  const navigate = useNavigate();

  // State for each part of the date
  const [month, setMonth] = useState<number>(10); // Default to October (1-12)
  const [day, setDay] = useState<number>(15);
  const [year, setYear] = useState<number>(CURRENT_YEAR - 16); // Default to 16 years ago
  
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  // (Using keyboard inputs now — no scroll refs needed)
  
  // (We keep month/day/year state; calendar input will sync these values)

  // --- LOGIC (Preserved from original component) ---

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  useEffect(() => {
    const birthDate = new Date(year, month - 1, day);
    setAge(calculateAge(birthDate));
    setError(''); // Clear error on date change
  }, [month, day, year]);

  const handleContinue = async () => {
    if (age === null) return;

    // basic validity checks for numeric ranges
    if (month < 1 || month > 12) {
      setError('Please enter a valid date of birth.');
      return;
    }
    const maxDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDay) {
      setError('Please enter a valid date of birth.');
      return;
    }

    if (age < 13) {
      setError('You must be at least 13 years old to use this app.');
      return;
    }
    if (age > 100) {
      setError('Please enter a valid date of birth.');
      return;
    }
    // Clear any previous inline error and open confirm modal instead of immediate submit
    setError('');
    setShowConfirm(true);
  };

  const handleConfirmAge = async () => {
    setIsLoading(true);
    setError('');
    const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      await apiService.updateDateOfBirth(dateOfBirth);
      setShowConfirm(false);
      navigate('/setup-profile-picture');
    } catch (err: any) {
      console.error('Error updating date of birth:', err);
      setError(err.response?.data?.message || 'Failed to save date of birth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- UI: scroll-wheel inputs for Day / Month / Year ---
  // Refs for scroll containers
  const dayRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Clamp day when month/year change (e.g., Feb)
  useEffect(() => {
    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) setDay(maxDay);
  }, [month, year]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const DAYS = generateRange(1, daysInMonth);

  interface ScrollPickerProps {
    items: number[] | string[];
    value: number;
    onChange: (value: number) => void;
    unitRef: React.RefObject<HTMLDivElement | null>;
    itemHeight?: number;
    visibleItems?: number;
  }

  const ScrollPicker: React.FC<ScrollPickerProps> = ({ items, value, onChange, unitRef, itemHeight = 56, visibleItems = 5 }) => {
    const containerHeight = itemHeight * visibleItems;
    const padding = itemHeight * Math.floor(visibleItems / 2);
    const snapTimeoutRef = useRef<number | null>(null);

    const scrollToIndex = (index: number, smooth = true) => {
      const el = unitRef.current;
      if (!el) return;
      const top = Math.max(0, index * itemHeight);
      if (smooth && 'scrollTo' in el) {
        try {
          el.scrollTo({ top, behavior: 'smooth' });
        } catch {
          el.scrollTop = top;
        }
      } else {
        el.scrollTop = top;
      }
    };

    // center selected item
    useEffect(() => {
      let index = 0;
      if (typeof (items as any[])[0] === 'string') {
        index = value - 1; // months 1-12
      } else {
        index = (items as any[]).indexOf(value);
      }
      if (unitRef.current && index !== -1) {
        unitRef.current.scrollTop = Math.max(0, index * itemHeight);
      }
    }, [value, items, unitRef, itemHeight, padding]);

    const handleScroll = () => {
      const el = unitRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / itemHeight);
      const raw = (items as any[])[idx];
      const next = typeof raw === 'string' ? idx + 1 : (raw as number);
      if (next !== undefined && next !== value) onChange(next as number);
      // debounce snap to the exact center for smoother feel
      if (snapTimeoutRef.current) {
        clearTimeout(snapTimeoutRef.current);
      }
      snapTimeoutRef.current = window.setTimeout(() => {
        scrollToIndex(idx, true);
      }, 80);
    };

    const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      // one step per wheel notch for smooth controlled motion
      const isStrings = typeof (items as any[])[0] === 'string';
      const currentIndex = isStrings ? value - 1 : (items as any[]).indexOf(value);
      const dir = Math.sign(e.deltaY);
      let nextIndex = currentIndex + (dir > 0 ? 1 : -1);
      nextIndex = Math.max(0, Math.min((items as any[]).length - 1, nextIndex));
      const raw = (items as any[])[nextIndex];
      const nextVal = typeof raw === 'string' ? nextIndex + 1 : (raw as number);
      onChange(nextVal);
      scrollToIndex(nextIndex, true);
    };

    return (
      <div
        ref={unitRef}
        onScroll={handleScroll}
        onWheel={handleWheel}
        className="overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
        style={{ height: `${containerHeight}px` }}
        role="listbox"
        aria-label="Scroll picker"
      >
        <div style={{ paddingTop: `${padding}px`, paddingBottom: `${padding}px` }}>
          {(items as any[]).map((item, index) => {
            const isStr = typeof item === 'string';
            const isSelected = isStr ? value === index + 1 : item === value;
            const label = isStr ? (item as string) : String(item).padStart(isStr ? 0 : 2, '0');
            return (
              <div
                key={index}
                role="option"
                aria-selected={isSelected}
                className={`flex items-center justify-center snap-center transition-all duration-200 ${isSelected ? 'text-white text-xl font-semibold' : 'text-gray-400'}`}
                style={{ height: `${itemHeight}px` }}
              >
                {label}
              </div>
            );
          })}
        </div>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-950 to-slate-900 flex flex-col font-sans p-6 text-white">
      <style>
        {`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}
      </style>
      <header className="flex-shrink-0 w-full">
        <div className="relative flex items-center justify-between h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-white/80 hover:text-white transition"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          {/* step indicator */}
          <div className="w-24 h-1 rounded-full bg-white/20">
            <div className="h-1 w-8 bg-pink-500 rounded-full" />
          </div>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-lg mx-auto p-6">
          <h1 className="text-4xl font-bold mb-2">Nice to meet you.</h1>
          <h2 className="text-3xl font-bold mb-2">When’s your birthday?</h2>
          <p className="text-sm text-white/70 mb-6">We only display your age on your profile.</p>

          {/* Scroll picker in three columns */}
          <div className="w-full relative my-8">
            <div className="relative z-10 grid grid-cols-3 text-center">
              <ScrollPicker items={DAYS} value={day} onChange={setDay} unitRef={dayRef} />
              <ScrollPicker items={MONTHS} value={month} onChange={setMonth} unitRef={monthRef} />
              <ScrollPicker items={YEARS} value={year} onChange={setYear} unitRef={yearRef} />
            </div>
            {/* single center selection pill across all columns */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 px-4">
              <div className="w-full bg-white/10 backdrop-blur rounded-2xl h-14 border border-white/20" />
            </div>
          </div>
        
        {age !== null && (
            <p className="text-2xl font-bold text-white mb-4">{age} years old</p>
        )}
        
        {error && (
          <p className="text-red-300 text-sm text-center">{error}</p>
        )}
          </div>
      </main>

      {/* Confirm Age Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
          <div className="relative z-10 w-full sm:max-w-xl mx-4 sm:mx-0 bg-gradient-to-b from-indigo-900 to-slate-900 text-white rounded-[32px] p-6 sm:p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              {/* Simple celebratory emoji/icon */}
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4">
                <span className="text-4xl">🥳</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">Are you {age ?? ''} years old?</h3>
              <p className="text-white/70 text-sm sm:text-base mb-6">Please confirm your age is correct. This can’t be changed later.</p>
              <div className="w-full space-y-3">
                <button
                  onClick={handleConfirmAge}
                  disabled={isLoading}
                  className="w-full bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 rounded-2xl shadow-lg disabled:opacity-60"
                >
                  {isLoading ? 'Confirming…' : 'Confirm'}
                </button>
                <button
                  onClick={() => setShowConfirm(false)}
                  className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl border border-white/20"
                >
                  Edit Age
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6">
        <button
          onClick={handleContinue}
          disabled={isLoading || !!error}
          className="w-full bg-pink-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:bg-pink-600 transition-colors duration-300 shadow-lg shadow-pink-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Continuing...' : 'Continue'}
        </button>
        <p className="text-xs text-gray-400 text-center mt-4">
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </footer>
    </div>
  );
}

export default SetupDOB;