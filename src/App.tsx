import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import AuthGuard from './components/AuthGuard'
import Home from './pages/Home'

// Lazy load auth-protected pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const MyQRCodes = lazy(() => import('./pages/MyQRCodes'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700/50" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/dashboard"
            element={
              <AuthGuard>
                <Dashboard />
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard>
                <Profile />
              </AuthGuard>
            }
          />
          <Route
            path="/my-qr-codes"
            element={
              <AuthGuard>
                <MyQRCodes />
              </AuthGuard>
            }
          />
        </Routes>
      </Suspense>
    </div>
  )
}
