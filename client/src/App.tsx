import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import './App.css'

// Lazy load all pages for code splitting and faster initial load
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Login = lazy(() => import('./pages/Login'))
const Signup = lazy(() => import('./pages/Signup'))
const SetupDOB = lazy(() => import('./pages/SetupDOB'))
const SetupProfilePicture = lazy(() => import('./pages/SetupProfilePicture'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Inbox = lazy(() => import('./pages/Inbox'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))

// Simple loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-violet-600">
    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
  </div>
)

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Onboarding />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/setup-dob" element={<SetupDOB />} />
          <Route path="/setup-profile-picture" element={<SetupProfilePicture />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/inbox" element={<Inbox />} />
          <Route path="/profile/:userId" element={<PublicProfile />} />
        </Routes>
      </Suspense>
    </Router>
  )
}

export default App