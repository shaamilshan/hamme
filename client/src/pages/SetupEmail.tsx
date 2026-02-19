import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
  </svg>
);

const ArrowRightIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

function SetupEmail() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const name = location.state?.name;
  const returnTo = location.state?.returnTo;

  // Redirect back if no name was provided
  if (!name) {
    navigate('/signup', { replace: true });
    return null;
  }

  const handleContinue = () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email');
      return;
    }
    navigate('/signup-password', { state: { name, email: email.trim(), returnTo } });
  };

  return (
    <div className="min-h-screen bg-black flex justify-center font-sans">
      <div className="flex flex-col w-full max-w-md px-6 pt-14 pb-6">
      {/* Back arrow */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <button onClick={() => navigate(-1)} className="text-white/80 hover:text-white transition-colors">
          <ArrowLeftIcon className="w-7 h-7" />
        </button>
      </motion.div>

      {/* Heading */}
      <motion.h1
        className="text-[42px] leading-tight font-bold mt-4"
        style={{ color: '#906EF6' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        What's your{'\n'}email?
      </motion.h1>

      {/* Input */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
      >
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
          autoFocus
          className="w-full rounded-2xl px-5 py-4 border-none focus:outline-none transition-shadow text-base"
          style={{
            backgroundColor: '#2C2C2E',
            color: '#fff',
            caretColor: '#906EF6',
          }}
        />
        {error && <p className="text-red-400 text-xs mt-2 ml-1">{error}</p>}
      </motion.div>

      {/* Arrow button — centered in remaining space */}
      <div className="flex-grow flex items-center justify-center">
        <motion.button
          onClick={handleContinue}
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#3A3A3C', color: '#8E8E93' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.3, ease: 'easeOut' }}
          whileHover={{ backgroundColor: '#906EF6', color: '#000' }}
          whileTap={{ scale: 0.9 }}
        >
          <ArrowRightIcon className="w-6 h-6" style={{ color: 'inherit' }} />
        </motion.button>
      </div>
      </div>
    </div>
  );
}

export default SetupEmail;
