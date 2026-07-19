// ─── QR Type Definitions ───────────────────────────────

export type QRTypeId = 'url' | 'text' | 'email' | 'phone' | 'sms' | 'wifi'
export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

// ─── QR Customization Options ───────────────────────

export type ModuleStyle = 'square' | 'rounded' | 'extra-rounded' | 'dot'
export type CornerStyle = 'square' | 'rounded' | 'circle'
export type GradientType = 'solid' | 'linear' | 'radial'
export type GradientDirection = 'left-to-right' | 'top-to-bottom' | 'diagonal'
export type FrameStyle = 'none' | 'minimal' | 'modern' | 'business' | 'social' | 'premium'

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
}

export interface QRFormData {
  url?: string
  text?: string
  email?: string
  subject?: string
  message?: string
  phone?: string
  ssid?: string
  password?: string
  security?: 'WPA' | 'WEP' | 'none'
}

export interface QRTypeInfo {
  id: QRTypeId
  label: string
  description: string
}

export const QR_TYPES: QRTypeInfo[] = [
  { id: 'url', label: 'URL', description: 'Generate a QR code for any website URL' },
  { id: 'text', label: 'Text', description: 'Encode any text into a QR code' },
  { id: 'email', label: 'Email', description: 'Generate a mailto QR code' },
  { id: 'phone', label: 'Phone', description: 'Generate a tel QR code' },
  { id: 'sms', label: 'SMS', description: 'Generate an SMS QR code' },
  { id: 'wifi', label: 'WiFi', description: 'Generate a WiFi login QR code' },
]

// ─── Validation ────────────────────────────────────────

/**
 * Validates a URL with http/https/ftp protocol.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return ['http:', 'https:', 'ftp:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

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
 * Basic email format validation.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Validates a phone number (digits and optional leading +, min 7 chars).
 */
export function isValidPhone(phone: string): boolean {
  return /^\+?\d{7,15}$/.test(phone.trim())
}

/**
 * Validates form data for the given QR type.
 * Returns null if valid, or an error message string if invalid.
 */
export function validateForm(type: QRTypeId, data: QRFormData): string | null {
  switch (type) {
    case 'url': {
      const url = data.url?.trim()
      if (!url) return 'Please enter a URL'
      const normalized = normalizeUrl(url)
      if (!isValidUrl(normalized)) return 'Please enter a valid URL (e.g., https://example.com)'
      return null
    }
    case 'text': {
      if (!data.text?.trim()) return 'Please enter some text'
      return null
    }
    case 'email': {
      if (!data.email?.trim()) return 'Please enter a recipient email'
      if (!isValidEmail(data.email)) return 'Please enter a valid email address'
      return null
    }
    case 'phone': {
      if (!data.phone?.trim()) return 'Please enter a phone number'
      if (!isValidPhone(data.phone)) return 'Please enter a valid phone number (e.g., +919876543210)'
      return null
    }
    case 'sms': {
      if (!data.phone?.trim()) return 'Please enter a phone number'
      if (!isValidPhone(data.phone)) return 'Please enter a valid phone number (e.g., +919876543210)'
      return null
    }
    case 'wifi': {
      if (!data.ssid?.trim()) return 'Please enter a WiFi network name (SSID)'
      return null
    }
    default:
      return null
  }
}

// ─── QR Value Generation ───────────────────────────────

/**
 * Generates the string value to encode into a QR code based on the type and form data.
 */
export function generateQRValue(type: QRTypeId, data: QRFormData): string {
  switch (type) {
    case 'url': {
      return normalizeUrl(data.url ?? '')
    }
    case 'text': {
      return data.text ?? ''
    }
    case 'email': {
      const email = data.email?.trim() ?? ''
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
      const phone = data.phone?.trim() ?? ''
      return `tel:${phone.startsWith('+') ? phone : `+${phone}`}`
    }
    case 'sms': {
      const phone = data.phone?.trim() ?? ''
      const message = encodeURIComponent(data.message?.trim() ?? '')
      const formattedPhone = phone.startsWith('+') ? phone : `+${phone}`
      return message ? `sms:${formattedPhone}?body=${message}` : `sms:${formattedPhone}`
    }
    case 'wifi': {
      const ssid = data.ssid?.trim() ?? ''
      const password = data.password ?? ''
      const security = data.security ?? 'WPA'
      return `WIFI:S:${escapeWifiValue(ssid)};T:${security === 'none' ? 'nopass' : security};P:${escapeWifiValue(password)};;`
    }
    default:
      return ''
  }
}

/**
 * Escapes special characters in WiFi SSID/password values for QR encoding.
 */
function escapeWifiValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/"/g, '\\"').replace(/:/g, '\\:')
}
