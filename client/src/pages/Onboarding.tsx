import { useNavigate } from 'react-router-dom';

function Onboarding() {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    // Removed padding by changing p-8 to p-0
    <div className="min-h-screen bg-violet-600 flex flex-col items-center justify-between px-0 py-8 relative overflow-hidden font-sans">
      
      {/* Decorative Floating Icons */}
      {/* NOTE: These are emoji placeholders. For a production app, you should replace these 
          spans with actual 3D icon image files (.svg or .png) for the best visual quality. */}
      <div aria-hidden="true" className="absolute inset-0 z-0">
        <div className="absolute top-[20%] left-[10%] sm:left-[20%] transform -rotate-12">
          <span className="text-6xl md:text-7xl opacity-90">💬</span>
        </div>
        <div className="absolute top-[15%] right-[10%] sm:right-[20%] transform rotate-12">
          <span className="text-6xl md:text-7xl opacity-90">❤️</span>
        </div>
        <div className="absolute top-[58%] left-1/2 -translate-x-1/2">
          <span className="text-6xl md:text-7xl opacity-90">🚫</span>
        </div>
      </div>
      
      {/* Main Content Area */}
      {/* We use flex-grow to push the content to the vertical center. */}
      <div className="flex-grow flex items-center justify-center z-10">
        {/* Logo */}
        {/* NOTE: This is a CSS approximation of the logo. Using an SVG or image file 
            is highly recommended to perfectly match the font and layered sticker effect. */}
        <div className="text-center">
            <h1 
            className="text-8xl md:text-9xl font-black transform -rotate-[6deg] text-white tracking-tighter"
            style={{ textShadow: '-3px -3px 0 #000, 3px -3px 0 #000, -3px 3px 0 #000, 3px 3px 0 #000' }}
            >
            HAMME
            </h1>
        </div>
      </div>

      {/* Bottom section with button and legal text */}
      <div className="w-full max-w-sm text-center z-10 mb-10 md:mb-0">
        <button 
          onClick={handleGetStarted}
          className="w-full bg-black text-white font-bold py-4 px-6 rounded-full text-lg flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors duration-300 shadow-lg shadow-black/30"
        >
          <span>Get Started</span>
          <span className="text-yellow-400">⚡️</span>
        </button>

        <p className="text-white/70 text-xs mt-4">
          By continuing, you agree to our Terms of Use and have
          read and agreed to our Privacy Policy
        </p>
      </div>
    </div>
  );
}

export default Onboarding;