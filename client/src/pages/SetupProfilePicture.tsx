import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';

// --- Helper Functions (assuming these are in a utils file) ---
// Mocking these for stand-alone functionality
const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSizeInMB = 5;
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: 'Please select a valid image file (JPG, PNG, GIF).' };
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
      // In this new design, this button isn't active without a picture,
      // but the logic is kept for robustness.
      setError('Please select a profile picture.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Upload the profile picture using the actual API
      await apiService.uploadProfilePicture(selectedFile);
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      setError(err.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans p-6">
      <header className="flex-shrink-0 w-full max-w-md mx-auto">
        <div className="relative flex items-center justify-between h-10">
          <button onClick={() => navigate(-1)} className="text-gray-800 hover:text-black transition-colors">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <button onClick={handleSkip} className="text-gray-600 hover:text-black font-medium transition-colors">
            Skip
          </button>
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center w-full max-w-md mx-auto text-center">
        <h1 className="text-3xl font-bold text-black mb-12">Upload a Profile</h1>
        
        <div className="relative mb-6">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif"
            onChange={handleImageSelect}
            className="hidden"
          />
          <div 
            onClick={handleUploadClick}
            className="w-48 h-48 rounded-full bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden border border-gray-300"
          >
            {selectedImage ? (
                <img src={selectedImage} alt="Profile Preview" className="w-full h-full object-cover"/>
            ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-6xl font-thin">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </span>
                </div>
            )}
          </div>
          <button
              onClick={handleUploadClick}
              className="absolute bottom-0 right-0 w-10 h-10 bg-black text-white rounded-full flex items-center justify-center border-2 border-white shadow-md hover:bg-gray-800 transition-colors"
          >
              <PlusIcon className="w-6 h-6"/>
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

      </main>

      <footer className="flex-shrink-0 w-full max-w-md mx-auto mt-auto pt-6">
        <button
          onClick={handleContinue}
          disabled={!selectedFile || isLoading}
          className="w-full bg-black text-white font-bold py-4 px-8 rounded-full text-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors duration-300 shadow-lg shadow-black/20 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <span>{isLoading ? 'Uploading...' : 'Done'}</span>
          <span>🚀</span>
        </button>

        <p className="text-xs text-gray-400 text-center mt-4">
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </footer>
    </div>
  );
}

export default SetupProfilePicture;