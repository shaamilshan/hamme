import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

function Onboarding() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-between p-8 relative overflow-hidden font-sans">

      {/* Decorative Floating Icons */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <motion.div
          className="absolute top-[20%] left-[10%] sm:left-[20%] transform -rotate-12"
          initial={{ opacity: 0, scale: 0, rotate: -30 }}
          animate={{ opacity: 0.9, scale: 1, rotate: -12 }}
          transition={{ duration: 0.6, delay: 0.5, type: 'spring', stiffness: 200 }}
        >
          <motion.span
            className="text-6xl md:text-7xl block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            💬
          </motion.span>
        </motion.div>

        <motion.div
          className="absolute top-[15%] right-[10%] sm:right-[20%] transform rotate-12"
          initial={{ opacity: 0, scale: 0, rotate: 30 }}
          animate={{ opacity: 0.9, scale: 1, rotate: 12 }}
          transition={{ duration: 0.6, delay: 0.7, type: 'spring', stiffness: 200 }}
        >
          <motion.span
            className="text-6xl md:text-7xl block"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          >
            ❤️
          </motion.span>
        </motion.div>

        <motion.div
          className="absolute top-[58%] left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 0.9, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.9, type: 'spring', stiffness: 200 }}
        >
          <motion.span
            className="text-6xl md:text-7xl block"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          >
            🚫
          </motion.span>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex items-center justify-center z-10">
        <div className="text-center">
          <motion.h1
            className="text-8xl md:text-9xl font-black transform -rotate-[6deg] tracking-tighter"
            style={{ color: '#906EF6', textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000' }}
            initial={{ opacity: 0, scale: 0.5, rotate: 0 }}
            animate={{ opacity: 1, scale: 1, rotate: -6 }}
            transition={{ duration: 0.8, delay: 0.2, type: 'spring', stiffness: 150, damping: 12 }}
          >
            HAMME
          </motion.h1>
        </div>
      </div>

      {/* Bottom section with button and legal text */}
      <motion.div
        className="w-full max-w-sm text-center z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1, ease: 'easeOut' }}
      >
        <motion.button
          onClick={handleGetStarted}
          className="w-full font-bold py-4 px-6 rounded-full text-lg flex items-center justify-center space-x-2 transition-colors duration-300 shadow-lg"
          style={{ backgroundColor: '#906EF6', color: '#fff' }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          <span>Get Started</span>
          <span>⚡️</span>
        </motion.button>

        <p className="text-xs mt-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </motion.div>
    </div>
  );
}
export default Onboarding