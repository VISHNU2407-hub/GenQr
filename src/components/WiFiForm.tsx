import { Wifi, Key, Shield } from 'lucide-react'
import type { QRFormData } from '../utils/qr'

interface WiFiFormProps {
  data: QRFormData
  onChange: (data: QRFormData) => void
}

const securityOptions: { value: QRFormData['security']; label: string }[] = [
  { value: 'WPA', label: 'WPA/WPA2' },
  { value: 'WEP', label: 'WEP' },
  { value: 'none', label: 'None' },
]

export default function WiFiForm({ data, onChange }: WiFiFormProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Wifi className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="text"
          value={data.ssid ?? ''}
          onChange={(e) => onChange({ ...data, ssid: e.target.value })}
          placeholder="Network name (SSID)"
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
          aria-label="WiFi SSID"
        />
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Key className="w-5 h-5 text-slate-500" />
        </div>
        <input
          type="password"
          value={data.password ?? ''}
          onChange={(e) => onChange({ ...data, password: e.target.value })}
          placeholder="Password"
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 outline-none transition-all duration-200 input-glow focus:border-primary/40"
          aria-label="WiFi password"
        />
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <Shield className="w-5 h-5 text-slate-500" />
        </div>
        <select
          value={data.security ?? 'WPA'}
          onChange={(e) => onChange({ ...data, security: e.target.value as QRFormData['security'] })}
          className="w-full pl-12 pr-10 py-4 bg-white/5 border border-white/10 rounded-xl text-white outline-none transition-all duration-200 input-glow focus:border-primary/40 appearance-none cursor-pointer"
          aria-label="WiFi security type"
        >
          {securityOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dark-card text-white">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-slate-500"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </div>
  )
}
