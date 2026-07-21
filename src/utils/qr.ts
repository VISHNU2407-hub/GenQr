import { type LucideIcon, Globe, Wifi, Briefcase, Mail, Phone, MessageSquare, MessageCircle, MapPin, Calendar, UtensilsCrossed, Palette, FileText, Heart, Eye, Smartphone, Link, Files } from 'lucide-react'

// ─── Template Definitions ─────────────────────────────

export type TemplateId =
  | 'website'
  | 'wifi'
  | 'business-card'
  | 'email'
  | 'phone'
  | 'sms'
  | 'text'
  | 'whatsapp'
  | 'location'
  | 'event'
  | 'restaurant-menu'
  | 'portfolio'
  | 'social-media'
  | 'batch-qr'

export interface TemplateField {
  key: string
  label: string
  type: 'text' | 'url' | 'tel' | 'email' | 'number' | 'textarea' | 'select'
  placeholder: string
  required: boolean
  options?: { value: string; label: string }[]
}

export interface TemplateInfo {
  id: TemplateId
  label: string
  description: string
  icon: LucideIcon
  color: string
  fields: TemplateField[]
}

const SOCIAL_PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'github', label: 'GitHub' },
  { value: 'pinterest', label: 'Pinterest' },
  { value: 'other', label: 'Other URL' },
]

export const TEMPLATES: TemplateInfo[] = [
  {
    id: 'website',
    label: 'Website',
    description: 'Link to any website or landing page',
    icon: Globe,
    color: '#3B82F6',
    fields: [
      { key: 'url', label: 'URL', type: 'url', placeholder: 'https://example.com', required: true },
    ],
  },
  {
    id: 'wifi',
    label: 'WiFi',
    description: 'Share WiFi network credentials',
    icon: Wifi,
    color: '#10B981',
    fields: [
      { key: 'ssid', label: 'Network Name (SSID)', type: 'text', placeholder: 'My WiFi Network', required: true },
      { key: 'password', label: 'Password', type: 'text', placeholder: 'WiFi password', required: false },
      { key: 'security', label: 'Security Type', type: 'select', placeholder: '', required: false, options: [{ value: 'WPA', label: 'WPA/WPA2' }, { value: 'WEP', label: 'WEP' }, { value: 'none', label: 'None (Open)' }] },
      { key: 'hidden', label: 'Hidden Network', type: 'select', placeholder: '', required: false, options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }] },
    ],
  },
  {
    id: 'business-card',
    label: 'Business Card',
    description: 'Digital vCard with contact details',
    icon: Briefcase,
    color: '#8B5CF6',
    fields: [
      { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John Doe', required: true },
      { key: 'company', label: 'Company', type: 'text', placeholder: 'Acme Inc.', required: false },
      { key: 'jobTitle', label: 'Job Title', type: 'text', placeholder: 'Software Engineer', required: false },
      { key: 'phone', label: 'Phone', type: 'tel', placeholder: '+1234567890', required: false },
      { key: 'email', label: 'Email', type: 'email', placeholder: 'john@example.com', required: false },
      { key: 'website', label: 'Website', type: 'url', placeholder: 'https://example.com', required: false },
      { key: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City', required: false },
    ],
  },
  {
    id: 'email',
    label: 'Email',
    description: 'Pre-composed email message',
    icon: Mail,
    color: '#EF4444',
    fields: [
      { key: 'email', label: 'Recipient Email', type: 'email', placeholder: 'recipient@example.com', required: true },
      { key: 'subject', label: 'Subject', type: 'text', placeholder: 'Meeting Request', required: false },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Hi, I would like to...', required: false },
    ],
  },
  {
    id: 'phone',
    label: 'Phone',
    description: 'Call a phone number',
    icon: Phone,
    color: '#F59E0B',
    fields: [
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
    ],
  },
  {
    id: 'sms',
    label: 'SMS',
    description: 'Pre-written text message',
    icon: MessageSquare,
    color: '#06B6D4',
    fields: [
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { key: 'message', label: 'Message', type: 'textarea', placeholder: 'Hey, are you free?', required: false },
    ],
  },
  {
    id: 'whatsapp',
    label: 'WhatsApp',
    description: 'Start a WhatsApp chat',
    icon: MessageCircle,
    color: '#25D366',
    fields: [
      { key: 'phone', label: 'Phone Number', type: 'tel', placeholder: '+1234567890', required: true },
      { key: 'message', label: 'Pre-filled Message', type: 'textarea', placeholder: 'Hi there!', required: false },
    ],
  },
  {
    id: 'location',
    label: 'Location',
    description: 'GPS coordinates for navigation',
    icon: MapPin,
    color: '#EC4899',
    fields: [
      { key: 'latitude', label: 'Latitude', type: 'number', placeholder: '37.7749', required: true },
      { key: 'longitude', label: 'Longitude', type: 'number', placeholder: '-122.4194', required: true },
    ],
  },
  {
    id: 'event',
    label: 'Event',
    description: 'Calendar event details',
    icon: Calendar,
    color: '#F97316',
    fields: [
      { key: 'title', label: 'Event Title', type: 'text', placeholder: 'Team Meeting', required: true },
      { key: 'date', label: 'Date', type: 'text', placeholder: '2025-01-15 at 2:00 PM', required: true },
      { key: 'location', label: 'Location', type: 'text', placeholder: 'Conference Room A', required: false },
      { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Quarterly review meeting', required: false },
    ],
  },
  {
    id: 'restaurant-menu',
    label: 'Restaurant Menu',
    description: 'Link to online menu',
    icon: UtensilsCrossed,
    color: '#A855F7',
    fields: [
      { key: 'url', label: 'Menu URL', type: 'url', placeholder: 'https://menu.example.com', required: true },
    ],
  },
  {
    id: 'portfolio',
    label: 'Portfolio',
    description: 'Showcase your work',
    icon: Palette,
    color: '#14B8A6',
    fields: [
      { key: 'url', label: 'Portfolio URL', type: 'url', placeholder: 'https://myportfolio.com', required: true },
    ],
  },
  {
    id: 'text',
    label: 'Text',
    description: 'Encode any text into a QR code',
    icon: FileText,
    color: '#64748B',
    fields: [
      { key: 'text', label: 'Text Content', type: 'textarea', placeholder: 'Enter any text...', required: true },
    ],
  },
  {
    id: 'social-media',
    label: 'Social Media',
    description: 'Link to your social profile',
    icon: Heart,
    color: '#E11D48',
    fields: [
      { key: 'platform', label: 'Platform', type: 'select', placeholder: '', required: true, options: SOCIAL_PLATFORMS },
      { key: 'username', label: 'Username / Profile URL', type: 'text', placeholder: '@username or full URL', required: true },
    ],
  },
  {
    id: 'batch-qr',
    label: 'Batch QR',
    description: 'Generate multiple QR codes at once',
    icon: Files,
    color: '#6B7280',
    fields: [
      { key: 'entries', label: 'Entries', type: 'textarea', placeholder: 'One entry per line', required: true },
    ],
  },
]

export type TemplateFormData = Record<string, string>
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

// ─── QR Customization Options ───────────────────────

export type ModuleStyle = 'square' | 'rounded' | 'extra-rounded' | 'dot'
export type CornerStyle = 'square' | 'rounded' | 'circle'
export type GradientType = 'solid' | 'linear' | 'radial'
export type GradientDirection = 'left-to-right' | 'top-to-bottom' | 'diagonal'
export type FrameStyle = 'none' | 'minimal' | 'modern' | 'business' | 'social' | 'premium'

// ─── Frame Presets ────────────────────────────────────────

export type FramePreset =
  | 'none'
  | 'scan-me'
  | 'scan-to-visit'
  | 'download-app'
  | 'scan-for-wifi'
  | 'contact-me'
  | 'view-menu'
  | 'follow-us'
  | 'open-website'
  | 'custom'

export const FRAME_PRESET_TEXTS: Record<FramePreset, string> = {
  'none': '',
  'scan-me': 'Scan Me',
  'scan-to-visit': 'Scan to Visit',
  'download-app': 'Download App',
  'scan-for-wifi': 'Scan for WiFi',
  'contact-me': 'Contact Me',
  'view-menu': 'View Menu',
  'follow-us': 'Follow Us',
  'open-website': 'Open Website',
  'custom': '',
}

export const FRAME_PRESET_ICONS: Record<FramePreset, LucideIcon | null> = {
  'none': null,
  'scan-me': Eye,
  'scan-to-visit': Globe,
  'download-app': Smartphone,
  'scan-for-wifi': Wifi,
  'contact-me': Phone,
  'view-menu': UtensilsCrossed,
  'follow-us': Heart,
  'open-website': Link,
  'custom': null,
}

export interface QRCustomization {
  fgColor: string
  bgColor: string
  size: number
  margin: number
  level: ErrorCorrectionLevel
  // Premium styling
  moduleStyle: ModuleStyle
  cornerStyle: CornerStyle
  gradientType: GradientType
  gradientColor1: string
  gradientColor2: string
  gradientDirection: GradientDirection
  frameStyle: FrameStyle
  logoDataUrl: string | null
  logoSize: number
  // Frame wrapper settings
  framePreset: FramePreset
  frameCustomText: string
  frameColor: string
  frameBgColor: string
  frameBorderRadius: number
  frameBorderThickness: number
  framePadding: number
  frameHasShadow: boolean
  frameRounded: boolean
  frameOutline: boolean
}

export const DEFAULT_CUSTOMIZATION: QRCustomization = {
  fgColor: '#000000',
  bgColor: '#FFFFFF',
  size: 250,
  margin: 10,
  level: 'M',
  moduleStyle: 'square',
  cornerStyle: 'square',
  gradientType: 'solid',
  gradientColor1: '#000000',
  gradientColor2: '#3B82F6',
  gradientDirection: 'left-to-right',
  frameStyle: 'none',
  logoDataUrl: null,
  logoSize: 25,
  framePreset: 'none',
  frameCustomText: '',
  frameColor: '#3B82F6',
  frameBgColor: '#FFFFFF',
  frameBorderRadius: 16,
  frameBorderThickness: 2,
  framePadding: 24,
  frameHasShadow: true,
  frameRounded: true,
  frameOutline: true,
}

// ─── Validation ────────────────────────────────────────

/**
 * Ensures a URL has a protocol prefix (defaults to https://).
 */
export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (!/^https?:\/\/./i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

/**
 * Escapes special characters in WiFi SSID/password values for QR encoding.
 */
function escapeWifiValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:')
}

// ─── Template QR Generation ────────────────────────────

/**
 * Normalizes a phone number for QR encoding (ensures + prefix).
 */
function normalizeTel(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`
}

/**
 * Generates a QR code value from a template's form data.
 */
export function generateTemplateQRValue(templateId: TemplateId, data: TemplateFormData): string {
  switch (templateId) {
    case 'website':
    case 'restaurant-menu':
    case 'portfolio': {
      const url = data.url?.trim()
      if (!url) return ''
      return normalizeUrl(url)
    }

    case 'wifi': {
      const ssid = data.ssid?.trim() ?? ''
      if (!ssid) return ''
      const password = data.password ?? ''
      const security = data.security || 'WPA'
      const hidden = data.hidden === 'true'
      let wifiQR = `WIFI:S:${escapeWifiValue(ssid)};T:${security === 'none' ? 'nopass' : security};P:${escapeWifiValue(password)}`
      if (hidden) wifiQR += ';H:true'
      wifiQR += ';;'
      return wifiQR
    }

    case 'email': {
      const email = data.email?.trim() ?? ''
      if (!email) return ''
      const subject = encodeURIComponent(data.subject?.trim() ?? '')
      const message = encodeURIComponent(data.message?.trim() ?? '')
      let mailto = `mailto:${email}`
      if (subject || message) {
        mailto += '?'
        const params: string[] = []
        if (subject) params.push(`subject=${subject}`)
        if (message) params.push(`body=${message}`)
        mailto += params.join('&')
      }
      return mailto
    }

    case 'phone': {
      const phone = data.phone?.trim()
      if (!phone) return ''
      return `tel:${normalizeTel(phone)}`
    }

    case 'sms': {
      const phone = data.phone?.trim()
      if (!phone) return ''
      const message = encodeURIComponent(data.message?.trim() ?? '')
      const formattedPhone = normalizeTel(phone)
      return message ? `sms:${formattedPhone}?body=${message}` : `sms:${formattedPhone}`
    }

    case 'whatsapp': {
      const phone = data.phone?.trim()
      if (!phone) return ''
      const cleanPhone = phone.replace(/[^\d+]/g, '')
      const message = encodeURIComponent(data.message?.trim() ?? '')
      const waPhone = cleanPhone.startsWith('+') ? cleanPhone.slice(1) : cleanPhone
      return message
        ? `https://wa.me/${waPhone}?text=${message}`
        : `https://wa.me/${waPhone}`
    }

    case 'business-card': {
      const name = data.name?.trim() ?? ''
      if (!name) return ''
      const company = (data.company?.trim() ?? '').replace(/[;:]/g, ' ')
      const title = (data.jobTitle?.trim() ?? '').replace(/[;:]/g, ' ')
      const phone = data.phone?.trim() ?? ''
      const email = data.email?.trim() ?? ''
      const website = data.website?.trim() ?? ''
      const address = (data.address?.trim() ?? '').replace(/[;:]/g, ' ')

      const parts: string[] = [`MECARD:N:${name}`]
      if (company) parts.push(`ORG:${company}`)
      if (title) parts.push(`TITLE:${title}`)
      if (phone) parts.push(`TEL:${phone}`)
      if (email) parts.push(`EMAIL:${email}`)
      if (website) parts.push(`URL:${website}`)
      if (address) parts.push(`ADR:${address}`)
      parts.push('')
      parts.push('')
      return parts.join(';')
    }

    case 'location': {
      const lat = data.latitude?.trim()
      const lon = data.longitude?.trim()
      if (!lat || !lon) return ''
      return `geo:${lat},${lon}`
    }

    case 'event': {
      const title = data.title?.trim() ?? ''
      if (!title) return ''
      const date = data.date?.trim() ?? ''
      const location = (data.location?.trim() ?? '').replace(/[;:]/g, ' ')
      const description = (data.description?.trim() ?? '').replace(/[;:]/g, ' ')

      const lines: string[] = ['BEGIN:VEVENT']
      lines.push(`SUMMARY:${title}`)
      if (date) lines.push(`DTSTART:${date.replace(/[^\w\s-]/g, '')}`)
      if (location) lines.push(`LOCATION:${location}`)
      if (description) lines.push(`DESCRIPTION:${description}`)
      lines.push('END:VEVENT')
      return lines.join('\n')
    }

    case 'text': {
      return data.text?.trim() ?? ''
    }

    case 'social-media': {
      const platform = data.platform ?? ''
      const username = data.username?.trim() ?? ''
      if (!username) return ''

      if (platform === 'other') {
        return normalizeUrl(username)
      }

      if (username.startsWith('http://') || username.startsWith('https://')) {
        return username
      }

      const cleanUser = username.replace(/^@/, '')
      const urls: Record<string, string> = {
        instagram: `https://instagram.com/${cleanUser}`,
        linkedin: `https://linkedin.com/in/${cleanUser}`,
        twitter: `https://x.com/${cleanUser}`,
        facebook: `https://facebook.com/${cleanUser}`,
        youtube: `https://youtube.com/@${cleanUser}`,
        tiktok: `https://tiktok.com/@${cleanUser}`,
        github: `https://github.com/${cleanUser}`,
        pinterest: `https://pinterest.com/${cleanUser}`,
      }
      return urls[platform] || normalizeUrl(username)
    }

    default:
      return ''
  }
}

/**
 * Validates a template's form data.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateTemplateForm(templateId: TemplateId, data: TemplateFormData): string | null {
  const template = TEMPLATES.find((t) => t.id === templateId)
  if (!template) return null

  for (const field of template.fields) {
    if (field.required) {
      const value = (data[field.key] ?? '').trim()
      if (!value) {
        return `Please fill in ${field.label.toLowerCase()}`
      }

      if (field.type === 'tel' && value.length < 7) {
        return `Please enter a valid phone number for ${field.label.toLowerCase()}`
      }
    }
  }

  return null
}
