import logo from '../../assets/Hamme-logo.png'

function Loader() {
  return (
    <div className="w-full flex items-center justify-center py-10">
      <div className="relative">
        <img
          src={logo}
          alt="Hamme"
          className="h-12 w-auto filter grayscale animate-pulse"
          style={{ animationDuration: '1200ms' }}
        />
        {/* Color overlay fade-in */}
        <img
          src={logo}
          alt="Hamme colored"
          className="h-12 w-auto absolute inset-0 opacity-0 animate-[fadeInOut_1.2s_ease-in-out_infinite]"
        />
        <style>
          {`
            @keyframes fadeInOut {
              0% { opacity: 0; }
              50% { opacity: 1; }
              100% { opacity: 0; }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default Loader
