import qrcode from 'qrcode'
import type { ModuleStyle, CornerStyle, GradientType, GradientDirection } from './qr'

interface RenderOptions {
  value: string
  size: number
  margin: number
  level: 'L' | 'M' | 'Q' | 'H'
  fgColor: string
  bgColor: string
  moduleStyle: ModuleStyle
  cornerStyle: CornerStyle
  gradientType: GradientType
  gradientColor1: string
  gradientColor2: string
  gradientDirection: GradientDirection
  logoDataUrl: string | null
  logoSize?: number
}

const EC_MAP: Record<string, qrcode.QRCodeErrorCorrectionLevel> = {
  L: 'L',
  M: 'M',
  Q: 'Q',
  H: 'H',
}

function getGradientFill(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: GradientType,
  color1: string,
  color2: string,
  direction: GradientDirection
): CanvasGradient | string {
  if (type === 'solid') return color1
  
  let gradient: CanvasGradient
  
  if (type === 'linear') {
    switch (direction) {
      case 'left-to-right':
        gradient = ctx.createLinearGradient(0, 0, w, 0)
        break
      case 'top-to-bottom':
        gradient = ctx.createLinearGradient(0, 0, 0, h)
        break
      case 'diagonal':
        gradient = ctx.createLinearGradient(0, 0, w, h)
        break
      default:
        gradient = ctx.createLinearGradient(0, 0, w, 0)
    }
  } else {
    gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
  }
  
  gradient.addColorStop(0, color1)
  gradient.addColorStop(1, color2)
  return gradient
}

export function renderPremiumQR(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
  const {
    value, size, margin, level,
    fgColor, bgColor,
    moduleStyle, cornerStyle,
    gradientType, gradientColor1, gradientColor2, gradientDirection,
    logoDataUrl,
  } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Generate QR matrix
  const qr = qrcode.create(value, { errorCorrectionLevel: EC_MAP[level] })
  const modules = qr.modules
  const matrixSize = modules.size
  
  // Calculate module cell size
  const totalModules = matrixSize + margin * 2
  const cellSize = size / totalModules
  const offset = margin * cellSize
  
  // Set canvas size
  canvas.width = size
  canvas.height = size
  
  // Clear with background
  ctx.fillStyle = bgColor
  ctx.fillRect(0, 0, size, size)
  
  // Get the gradient fill for foreground
  const fillStyle = getGradientFill(
    ctx, size, size,
    gradientType,
    gradientColor1,
    gradientColor2 === gradientColor1 ? fgColor : gradientColor2,
    gradientDirection
  )
  
  // Finder pattern regions (3x3 blocks at corners)
  const isFinder = (row: number, col: number): boolean => {
    const region = 7
    return (
      (row < region && col < region) ||
      (row < region && col >= matrixSize - region) ||
      (row >= matrixSize - region && col < region)
    )
  }

  // Render modules
  ctx.fillStyle = fillStyle instanceof CanvasGradient ? fillStyle : fillStyle
  
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      const moduleIndex = row * matrixSize + col
      if (modules.data[moduleIndex]) {
        const x = offset + col * cellSize
        const y = offset + row * cellSize
        const size_ = cellSize + 0.5 // Slight overlap to avoid gaps
        
        if (isFinder(row, col)) {
          // Render finder pattern with corner style
          renderFinderModule(ctx, x, y, size_, cornerStyle)
        } else {
          // Render data module with module style
          renderModule(ctx, x, y, size_, moduleStyle)
        }
      }
    }
  }
  
  // Draw finder pattern outer frames
  ctx.fillStyle = fillStyle instanceof CanvasGradient ? fillStyle : fillStyle
  drawFinderFrames(ctx, offset, cellSize, matrixSize, cornerStyle)
  
  // Draw logo if provided
  if (logoDataUrl) {
    drawLogo(ctx, size, logoDataUrl, options.logoSize ?? 25)
  }
}

function renderModule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  style: ModuleStyle
): void {
  switch (style) {
    case 'square':
      ctx.fillRect(x, y, size, size)
      break
    case 'rounded':
      roundRect(ctx, x, y, size, size, size * 0.25)
      ctx.fill()
      break
    case 'extra-rounded':
      roundRect(ctx, x, y, size, size, size * 0.4)
      ctx.fill()
      break
    case 'dot': {
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size * 0.42, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }
}

function renderFinderModule(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number,
  style: CornerStyle
): void {
  switch (style) {
    case 'square':
      ctx.fillRect(x, y, size, size)
      break
    case 'rounded':
      roundRect(ctx, x, y, size, size, size * 0.2)
      ctx.fill()
      break
    case 'circle': {
      ctx.beginPath()
      ctx.arc(x + size / 2, y + size / 2, size * 0.45, 0, Math.PI * 2)
      ctx.fill()
      break
    }
  }
}

function drawFinderFrames(
  ctx: CanvasRenderingContext2D,
  offset: number, cellSize: number,
  matrixSize: number,
  style: CornerStyle
): void {
  const positions: [number, number][] = [
    [0, 0],
    [0, matrixSize - 7],
    [matrixSize - 7, 0],
  ]
  
  ctx.strokeStyle = ctx.fillStyle as string | CanvasGradient
  ctx.lineWidth = cellSize * 2
  
  for (const [row, col] of positions) {
    const x = offset + col * cellSize
    const y = offset + row * cellSize
    const size = 7 * cellSize
    
    if (style === 'rounded' || style === 'circle') {
      roundRect(ctx, x, y, size, size, cellSize * 1.5)
      ctx.stroke()
    } else {
      ctx.strokeRect(x, y, size, size)
    }
  }
}

function drawLogo(
  ctx: CanvasRenderingContext2D,
  size: number,
  logoDataUrl: string,
  logoSizePercent: number = 25
): void {
  const img = new Image()
  img.onload = () => {
    const maxLogoSize = size * (logoSizePercent / 100)
    const logoSize = Math.min(img.width, img.height, maxLogoSize)
    const scale = logoSize / Math.max(img.width, img.height)
    const w = img.width * scale
    const h = img.height * scale
    const x = (size - w) / 2
    const y = (size - h) / 2
    
    // White background for logo
    ctx.fillStyle = '#FFFFFF'
    roundRect(ctx, x - 4, y - 4, w + 8, h + 8, 8)
    ctx.fill()
    
    // Draw logo
    ctx.drawImage(img, x, y, w, h)
  }
  img.src = logoDataUrl
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): void {
  renderPremiumQR(canvas, options)
}

export async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: 'image/png' | 'image/jpeg' = 'image/png',
  quality = 1
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality)
  })
}
