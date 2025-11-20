import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// --- Helper Hooks and Data ---

// --- Helper Hooks and Data ---

const CURRENT_YEAR = new Date().getFullYear();

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
  
  // --- UI: scroll-wheel inputs for Day / Month / Year ---
  // Refs for the three input boxes (day, month, year)
  const dayInputRef = useRef<HTMLInputElement | null>(null);
  const monthInputRef = useRef<HTMLInputElement | null>(null);
  const yearInputRef = useRef<HTMLInputElement | null>(null);

  // Controlled string inputs so users can type '07 10 2003'
  const [dayStr, setDayStr] = useState<string>(String(day).padStart(2, '0'));
  const [monthStr, setMonthStr] = useState<string>(String(month).padStart(2, '0'));
  const [yearStr, setYearStr] = useState<string>(String(year));

  // (daysInMonth computed on demand where needed)

  // sync numeric states when the string inputs change
  useEffect(() => {
    const parsedDay = Math.max(1, Math.min(31, parseInt(dayStr || '0', 10) || 1));
    const parsedMonth = Math.max(1, Math.min(12, parseInt(monthStr || '0', 10) || 1));
    const parsedYear = parseInt(yearStr || String(year), 10) || year;
    // Only update when different to avoid extra renders
    if (parsedDay !== day) setDay(parsedDay);
    if (parsedMonth !== month) setMonth(parsedMonth);
    if (parsedYear !== year) setYear(parsedYear);
    // clear any previous error while editing
    setError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayStr, monthStr, yearStr]);

  // If month or year changes, ensure the day string/value doesn't exceed that month's max days
  useEffect(() => {
    const maxDay = new Date(year, month, 0).getDate();
    const currentDay = parseInt(dayStr || '0', 10) || day;
    if (currentDay > maxDay) {
      const newDayStr = String(maxDay).padStart(2, '0');
      setDayStr(newDayStr);
      setDay(maxDay);
    }
  }, [month, year, dayStr, day]);


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
          /* Visually hide native calendar icon but keep picker interactive */
          /* Do NOT remove native appearance or pointer-events — that can disable the picker. */
          input[type="date"]::-webkit-calendar-picker-indicator {
            opacity: 0; /* visually hidden */
          }
          /* Firefox: hide clear button if present */
          input[type="date"]::-moz-clear {
            display: none;
          }
        `}
      </style>
      <header className="flex-shrink-0 w-full">
        <div className="relative flex items-center justify-center h-14">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-0 -ml-2 bg-white/90 hover:bg-white text-gray-700 hover:text-black rounded-full p-2 shadow-sm transition"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-extrabold text-gray-900">Confirm your age</h1>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center w-full">
        <div className="w-full max-w-lg mx-auto bg-white rounded-2xl shadow-xl p-6">
          <p className="text-sm text-gray-500 mb-4">Enter your date of birth so we can confirm your eligibility.</p>

          {/* Three input boxes: Day, Month, Year */}
          <div className="w-full relative my-8">
            <div className="relative z-10 grid grid-cols-3 gap-4 text-center items-center">
              <div>
                <label htmlFor="day" className="sr-only">Day</label>
                <input
                  id="day"
                  ref={dayInputRef}
                  value={dayStr}
                  type="text"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setDayStr(v);
                    // defer focusing the next input to the next tick so the second keystroke isn't interrupted
                    if (v.length === 2) setTimeout(() => monthInputRef.current?.focus(), 0);
                    setError('');
                  }}
                  onBlur={() => {
                    // pad and clamp to valid day for the current month/year
                    const padded = String((parseInt(dayStr || '0', 10) || 1)).padStart(2, '0');
                    let num = parseInt(padded, 10);
                    const max = new Date(year, month, 0).getDate();
                    if (num < 1) num = 1;
                    if (num > max) num = max;
                    setDayStr(String(num).padStart(2, '0'));
                  }}
                  inputMode="numeric"
                  maxLength={2}
                  className="mx-auto w-28 bg-gray-100 rounded-full h-14 text-center text-lg font-medium placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="month" className="sr-only">Month</label>
                <input
                  id="month"
                  ref={monthInputRef}
                  value={monthStr}
                  type="text"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 2);
                    setMonthStr(v);
                    if (v.length === 2) setTimeout(() => yearInputRef.current?.focus(), 0);
                    setError('');
                  }}
                  onBlur={() => {
                    let num = parseInt(monthStr || '0', 10) || 1;
                    if (num < 1) num = 1;
                    if (num > 12) num = 12;
                    setMonthStr(String(num).padStart(2, '0'));
                  }}
                  inputMode="numeric"
                  maxLength={2}
                  className="mx-auto w-32 bg-gray-100 rounded-full h-14 text-center text-lg font-medium placeholder-gray-400"
                />
              </div>

              <div>
                <label htmlFor="year" className="sr-only">Year</label>
                <input
                  id="year"
                  ref={yearInputRef}
                  value={yearStr}
                  type="text"
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setYearStr(v);
                    setError('');
                  }}
                  onBlur={() => {
                    let num = parseInt(yearStr || String(year), 10) || year;
                    const min = CURRENT_YEAR - 100;
                    const max = CURRENT_YEAR;
                    if (num < min) num = min;
                    if (num > max) num = max;
                    setYearStr(String(num));
                  }}
                  inputMode="numeric"
                  maxLength={4}
                  className="mx-auto w-36 bg-gray-100 rounded-full h-14 text-center text-lg font-medium placeholder-gray-400"
                />
              </div>
            </div>
          </div>
        
        {age !== null && (
            <p className="text-2xl font-bold text-black mb-4">{age} years old</p>
        )}
        
        {error && (
          <p className="text-red-500 text-sm text-center">{error}</p>
        )}
          </div>
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