import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// --- Helper Hooks and Data ---

// Generates an array of numbers for day/year wheels
const generateNumberRange = (start: number, end: number): number[] => {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = generateNumberRange(CURRENT_YEAR - 100, CURRENT_YEAR);

// --- SVG Icon ---
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

// --- Type Definitions ---
interface ScrollPickerProps {
  items: number[];
  value: number;
  onChange: (value: number) => void;
  unitRef: React.RefObject<HTMLDivElement>;
  itemHeight?: number;
  visibleItems?: number;
}

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

  // Refs for scroll containers
  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);
  
  // Dynamically generate days based on selected month and year
  const daysInMonth = new Date(year, month, 0).getDate();
  const DAYS = generateNumberRange(1, daysInMonth);

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
    // Validate that the current day is not out of bounds for the new month
    if (day > daysInMonth) {
        setDay(daysInMonth);
    }
    const birthDate = new Date(year, month - 1, day);
    setAge(calculateAge(birthDate));
    setError(''); // Clear error on date change
  }, [month, day, year, daysInMonth]);

  const handleContinue = async () => {
    if (age === null) return;

    if (age < 13) {
      setError('You must be at least 13 years old to use this app.');
      return;
    }
    if (age > 100) {
      setError('Please enter a valid date of birth.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    const dateOfBirth = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    try {
      await apiService.updateDateOfBirth(dateOfBirth);
      navigate('/setup-profile-picture');
    } catch (err: any) {
      console.error('Error updating date of birth:', err);
      setError(err.response?.data?.message || 'Failed to save date of birth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- UI Component for Scroll Wheel ---
  
  const ScrollPicker: React.FC<ScrollPickerProps> = ({ items, value, onChange, unitRef, itemHeight = 48, visibleItems = 5 }) => {
    const containerHeight = itemHeight * visibleItems;
    const paddingTop = itemHeight * Math.floor(visibleItems / 2);

    useEffect(() => {
        const index = items.indexOf(value);
        if (unitRef.current && index !== -1) {
            unitRef.current.scrollTop = index * itemHeight;
        }
    }, [value, items, unitRef, itemHeight]);

    const handleScroll = () => {
        if (unitRef.current) {
            const index = Math.round(unitRef.current.scrollTop / itemHeight);
            const newValue = items[index];
            if(newValue !== undefined && newValue !== value) onChange(newValue);
        }
    };
    
    return (
        <div 
            ref={unitRef}
            onScroll={handleScroll}
            className="h-60 overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
            style={{ height: `${containerHeight}px`}}
        >
            <div style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingTop}px` }}>
                {items.map((item, index) => {
                    const isSelected = item === value;
                    const displayValue = typeof item === 'number' ? item : MONTHS[item as number];
                    return (
                        <div
                            key={index}
                            className={`flex items-center justify-center snap-center transition-all duration-200 text-3xl ${isSelected ? 'font-bold text-black' : 'font-medium text-gray-300'}`}
                            style={{ height: `${itemHeight}px` }}
                        >
                            {displayValue}
                        </div>
                    );
                })}
            </div>
        </div>
    );
  };


  return (
    <div className="min-h-screen bg-white flex flex-col font-sans p-6">
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
      <header className="flex-shrink-0 w-full max-w-md mx-auto">
        <div className="relative flex items-center justify-center h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 text-gray-800 hover:text-black transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-black">Confirm your age</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md mx-auto">
        {/* Custom Wheel Picker - No visual indicator */}
        <div className="w-full relative h-60 my-8">
            <div className="relative z-10 grid grid-cols-3 text-center">
                 <ScrollPicker items={DAYS} value={day} onChange={setDay} unitRef={dayRef} />
                 <ScrollPicker items={generateNumberRange(1, 12)} value={month} onChange={setMonth} unitRef={monthRef} />
                 <ScrollPicker items={YEARS} value={year} onChange={setYear} unitRef={yearRef} />
            </div>
        </div>
        
        {age !== null && (
            <p className="text-2xl font-bold text-black mb-4">{age} years old</p>
        )}
        
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
      </main>

      <footer className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6">
        <button
          onClick={handleContinue}
          disabled={isLoading || !!error}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:opacity-90 transition-opacity duration-300 shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
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