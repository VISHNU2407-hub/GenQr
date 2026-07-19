import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { QrCode, Menu, X, User, LayoutDashboard, Grid3X3, Settings, LogOut, Loader2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
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

  // Close dropdown on outside click
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

  const profileMenu = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'My QR Codes', icon: Grid3X3, href: '/my-qr-codes' },
    { label: 'Profile', icon: User, href: '/profile' },
    { label: 'Settings', icon: Settings, href: '#', disabled: true },
  ]

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'glass-nav shadow-[0_1px_3px_0_rgba(0,0,0,0.3)]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group"
          >
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2.5"
            >
              <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-semibold tracking-tight text-white">
                GenQR
              </span>
            </motion.div>
          </Link>

          {/* Desktop Nav */}
          <motion.div
            className="hidden md:flex items-center gap-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 relative group"
                >
                  Dashboard
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
                </Link>
                <Link
                  to="/my-qr-codes"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 relative group"
                >
                  My QR Codes
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
                </Link>

                {/* Profile Avatar Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 p-1 rounded-xl hover:bg-white/5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-xl overflow-hidden ring-2 ring-white/10 hover:ring-primary/30 transition-all">
                      {user.photoURL ? (
                        <img
                          src={user.photoURL}
                          alt={user.displayName || 'Profile'}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <svg
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
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

                  {/* Dropdown */}
                  <AnimatePresence>
                    {dropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-56 py-2 rounded-2xl glass-card shadow-xl border border-white/10"
                      >
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-white/5">
                          <p className="text-sm font-medium text-white truncate">
                            {user.displayName || 'User'}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
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
                              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                                item.disabled
                                  ? 'text-slate-600 cursor-not-allowed'
                                  : 'text-slate-300 hover:text-white hover:bg-white/5'
                              }`}
                            >
                              <item.icon className="w-4 h-4" />
                              {item.label}
                              {item.disabled && (
                                <span className="ml-auto text-[10px] text-slate-600">Soon</span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Logout */}
                        <div className="border-t border-white/5 pt-1">
                          <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
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
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 relative group"
                >
                  Features
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#generator"
                  className="text-sm font-medium text-slate-300 hover:text-white transition-colors duration-200 relative group"
                >
                  Generator
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-accent transition-all duration-300 group-hover:w-full" />
                </a>
                <a
                  href="#generator"
                  className="btn-primary text-sm px-5 py-2.5"
                >
                  Get Started
                </a>
              </>
            )}
          </motion.div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
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
            className="md:hidden glass-nav border-t border-white/5 overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {user ? (
                <>
                  {/* Mobile user info */}
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/5 mb-2">
                    <div className="w-9 h-9 rounded-xl overflow-hidden ring-2 ring-white/10">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </div>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/my-qr-codes"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    My QR Codes
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Profile
                  </Link>
                  <hr className="border-white/5" />
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <a
                    href="#features"
                    onClick={() => setMobileOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Features
                  </a>
                  <Link
                    to="/"
                    onClick={() => setMobileOpen(false)}
                    className="block text-center btn-primary text-sm px-5 py-2.5 mt-2"
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
