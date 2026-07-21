import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Menu, X, User, LayoutDashboard, Grid3X3, Settings, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    setLoggingOut(true)
    await logout()
    setLoggingOut(false)
    setDropdownOpen(false)
    navigate('/')
  }

  const isActive = (path: string) => location.pathname === path

  const profileMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'My QR Codes', icon: Grid3X3, href: '/my-qr-codes' },
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '#', disabled: true },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'nav-blur' : 'bg-cream-bg/80'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <img
                src="/logo.png"
                alt="GenQR Logo"
                className="h-10 sm:h-11 w-auto object-contain"
              />
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <motion.div
            className="hidden md:flex items-center gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive('/dashboard')
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-secondary/50'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/my-qr-codes"
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive('/my-qr-codes')
                      ? 'bg-primary-light text-primary'
                      : 'text-text-secondary hover:text-text-primary hover:bg-secondary/50'
                  }`}
                >
                  My QR Codes
                </Link>

                {/* Profile Avatar Dropdown */}
                <div className="relative ml-2" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-secondary/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    aria-expanded={dropdownOpen}
                    aria-haspopup="true"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden ring-2 ring-border/50">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-text-secondary transition-transform duration-200 ${
                        dropdownOpen ? 'rotate-180' : ''
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        role="menu"
                        className="absolute right-0 mt-2 w-56 py-2 rounded-2xl card shadow-lg border-border"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-border">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {user.displayName || 'User'}
                          </p>
                          <p className="text-xs text-text-secondary truncate mt-0.5">
                            {user.email}
                          </p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          {profileMenu.map((item) => (
                            <button
                              key={item.label}
                              onClick={() => {
                                if (!item.disabled && item.href !== '#') {
                                  navigate(item.href)
                                  setDropdownOpen(false)
                                }
                              }}
                              disabled={item.disabled}
                              role="menuitem"
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors focus-visible:outline-none focus-visible:bg-secondary/50 ${
                                item.disabled
                                  ? 'text-text-secondary/40 cursor-not-allowed'
                                  : 'text-text-secondary hover:text-text-primary hover:bg-secondary/50'
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                              {item.disabled && (
                                <span className="ml-auto text-[10px] text-text-secondary/40">Soon</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-border pt-1">
                          <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-danger hover:bg-danger/10 transition-colors rounded-lg"
                          >
                            {loggingOut ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <LogOut className="w-4 h-4" />
                            )}
                            {loggingOut ? 'Logging out...' : 'Logout'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <a
                  href="#features"
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Features
                </a>
                <a
                  href="#generator"
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  Generator
                </a>
                <a href="#generator" className="btn-primary ml-3">
                  Get Started
                </a>
              </>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-secondary/50 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-cream-bg border-t border-border overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary/30 border border-border mb-3">
                    <div className="w-9 h-9 rounded-lg overflow-hidden ring-2 ring-border/50">
                      {user.photoURL ? (                          <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-primary flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">{user.displayName}</p>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-qr-codes"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    My QR Codes
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    Profile
                  </Link>
                  <hr className="border-border" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    Features
                  </a>
                  <a
                    href="#generator"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-secondary/50 rounded-lg transition-colors"
                  >
                    Generator
                  </a>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center btn-primary mt-3"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
