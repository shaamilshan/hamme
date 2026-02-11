import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

  const ScrollPicker: React.FC<ScrollPickerProps> = ({ items, value, onChange, unitRef, itemHeight = 48, visibleItems = 5 }) => {
    const containerHeight = itemHeight * visibleItems;
    const offsetRef = useRef(0);
    const velocityRef = useRef(0);
    const animFrameRef = useRef<number>(0);
    const isDraggingRef = useRef(false);
    const lastYRef = useRef(0);
    const lastTimeRef = useRef(0);
    const isInitializedRef = useRef(false);

    const itemCount = items.length;
    const minOffset = -(itemCount - 1) * itemHeight;
    const maxOffset = 0;

    const clamp = (val: number, min: number, max: number) => Math.min(max, Math.max(min, val));

    const getValueFromOffset = (off: number) => {
      const idx = clamp(Math.round(-off / itemHeight), 0, itemCount - 1);
      const raw = (items as any[])[idx];
      return typeof raw === 'string' ? idx + 1 : (raw as number);
    };

    const getIndexFromValue = (val: number) => {
      if (typeof (items as any[])[0] === 'string') return val - 1;
      return (items as number[]).indexOf(val);
    };

    const renderItems = () => {
      const el = unitRef.current;
      if (!el) return;
      const children = el.children;
      // The container (absolute div) is positioned such that its top is at the visual center slot.
      // So the "center" y-coordinate inside this container is itemHeight / 2.
      const centerY = itemHeight / 2;

      for (let i = 0; i < children.length; i++) {
        const child = children[i] as HTMLElement;
        const itemCenterY = i * itemHeight + itemHeight / 2 + offsetRef.current;
        const dist = Math.abs(itemCenterY - centerY);
        const maxDist = itemHeight * 2.5;
        const ratio = clamp(1 - dist / maxDist, 0, 1);
        const scale = 0.7 + 0.3 * ratio;
        const opacity = 0.3 + 0.7 * ratio;
        child.style.transform = `translateY(${offsetRef.current}px) scale(${scale})`;
        child.style.opacity = String(opacity);
      }
    };

    const animateToOffset = (target: number, onComplete?: () => void) => {
      cancelAnimationFrame(animFrameRef.current);
      const step = () => {
        const diff = target - offsetRef.current;
        if (Math.abs(diff) < 0.5) {
          offsetRef.current = target;
          renderItems();
          onComplete?.();
          return;
        }
        offsetRef.current += diff * 0.2;
        renderItems();
        animFrameRef.current = requestAnimationFrame(step);
      };
      animFrameRef.current = requestAnimationFrame(step);
    };

    const snapToNearest = () => {
      const targetIdx = clamp(Math.round(-offsetRef.current / itemHeight), 0, itemCount - 1);
      const targetOffset = -targetIdx * itemHeight;
      animateToOffset(targetOffset, () => {
        const newVal = getValueFromOffset(targetOffset);
        if (newVal !== value) onChange(newVal);
      });
    };

    const startMomentum = () => {
      cancelAnimationFrame(animFrameRef.current);
      const friction = 0.94;
      const step = () => {
        if (isDraggingRef.current) return;
        velocityRef.current *= friction;
        offsetRef.current = clamp(offsetRef.current + velocityRef.current, minOffset, maxOffset);
        renderItems();
        if (Math.abs(velocityRef.current) > 0.5) {
          animFrameRef.current = requestAnimationFrame(step);
        } else {
          snapToNearest();
        }
      };
      animFrameRef.current = requestAnimationFrame(step);
    };

    // Initialize position
    useEffect(() => {
      const idx = getIndexFromValue(value);
      if (idx !== -1) {
        offsetRef.current = -idx * itemHeight;
        renderItems();
      }
      isInitializedRef.current = true;
    }, []);

    // Sync when value changes externally
    useEffect(() => {
      if (!isInitializedRef.current) return;
      const idx = getIndexFromValue(value);
      if (idx !== -1) {
        animateToOffset(-idx * itemHeight);
      }
    }, [value, items.length]);

    const handlePointerDown = (e: React.PointerEvent) => {
      isDraggingRef.current = true;
      cancelAnimationFrame(animFrameRef.current);
      velocityRef.current = 0;
      lastYRef.current = e.clientY;
      lastTimeRef.current = Date.now();
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const now = Date.now();
      const dy = e.clientY - lastYRef.current;
      const dt = now - lastTimeRef.current;
      if (dt > 0) {
        velocityRef.current = dy * (16 / Math.max(dt, 1));
      }
      lastYRef.current = e.clientY;
      lastTimeRef.current = now;
      offsetRef.current = clamp(offsetRef.current + dy, minOffset - itemHeight, maxOffset + itemHeight);
      renderItems();
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      if (offsetRef.current > maxOffset || offsetRef.current < minOffset) {
        velocityRef.current = 0;
        snapToNearest();
      } else {
        startMomentum();
      }
    };

    const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      cancelAnimationFrame(animFrameRef.current);
      const dir = Math.sign(e.deltaY);
      const currentIdx = clamp(Math.round(-offsetRef.current / itemHeight), 0, itemCount - 1);
      const nextIdx = clamp(currentIdx + dir, 0, itemCount - 1);
      const targetOffset = -nextIdx * itemHeight;
      animateToOffset(targetOffset, () => {
        const newVal = getValueFromOffset(targetOffset);
        if (newVal !== value) onChange(newVal);
      });
    };

    return (
      <div
        style={{ height: `${containerHeight}px`, touchAction: 'none', cursor: 'grab', position: 'relative', overflow: 'hidden' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        role="listbox"
        aria-label="Scroll picker"
      >
        <div ref={unitRef} style={{ position: 'absolute', width: '100%', top: `${containerHeight / 2 - itemHeight / 2}px`, left: 0 }}>
          {(items as any[]).map((item, index) => {
            const isStr = typeof item === 'string';
            const label = isStr ? (item as string) : String(item).padStart(2, '0');
            return (
              <div
                key={index}
                role="option"
                aria-selected={false}
                className="flex items-center justify-center select-none text-white text-lg"
                style={{
                  height: `${itemHeight}px`,
                  willChange: 'transform, opacity',
                }}
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
    <div className="min-h-screen bg-black flex flex-col font-sans p-6 text-white">
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
      <motion.header
        className="flex-shrink-0 w-full"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="relative flex items-center justify-between h-14">
          <button
            onClick={() => navigate(-1)}
            className="text-white/70 hover:text-white transition"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          {/* step indicator */}
          <div className="w-24 h-1 rounded-full bg-white/20">
            <div className="h-1 w-8 rounded-full" style={{ backgroundColor: '#906EF6' }} />
          </div>
        </div>
      </motion.header>

      <main className="flex-grow flex items-center justify-center w-full">
        <motion.div
          className="w-full max-w-lg mx-auto p-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
        >
          <h1 className="text-4xl font-bold mb-2" style={{ color: '#906EF6' }}>Nice to meet you.</h1>
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#906EF6' }}>When's your birthday?</h2>
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
              <div className="w-full backdrop-blur rounded-2xl h-14 border" style={{ backgroundColor: 'rgba(144, 110, 246, 0.1)', borderColor: 'rgba(144, 110, 246, 0.3)' }} />
            </div>
          </div>

          {age !== null && (
            <p className="text-2xl font-bold mb-4" style={{ color: '#906EF6' }}>{age} years old</p>
          )}

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
        </motion.div>
      </main>

      {/* Confirm Age Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setShowConfirm(false)} />
            <motion.div
              className="relative z-10 w-full sm:max-w-xl mx-4 sm:mx-0 bg-black text-white rounded-[32px] p-6 sm:p-8 shadow-2xl"
              style={{ border: '1px solid rgba(144, 110, 246, 0.2)' }}
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: 'rgba(144, 110, 246, 0.15)' }}>
                  <span className="text-4xl">🥳</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-2">Are you {age ?? ''} years old?</h3>
                <p className="text-white/70 text-sm sm:text-base mb-6">Please confirm your age is correct. This can't be changed later.</p>
                <div className="w-full space-y-3">
                  <motion.button
                    onClick={handleConfirmAge}
                    disabled={isLoading}
                    className="w-full text-white font-bold py-3 rounded-2xl shadow-lg disabled:opacity-60"
                    style={{ backgroundColor: '#906EF6', boxShadow: '0 10px 30px rgba(144, 110, 246, 0.3)' }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    {isLoading ? 'Confirming…' : 'Confirm'}
                  </motion.button>
                  <button
                    onClick={() => setShowConfirm(false)}
                    className="w-full bg-white/10 hover:bg-white/15 text-white font-semibold py-3 rounded-2xl border border-white/20"
                  >
                    Edit Age
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.footer
        className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
      >
        <motion.button
          onClick={handleContinue}
          disabled={isLoading || !!error}
          className="w-full text-white font-bold py-4 px-8 rounded-full text-lg transition-opacity duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#906EF6', boxShadow: '0 10px 30px rgba(144, 110, 246, 0.3)' }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          {isLoading ? 'Continuing...' : 'Continue'}
        </motion.button>
        <p className="text-xs text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </motion.footer>
    </div>
  );
}

export default SetupDOB;