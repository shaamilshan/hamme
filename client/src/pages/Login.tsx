import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
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
      const response = await apiService.login({
        email: formData.email.trim(),
        password: formData.password
      });

      // Store the JWT token
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
      }

      // Navigate immediately after successful login
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login failed:', error);
      setErrors({
        submit: error.response?.data?.message || 'Login failed. Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
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
          Welcome back 👋
        </motion.h1>

        {/* Email Input */}
        <motion.div
          className="w-full mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-white text-center text-lg px-5 py-4 rounded-2xl border-b-4 focus:outline-none"
            style={{
              backgroundColor: '#2C2C2E',
              borderColor: '#906EF6',
            }}
          />
          {errors.email && <p className="text-red-400 text-sm text-center mt-2">{errors.email}</p>}
        </motion.div>

        {/* Password Input */}
        <motion.div
          className="w-full mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="relative">
            <input
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-white text-center text-lg px-5 py-4 rounded-2xl border-b-4 focus:outline-none"
              style={{
                backgroundColor: '#2C2C2E',
                borderColor: '#906EF6',
              }}
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
          {errors.password && <p className="text-red-400 text-sm text-center mt-2">{errors.password}</p>}
        </motion.div>

        {/* Error message */}
        {errors.submit && (
          <p className="text-red-400 text-sm text-center mb-4">{errors.submit}</p>
        )}

        {/* Sign up link */}
        <motion.p
          className="text-center text-white/60 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          Don't have an account?{' '}
          <Link to="/signup" className="text-white underline">
            Sign up
          </Link>
        </motion.p>

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Next button */}
        <motion.button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full text-white font-bold py-4 px-8 rounded-3xl text-lg shadow-lg disabled:opacity-60"
          style={{
            background: 'linear-gradient(to right, #A78BFA, #8B5CF6)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </motion.button>
      </div>
    </div>
  )
}

export default Login;