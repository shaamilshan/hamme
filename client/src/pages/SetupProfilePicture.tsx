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
    <div className="min-h-screen bg-black flex flex-col items-center justify-between px-6 py-16">
      <div className="w-full max-w-md flex-grow flex flex-col">
        {/* Heading */}
        <motion.h1
          className="text-4xl font-bold text-white text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          Add a profile picture 🔥
        </motion.h1>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />

        {/* Image preview container */}
        <motion.div
          className="flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <button
            onClick={handleUploadClick}
            className="relative w-72 h-96 rounded-3xl overflow-hidden cursor-pointer"
            style={{ 
              boxShadow: '0 0 0 3px #906EF6',
            }}
          >
            {selectedImage ? (
              <img src={selectedImage} alt="Profile Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  strokeWidth={2} 
                  stroke="currentColor" 
                  className="w-20 h-20 text-gray-600"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
              </div>
            )}
          </button>
        </motion.div>

        {/* Error */}
        {error && (
          <motion.p
            className="text-red-400 text-sm text-center mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {error}
          </motion.p>
        )}

        {/* Upload progress */}
        {(isLoading || uploadProgress > 0) && (
          <div className="w-72 mx-auto mt-4 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#2C2C2E' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: '#906EF6' }}
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-grow" />

        {/* Info text */}
        <motion.p
          className="text-white/40 text-sm text-center mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          Your face should be visible in the picture.
        </motion.p>

        {/* Next button */}
        <motion.button
          onClick={handleContinue}
          disabled={isLoading || !selectedFile}
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
          {isLoading ? 'Uploading...' : 'Next'}
        </motion.button>
      </div>
    </div>
  );
}

export default SetupProfilePicture;