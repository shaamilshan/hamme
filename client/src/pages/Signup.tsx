import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

// A simple SVG component for the back arrow
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);


function Signup() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get return URL from location state
  const returnTo = location.state?.returnTo;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await apiService.register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password
      });

      // Store the JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      console.log('Registration successful!');
      if (returnTo) {
        navigate(returnTo);
      } else {
        navigate('/setup-dob');
      }
    } catch (error: any) {
      console.error('Registration failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: 'rgba(144, 110, 246, 0.1)',
    color: '#fff',
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans p-6">
      <motion.header
        className="flex-shrink-0 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="relative flex items-center justify-center h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 text-white/70 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold" style={{ color: '#906EF6' }}>Sign Up</h1>
        </div>
      </motion.header>

      <main className="flex-grow flex flex-col justify-center w-full max-w-md mx-auto">
        <form id="signup-form" onSubmit={handleSubmit} className="w-full">
          <div className="space-y-4">
            {/* Name Input */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              <input
                name="name"
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full rounded-full px-6 py-4 text-center border-none focus:outline-none focus:ring-2 transition-shadow placeholder-white/40"
                style={inputStyle}
                required
              />
              {errors.name && <p className="text-red-400 text-xs text-center mt-1">{errors.name}</p>}
            </motion.div>
            {/* Email Input */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
            >
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                className="w-full rounded-full px-6 py-4 text-center border-none focus:outline-none focus:ring-2 transition-shadow placeholder-white/40"
                style={inputStyle}
                required
              />
              {errors.email && <p className="text-red-400 text-xs text-center mt-1">{errors.email}</p>}
            </motion.div>
            {/* Password Input */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' }}
            >
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyDown={handleKeyDown}
                  className="w-full rounded-full px-6 py-4 text-center border-none focus:outline-none focus:ring-2 transition-shadow placeholder-white/40"
                  style={inputStyle}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs text-center mt-1">{errors.password}</p>}
            </motion.div>
          </div>

          {errors.submit && (
            <div className="text-red-400 text-sm text-center pt-4">{errors.submit}</div>
          )}

          <motion.p
            className="text-center text-white/60 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.55 }}
          >
            Already have an account?{' '}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: '#906EF6' }}>
              Login
            </Link>
          </motion.p>
        </form>
      </main>

      <motion.footer
        className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6 mb-8 md:mb-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.65, ease: 'easeOut' }}
      >
        <motion.button
          type="submit"
          form="signup-form"
          disabled={loading}
          className="w-full text-white font-bold py-4 px-8 rounded-full text-lg transition-opacity duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#906EF6', boxShadow: '0 10px 30px rgba(144, 110, 246, 0.3)' }}
          whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' }}
          whileTap={{ scale: 0.97 }}
        >
          {loading ? 'Continuing...' : 'Continue'}
        </motion.button>

        <p className="text-xs text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </motion.footer>
    </div>
  )
}

export default Signup;