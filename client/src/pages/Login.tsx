import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// A simple SVG component for the back arrow
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);


function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-white flex flex-col font-sans p-6">
      <header className="flex-shrink-0 w-full max-w-md mx-auto">
        <div className="relative flex items-center justify-center h-10">
          <button onClick={() => navigate(-1)} className="absolute left-0 text-gray-800 hover:text-black transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-bold text-black">Login</h1>
        </div>
      </header>

      <main className="flex-grow flex flex-col justify-center w-full max-w-md mx-auto">
        <form id="login-form" onSubmit={handleSubmit} className="w-full">
          <div className="space-y-4">
            {/* Email Input */}
            <div>
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full bg-gray-200 text-gray-900 placeholder-gray-500 rounded-full px-6 py-4 text-center border-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow"
                required
              />
              {errors.email && <p className="text-red-500 text-xs text-center mt-1">{errors.email}</p>}
            </div>
            {/* Password Input */}
            <div>
              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                className="w-full bg-gray-200 text-gray-900 placeholder-gray-500 rounded-full px-6 py-4 text-center border-none focus:outline-none focus:ring-2 focus:ring-purple-400 transition-shadow"
                required
              />
              {errors.password && <p className="text-red-500 text-xs text-center mt-1">{errors.password}</p>}
            </div>
          </div>

          {errors.submit && (
            <div className="text-red-500 text-sm text-center pt-4">{errors.submit}</div>
          )}

          <p className="text-center text-gray-600 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-purple-600 hover:text-purple-800 font-semibold">
              Sign Up
            </Link>
          </p>
        </form>
      </main>

      <footer className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6 mb-8 md:mb-10">
        <button
          type="submit"
          form="login-form"
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 px-8 rounded-full text-lg hover:opacity-90 transition-opacity duration-300 shadow-lg shadow-purple-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Continuing...' : 'Continue'}
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </footer>
    </div>
  )
}

export default Login;