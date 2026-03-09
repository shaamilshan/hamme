import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

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
      <div className="flex flex-col w-full max-w-md px-6 pt-16 pb-8">
        {/* Heading */}
        <motion.h1
          className="text-4xl font-bold text-white text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          What's your email? ✉️
        </motion.h1>

        {/* Input */}
        <motion.div
          className="mt-4"
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
            className="w-full rounded-2xl px-5 py-4 border-b-4 focus:outline-none transition-all text-base text-white"
            style={{
              backgroundColor: '#2C2C2E',
              borderBottomColor: '#906EF6',
              caretColor: '#906EF6',
            }}
          />
          {error && <p className="text-red-400 text-xs mt-2 text-center">{error}</p>}
        </motion.div>

        {/* Next button at bottom */}
        <div className="flex-grow" />
        <motion.button
          onClick={handleContinue}
          className="w-full text-white font-bold py-4 px-8 rounded-3xl text-lg mt-auto shadow-lg"
          style={{
            background: 'linear-gradient(to right, #A78BFA, #8B5CF6)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Next
        </motion.button>
      </div>
    </div>
  );
}

export default SetupEmail;
