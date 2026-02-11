import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

// --- Helper Functions ---
const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeInMB = 10; // Allow larger originals, we'll compress
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid image file (JPG, PNG, WebP).' };
  }
  if (file.size > maxSizeInMB * 1024 * 1024) {
    return { isValid: false, error: `File size cannot exceed ${maxSizeInMB}MB.` };
  }
  return { isValid: true };
};

const createFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};


// --- SVG Icons ---
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);


// --- Main Component ---

function SetupProfilePicture() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  // --- LOGIC (Preserved from original component) ---

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setError('');
    setSelectedFile(file);

    try {
      const previewUrl = await createFilePreview(file);
      setSelectedImage(previewUrl);
    } catch (error) {
      console.error('Error creating preview:', error);
      setError('Failed to create image preview');
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleContinue = async () => {
    if (!selectedFile) {
      setError('Please select a profile picture.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 300);

    try {
      // Upload the profile picture
      // The apiService.uploadProfilePicture method expects a File object
      await apiService.uploadProfilePicture(selectedFile);

      clearInterval(interval);
      setUploadProgress(100);

      // Short delay to show 100% before navigating
      setTimeout(() => {
        navigate('/dashboard');
      }, 500);

    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      console.error('Error uploading profile picture:', err);
      // More robust error handling
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile picture.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans p-6 text-white">
      <motion.header
        className="flex-shrink-0 w-full max-w-md mx-auto"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="relative flex items-center justify-between h-14">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <div className="flex-1" />
          {/* step indicator */}
          <div className="w-24 h-1 rounded-full bg-white/20">
            <div className="h-1 w-full rounded-full" style={{ backgroundColor: '#906EF6' }} />
          </div>
        </div>
      </motion.header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
        <motion.h1
          className="text-3xl font-bold mb-12"
          style={{ color: '#906EF6' }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Upload a Profile
        </motion.h1>

        <motion.div
          className="relative mb-6 group"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3, type: 'spring', stiffness: 200, damping: 20 }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div
            onClick={handleUploadClick}
            className="w-48 h-48 rounded-full flex items-center justify-center cursor-pointer overflow-hidden border-2 relative z-10"
            style={{
              backgroundColor: 'rgba(144, 110, 246, 0.1)',
              borderColor: selectedImage ? '#906EF6' : 'rgba(144, 110, 246, 0.3)'
            }}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30 hover:text-white/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            )}
          </div>

          {/* Pulsing ring behind the avatar */}
          <div className="absolute inset-0 rounded-full animate-pulse z-0" style={{ boxShadow: '0 0 30px rgba(144, 110, 246, 0.2)' }}></div>

          <motion.button
            onClick={handleUploadClick}
            className="absolute bottom-2 right-2 w-12 h-12 text-white rounded-full flex items-center justify-center shadow-lg transition-colors z-20"
            style={{ backgroundColor: '#906EF6', border: '3px solid black' }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PlusIcon className="w-6 h-6" />
          </motion.button>
        </motion.div>

        {error &&
          <motion.p
            className="text-red-400 text-sm mt-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        }

        <motion.button
          onClick={handleSkip}
          className="mt-8 text-sm font-medium hover:underline transition-all"
          style={{ color: 'rgba(255, 255, 255, 0.5)' }}
          whileHover={{ color: '#fff' }}
        >
          Skip for now
        </motion.button>

      </main>

      <motion.footer
        className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6, ease: 'easeOut' }}
      >
        <motion.button
          onClick={handleContinue}
          disabled={!selectedFile || isLoading}
          className="w-full text-white font-bold py-4 px-8 rounded-full text-lg flex items-center justify-center space-x-2 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            backgroundColor: !selectedFile ? '#333' : '#906EF6',
            boxShadow: !selectedFile ? 'none' : '0 10px 30px rgba(144, 110, 246, 0.3)'
          }}
          whileHover={selectedFile ? { scale: 1.03, boxShadow: '0 0 25px rgba(144, 110, 246, 0.5)' } : {}}
          whileTap={selectedFile ? { scale: 0.97 } : {}}
        >
          <span>{isLoading ? 'Uploading...' : 'Done'}</span>
          <span>🚀</span>
        </motion.button>

        {/* Upload Progress Bar */}
        {(isLoading || uploadProgress > 0) && (
          <div className="w-full mt-4 h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#906EF6' }}
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        <p className="text-xs text-center mt-4" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </motion.footer>
    </div>
  );
}

export default SetupProfilePicture;