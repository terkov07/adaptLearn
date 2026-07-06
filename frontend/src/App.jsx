import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Register from './pages/Register'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import Learn from './pages/Learn'
import Settings from './pages/Settings'
import History from './pages/History'
import SessionDetail from './pages/SessionDetail'
import Bookmarks from './pages/Bookmarks'
import Landing from './pages/Landing'
import Courses from './pages/Courses'
import CourseBuilder from './pages/CourseBuilder'
import CourseDetail from './pages/CourseDetail'



function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/learn" element={<Learn />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/history" element={<History />} />
          <Route path="/history/:id" element={<SessionDetail />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/new" element={<CourseBuilder />} />
          <Route path="/courses/:id" element={<CourseDetail />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App