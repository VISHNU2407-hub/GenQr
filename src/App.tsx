import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import AuthGuard from './components/AuthGuard'
import Home from './pages/Home'
import { RefreshProvider } from './contexts/RefreshContext'

// Lazy load auth-protected pages
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Profile = lazy(() => import('./pages/Profile'))
const MyQRCodes = lazy(() => import('./pages/MyQRCodes'))

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-bg">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-secondary/50" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="text-text-secondary text-sm font-medium">Loading...</p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-cream-bg">
      <RefreshProvider>
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
      </RefreshProvider>
    </div>
  )
}
