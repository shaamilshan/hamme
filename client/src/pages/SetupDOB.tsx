import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// --- Helper Hooks and Data ---

// (Removed wheel helper — using native inputs/selects instead)

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
  
  // --- UI: keyboard-friendly inputs for Day / Month / Year ---
  // Helpers for calendar input
  const dobRef = useRef<HTMLInputElement | null>(null);
  const calendarRef = useRef<HTMLDivElement | null>(null);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const formatInputDate = (y: number, m: number, d: number) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const maxSelectableDate = (() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 13); // enforce minimum age of 13 via max date
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const minSelectableDate = `${CURRENT_YEAR - 100}-01-01`;


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

          {/* Calendar picker (native date input) */}
          <div className="w-full relative my-4">
            <label htmlFor="dob" className="sr-only">Date of birth</label>
            <div className="relative">
              <div
                className="absolute inset-y-0 left-3 flex items-center cursor-pointer z-20"
                onClick={() => setShowCalendar((s) => !s)}
                role="button"
                aria-label="Open date picker"
              >
                {/* calendar icon */}
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M3 11h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              {/* Text input showing formatted date; clicking focuses and toggles calendar */}
              <input
                id="dob"
                ref={dobRef}
                type="text"
                onClick={() => setShowCalendar(true)}
                value={formatInputDate(year, month, day)}
                readOnly
                className="w-full pl-12 pr-4 text-center text-lg font-medium border border-gray-200 rounded-xl py-3 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-300"
                aria-label="Date of birth"
              />

              {/* Calendar popover */}
              {showCalendar && (
                <div
                  ref={calendarRef}
                  className="absolute top-full left-0 mt-3 bg-white rounded-lg shadow-lg p-4 z-30 w-80"
                >
                  <Calendar
                    year={year}
                    month={month}
                    minDate={minSelectableDate}
                    maxDate={maxSelectableDate}
                    onMonthChange={(y, m) => { setYear(y); setMonth(m); }}
                    onPick={(y, m, d) => {
                      setYear(y); setMonth(m); setDay(d); setShowCalendar(false);
                    }}
                  />
                </div>
              )}
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

// ----------------------
// Inline Calendar component
// ----------------------
interface CalendarProps {
  year: number;
  month: number; // 1-12
  minDate: string; // 'YYYY-MM-DD'
  maxDate: string;
  onMonthChange: (year: number, month: number) => void;
  onPick: (year: number, month: number, day: number) => void;
}

const Calendar: React.FC<CalendarProps> = ({ year, month, minDate, maxDate, onMonthChange, onPick }) => {
  const [viewYear, setViewYear] = useState<number>(year);
  const [viewMonth, setViewMonth] = useState<number>(month);

  useEffect(() => { setViewYear(year); setViewMonth(month); }, [year, month]);

  const startOfMonth = (y: number, m: number) => new Date(y, m - 1, 1);
  const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

  const genWeeks = (y: number, m: number) => {
    const first = startOfMonth(y, m);
    const startDay = first.getDay(); // 0 (Sun) - 6
    const total = daysInMonth(y, m);
    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = [];
    // Fill initial blanks (Sun-start)
    for (let i = 0; i < startDay; i++) week.push(null);
    for (let d = 1; d <= total; d++) {
      week.push(d);
      if (week.length === 7) { weeks.push(week); week = []; }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  };

  const isBefore = (y: number, m: number, d: number, iso: string) => {
    const t = new Date(iso + 'T00:00:00');
    return new Date(y, m - 1, d) < t;
  };
  const isAfter = (y: number, m: number, d: number, iso: string) => {
    const t = new Date(iso + 'T23:59:59');
    return new Date(y, m - 1, d) > t;
  };

  const weeks = genWeeks(viewYear, viewMonth);

  const prev = () => {
    let ny = viewYear; let nm = viewMonth - 1;
    if (nm < 1) { nm = 12; ny -= 1; }
    setViewYear(ny); setViewMonth(nm);
    onMonthChange(ny, nm);
  };
  const next = () => {
    let ny = viewYear; let nm = viewMonth + 1;
    if (nm > 12) { nm = 1; ny += 1; }
    setViewYear(ny); setViewMonth(nm);
    onMonthChange(ny, nm);
  };

  const monthName = (m: number) => new Date(2000, m - 1, 1).toLocaleString(undefined, { month: 'long' });

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 rounded hover:bg-gray-100">◀</button>
        <div className="text-sm font-medium">{monthName(viewMonth)} {viewYear}</div>
        <button onClick={next} className="p-1 rounded hover:bg-gray-100">▶</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs text-center text-gray-500 mb-2">
        {['S','M','T','W','T','F','S'].map((d) => (<div key={d}>{d}</div>))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, wi) => (
          <React.Fragment key={wi}>
            {week.map((d, di) => {
              if (d === null) return <div key={di} className="py-2" />;
              const disabled = isBefore(viewYear, viewMonth, d, minDate) || isAfter(viewYear, viewMonth, d, maxDate);
              return (
                <button
                  key={di}
                  onClick={() => !disabled && onPick(viewYear, viewMonth, d)}
                  disabled={disabled}
                  className={`py-2 rounded ${disabled ? 'text-gray-300' : 'hover:bg-indigo-50'} `}
                >
                  {d}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};