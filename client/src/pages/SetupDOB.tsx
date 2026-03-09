import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

function SetupDOB() {
  const navigate = useNavigate();
  
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [age, setAge] = useState<number | null>(null);

  const calculateAge = (birthDate: Date): number => {
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    return calculatedAge;
  };

  const handleContinue = async () => {
    if (!dateOfBirth.trim()) {
      setError('Please enter your date of birth');
      return;
    }

    // Parse the date (expected format: DD / MM / YYYY)
    const parts = dateOfBirth.split('/').map(p => p.trim());
    if (parts.length !== 3) {
      setError('Please use the format DD / MM / YYYY');
      return;
    }

    const [dayStr, monthStr, yearStr] = parts;
    const day = parseInt(dayStr, 10);
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      setError('Please enter a valid date');
      return;
    }

    if (month < 1 || month > 12) {
      setError('Please enter a valid month (1-12)');
      return;
    }

    const maxDay = new Date(year, month, 0).getDate();
    if (day < 1 || day > maxDay) {
      setError('Please enter a valid day');
      return;
    }

    const birthDate = new Date(year, month - 1, day);
    const age = calculateAge(birthDate);

    if (age < 13) {
      setError('You must be at least 13 years old to use this app');
      return;
    }

    if (age > 100) {
      setError('Please enter a valid date of birth');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formattedDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      await apiService.updateDateOfBirth(formattedDate);
      navigate('/setup-instagram');
    } catch (err: any) {
      console.error('Error updating date of birth:', err);
      setError(err.response?.data?.message || 'Failed to save date of birth. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Remove any non-digit characters
    const numbersOnly = value.replace(/\D/g, '');
    
    // Auto-format with slashes as user types
    let formatted = '';
    if (numbersOnly.length > 0) {
      // Add day (DD)
      formatted = numbersOnly.substring(0, 2);
      
      if (numbersOnly.length >= 3) {
        // Add month (MM)
        formatted += ' / ' + numbersOnly.substring(2, 4);
      }
      
      if (numbersOnly.length >= 5) {
        // Add year (YYYY)
        formatted += ' / ' + numbersOnly.substring(4, 8);
      }
    }
    
    setDateOfBirth(formatted);
    setError('');
    
    // Calculate age if we have a complete date
    if (numbersOnly.length === 8) {
      const day = parseInt(numbersOnly.substring(0, 2), 10);
      const month = parseInt(numbersOnly.substring(2, 4), 10);
      const year = parseInt(numbersOnly.substring(4, 8), 10);
      
      // Validate the date
      if (month >= 1 && month <= 12) {
        const maxDay = new Date(year, month, 0).getDate();
        if (day >= 1 && day <= maxDay) {
          const birthDate = new Date(year, month - 1, day);
          const calculatedAge = calculateAge(birthDate);
          setAge(calculatedAge);
          return;
        }
      }
    }
    
    // Clear age if date is incomplete or invalid
    setAge(null);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between px-6 py-16">
      <div className="w-full max-w-md flex-grow flex flex-col">
        {/* Heading */}
        <motion.h1
          className="text-4xl font-bold text-white text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          What's your birthday? 🎂
        </motion.h1>

        {/* Input field */}
        <motion.div
          className="w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <input
            type="text"
            value={dateOfBirth}
            onChange={handleInputChange}
            placeholder="DD / MM / YYYY"
            maxLength={18}
            className="w-full bg-transparent text-white text-center text-lg px-5 py-4 rounded-2xl border-b-4 focus:outline-none"
            style={{
              backgroundColor: '#2C2C2E',
              borderColor: '#906EF6',
            }}
          />
          {error && (
            <p className="text-red-400 text-sm text-center mt-2">{error}</p>
          )}
        </motion.div>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Age confirmation message */}
        {age !== null && !error && (
          <motion.p
            className="text-white/60 text-sm text-center mb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            You're {age} years old. You cannot change this later.
          </motion.p>
        )}

        {/* Next button at bottom */}
        <motion.button
          onClick={handleContinue}
          disabled={isLoading}
          className="w-full text-white font-bold py-4 px-8 rounded-3xl text-lg shadow-lg disabled:opacity-60"
          style={{
            background: 'linear-gradient(to right, #A78BFA, #8B5CF6)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? 'Saving...' : 'Next'}
        </motion.button>
      </div>
    </div>
  );
}

export default SetupDOB;
