import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Onboarding, Login, Signup, SetupDOB, SetupProfilePicture, Dashboard, Inbox, PublicProfile } from './pages'
import './App.css'

function App() {
  return (
    <Router>
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
    </Router>
  )
}

export default App