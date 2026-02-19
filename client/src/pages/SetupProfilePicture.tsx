import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { apiService } from '../services/api';

// --- Helper Functions ---
const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSizeInMB = 10;
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
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// --- SVG Icons ---
const ArrowLeftIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 12H5m7-7l-7 7 7 7" />
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
    } catch (err) {
      console.error('Error creating preview:', err);
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
      await apiService.uploadProfilePicture(selectedFile);
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (err: any) {
      clearInterval(interval);
      setUploadProgress(0);
      console.error('Error uploading profile picture:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload profile picture.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

        {/* Heading — centered */}
        <motion.h1
          className="text-[42px] leading-tight font-bold mt-4 text-center"
          style={{ color: '#906EF6' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
        >
          Add a face pic
        </motion.h1>

        {/* Everything centered in remaining space */}
        <div className="flex-grow flex flex-col items-center justify-center">
          {/* Tooltip hints */}
          <motion.div
            className="flex flex-col items-center gap-1.5 mb-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: 'easeOut' }}
          >
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-white text-xs font-bold tracking-widest uppercase"
              style={{ backgroundColor: '#2C2C2E' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              USE A RECENT PHOTO
            </div>
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-lg text-white text-xs font-bold tracking-widest uppercase"
              style={{ backgroundColor: '#2C2C2E' }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              CLEARLY SHOW YOUR FACE
            </div>
            {/* Triangle pointer down */}
            <div
              className="w-0 h-0"
              style={{
                borderLeft: '10px solid transparent',
                borderRight: '10px solid transparent',
                borderTop: '10px solid #2C2C2E',
              }}
            />
          </motion.div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />

          {/* Large purple upload circle */}
          <motion.button
            onClick={handleUploadClick}
            className="w-56 h-56 rounded-full flex items-center justify-center cursor-pointer overflow-hidden"
            style={{ backgroundColor: '#A78BFA' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.35, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-20 h-20 text-black">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            )}
          </motion.button>

          {/* Error */}
          {error && (
            <motion.p
              className="text-red-400 text-xs mt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          {/* Upload progress */}
          {(isLoading || uploadProgress > 0) && (
            <div className="w-56 mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2C2C2E' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: '#906EF6' }}
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
        </div>

        {/* Continue button after selecting / Skip */}
        {selectedFile ? (
          <motion.div
            className="mt-auto pt-6 flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-60"
              style={{ backgroundColor: '#906EF6' }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 text-black">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              )}
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            className="mt-auto pt-6 flex justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <button
              onClick={() => navigate('/dashboard')}
              className="text-sm font-medium transition-colors"
              style={{ color: 'rgba(255, 255, 255, 0.4)' }}
            >
              Skip for now
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default SetupProfilePicture;