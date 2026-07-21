import qrcode from 'qrcode'
import type { ModuleStyle, CornerStyle, GradientType, GradientDirection, FramePreset } from './qr'
import { FRAME_PRESET_TEXTS } from './qr'

export interface RenderOptions {
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

/**
 * Pre-load an image and return the loaded HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

export async function renderPremiumQR(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): Promise<void> {
  if (!canvas || !options) return
  if (!options.value) return

  const {
    value, size, margin, level,
    fgColor, bgColor,
    moduleStyle, cornerStyle,
    gradientType, gradientColor1, gradientColor2, gradientDirection,
    logoDataUrl, logoSize: logoSizePercentOption,
  } = options

  const ctx = canvas.getContext('2d')
  if (!ctx) return

  // Pre-load logo image if provided
  let logoImg: HTMLImageElement | null = null
  if (logoDataUrl) {
    try {
      logoImg = await loadImage(logoDataUrl)
    } catch {
      // Logo failed to load, continue without it
    }
  }

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

  // Clear entire canvas with background
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
  if (logoImg) {
    drawLogo(ctx, size, logoImg, logoSizePercentOption ?? 25)
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
  img: HTMLImageElement,
  logoSizePercent: number = 25
): void {
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

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
  ctx.beginPath()

  // Handle r=0 case (plain rectangle)
  if (r === 0) {
    ctx.rect(x, y, w, h)
    ctx.closePath()
    return
  }

  const maxR = Math.min(r, w / 2, h / 2)
  ctx.moveTo(x + maxR, y)
  ctx.lineTo(x + w - maxR, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + maxR)
  ctx.lineTo(x + w, y + h - maxR)
  ctx.quadraticCurveTo(x + w, y + h, x + w - maxR, y + h)
  ctx.lineTo(x + maxR, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - maxR)
  ctx.lineTo(x, y + maxR)
  ctx.quadraticCurveTo(x, y, x + maxR, y)
  ctx.closePath()
}

export function renderQRToCanvas(
  canvas: HTMLCanvasElement,
  options: RenderOptions
): Promise<void> {
  return renderPremiumQR(canvas, options)
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

// ─── Frame Export Helpers ────────────────────────────

export interface FrameExportOptions {
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

/**
 * Renders a QR code with a decorative frame wrapper onto a canvas.
 * Returns the combined canvas element.
 */
export async function renderQRWithFrame(
  qrOptions: RenderOptions,
  frameOptions: FrameExportOptions
): Promise<HTMLCanvasElement> {
  // First render the QR code to a temporary canvas
  const qrCanvas = document.createElement('canvas')
  await renderPremiumQR(qrCanvas, qrOptions)

  const {
    framePreset,
    frameCustomText,
    frameColor,
    frameBgColor,
    frameBorderRadius,
    frameBorderThickness,
    framePadding,
    frameRounded,
    frameOutline,
  } = frameOptions

  if (framePreset === 'none') {
    return qrCanvas
  }

  const frameText = framePreset === 'custom' ? (frameCustomText || 'Custom Frame') : FRAME_PRESET_TEXTS[framePreset]
  const qrSize = qrOptions.size
  const borderOffset = frameOutline ? frameBorderThickness : 0
  const textHeight = frameText ? 40 : 0
  const textGap = frameText ? 8 : 0

  const totalWidth = qrSize + framePadding * 2 + borderOffset * 2
  const totalHeight = qrSize + framePadding * 2 + borderOffset * 2 + textHeight + textGap

  const canvas = document.createElement('canvas')
  canvas.width = totalWidth
  canvas.height = totalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) return qrCanvas

  const effectiveRadius = frameRounded ? frameBorderRadius : 0

  // Draw frame shadow if enabled (behind background)
  if (frameOptions.frameHasShadow) {
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = 24
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 8
  }

  // Draw frame background
  ctx.fillStyle = frameBgColor
  roundRect(ctx, 0, 0, totalWidth, totalHeight, effectiveRadius)
  ctx.fill()

  // Reset shadow for border and content
  ctx.shadowColor = 'transparent'
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0

  // Draw frame border (outline)
  if (frameOutline && frameBorderThickness > 0) {
    ctx.strokeStyle = frameColor
    ctx.lineWidth = frameBorderThickness
    roundRect(ctx, borderOffset / 2, borderOffset / 2, totalWidth - borderOffset, totalHeight - borderOffset, effectiveRadius)
    ctx.stroke()
  }

  // Draw frame text
  if (frameText) {
    ctx.fillStyle = frameColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const fontSize = Math.max(14, Math.min(24, qrSize / 15))
    ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
    const textY = borderOffset + framePadding + fontSize / 2 + 4
    ctx.fillText(frameText, totalWidth / 2, textY)
  }

  // Paste QR code in center
  const qrX = borderOffset + framePadding
  const qrY = borderOffset + framePadding + textHeight + textGap
  ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize)

  return canvas
}



/**
 * Generates an SVG string that includes frame decoration.
 */
export function generateSVGWithFrame(
  qrOptions: RenderOptions,
  frameOptions: FrameExportOptions
): string {
  const qrSvg = generateSVG(qrOptions)

  const {
    framePreset,
    frameCustomText,
    frameColor,
    frameBgColor,
    frameBorderRadius,
    frameBorderThickness,
    framePadding,
    frameRounded,
    frameOutline,
  } = frameOptions

  if (framePreset === 'none') {
    return qrSvg
  }

  const frameText = framePreset === 'custom' ? (frameCustomText || 'Custom Frame') : FRAME_PRESET_TEXTS[framePreset]
  const qrSize = qrOptions.size
  const borderOffset = frameOutline ? frameBorderThickness : 0
  const textHeight = frameText ? 40 : 0
  const textGap = frameText ? 8 : 0

  const totalWidth = qrSize + framePadding * 2 + borderOffset * 2
  const totalHeight = qrSize + framePadding * 2 + borderOffset * 2 + textHeight + textGap

  const effectiveRadius = frameRounded ? frameBorderRadius : 0
  const parts: string[] = []

  // Frame shadow (SVG filter) - defined before use
  if (frameOptions.frameHasShadow) {
    parts.push(`<filter id="frame-shadow" x="-10%" y="-10%" width="130%" height="130%">`)
    parts.push(`  <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="rgba(0,0,0,0.3)"/>`)
    parts.push(`</filter>`)
  }

  // Frame background
  const bgRadius = effectiveRadius > 0 ? `rx="${effectiveRadius}" ry="${effectiveRadius}"` : ''
  const bgShadowAttr = frameOptions.frameHasShadow ? ' filter="url(#frame-shadow)"' : ''
  parts.push(`<rect x="0" y="0" width="${totalWidth}" height="${totalHeight}" fill="${frameBgColor}" ${bgRadius}${bgShadowAttr}/>`)

  // Frame border (outline)
  if (frameOutline && frameBorderThickness > 0) {
    const borderR = effectiveRadius > 0 ? `rx="${effectiveRadius}" ry="${effectiveRadius}"` : ''
    parts.push(`<rect x="${borderOffset / 2}" y="${borderOffset / 2}" width="${totalWidth - borderOffset}" height="${totalHeight - borderOffset}" fill="none" stroke="${frameColor}" stroke-width="${frameBorderThickness}" ${borderR}/>`)
  }

  // Frame text
  if (frameText) {
    const fontSize = Math.max(14, Math.min(24, qrSize / 15))
    const textY = borderOffset + framePadding + fontSize / 2 + 4
    parts.push(`<text x="${totalWidth / 2}" y="${textY}" text-anchor="middle" fill="${frameColor}" font-weight="bold" font-size="${fontSize}" font-family="system-ui, -apple-system, sans-serif">${escapeXml(frameText)}</text>`)
  }

  // Paste QR SVG (extract the inner content, skipping the outer svg wrapper)
  const qrContent = qrSvg.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')
  const qrX = borderOffset + framePadding
  const qrY = borderOffset + framePadding + textHeight + textGap

  // Wrap everything
  const frameSvg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${totalHeight}" viewBox="0 0 ${totalWidth} ${totalHeight}">`,
    ...parts,
    `<g transform="translate(${qrX}, ${qrY})">`,
    qrContent,
    `</g>`,
    '</svg>',
  ].join('\n')

  return frameSvg
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ─── SVG Generation ────────────────────────────────────

/**
 * Reconstruct RenderOptions from a stored GeneratedQR object and render it to a canvas.
 * Returns the canvas as a Blob (PNG).
 *
 * Note: logoDataUrl is not stored in Firestore (only a hasLogo boolean),
 * so logos are not included in shared images from saved QRs.
 */
export async function renderQRFromStoredData(
  qrData: {
    content: string
    style: Record<string, unknown>
    colors: Record<string, unknown>
    frame: Record<string, unknown>
  },
  size: number = 512
): Promise<Blob | null> {
  const style = qrData.style as Record<string, any>
  const colors = qrData.colors as Record<string, any>
  const frame = qrData.frame as Record<string, any>

  const renderOptions: RenderOptions = {
    value: qrData.content,
    size: (style.size as number) ?? size,
    margin: (style.margin as number) ?? 10,
    level: (style.level as 'L' | 'M' | 'Q' | 'H') ?? 'M',
    fgColor: (colors.fgColor as string) ?? '#000000',
    bgColor: (colors.bgColor as string) ?? '#FFFFFF',
    moduleStyle: (style.moduleStyle as ModuleStyle) ?? 'square',
    cornerStyle: (style.cornerStyle as CornerStyle) ?? 'square',
    gradientType: (colors.gradientType as GradientType) ?? 'solid',
    gradientColor1: (colors.gradientColor1 as string) ?? '#000000',
    gradientColor2: (colors.gradientColor2 as string) ?? '#3B82F6',
    gradientDirection: (colors.gradientDirection as GradientDirection) ?? 'left-to-right',
    logoDataUrl: null,
    logoSize: 25,
  }

  const frameOptions: FrameExportOptions = {
    framePreset: (frame.framePreset as FramePreset) ?? 'none',
    frameCustomText: (frame.frameCustomText as string) ?? '',
    frameColor: (frame.frameColor as string) ?? '#3B82F6',
    frameBgColor: (frame.frameBgColor as string) ?? '#FFFFFF',
    frameBorderRadius: (frame.frameBorderRadius as number) ?? 16,
    frameBorderThickness: (frame.frameBorderThickness as number) ?? 2,
    framePadding: (frame.framePadding as number) ?? 24,
    frameHasShadow: (frame.frameHasShadow as boolean) ?? true,
    frameRounded: (frame.frameRounded as boolean) ?? true,
    frameOutline: (frame.frameOutline as boolean) ?? true,
  }

  try {
    let canvas: HTMLCanvasElement
    if (frameOptions.framePreset !== 'none') {
      canvas = await renderQRWithFrame(renderOptions, frameOptions)
    } else {
      canvas = document.createElement('canvas')
      canvas.width = renderOptions.size
      canvas.height = renderOptions.size
      await renderPremiumQR(canvas, renderOptions)
    }
    return await canvasToBlob(canvas, 'image/png')
  } catch (err) {
    console.error('Failed to render QR from stored data:', err)
    return null
  }
}

/**
 * Generates an SVG string that matches the canvas-rendered QR code.
 */
export function generateSVG(options: RenderOptions): string {
  const {
    value, size, margin, level,
    fgColor, bgColor,
    moduleStyle, cornerStyle,
    gradientType, gradientColor1, gradientColor2, gradientDirection,
    logoDataUrl, logoSize: logoSizePercentOption,
  } = options

  const qr = qrcode.create(value, { errorCorrectionLevel: EC_MAP[level] })
  const modules = qr.modules
  const matrixSize = modules.size
  const totalModules = matrixSize + margin * 2
  const cellSize = size / totalModules
  const offset = margin * cellSize
  const logoSizePercent = logoSizePercentOption ?? 25

  // Determine the fill color for modules
  const getFill = (): string => {
    if (gradientType === 'solid') return fgColor
    return fgColor
  }

  const fill = getFill()

  // Build SVG parts
  const parts: string[] = []

  parts.push(`<rect width="${size}" height="${size}" fill="${bgColor}" rx="0"/>`)

  // Define gradient if needed
  let gradientDef = ''
  if (gradientType !== 'solid') {
    const gradId = 'qr-grad'
    let x1 = '0%', y1 = '0%', x2 = '100%', y2 = '0%'
    if (gradientType === 'radial') {
      gradientDef = `<radialGradient id="${gradId}" cx="50%" cy="50%" r="50%">`
    } else {
      switch (gradientDirection) {
        case 'left-to-right': break
        case 'top-to-bottom': y1 = '0%'; y2 = '100%'; x1 = '0%'; x2 = '0%'; break
        case 'diagonal': y1 = '0%'; y2 = '100%'; break
      }
      gradientDef = `<linearGradient id="${gradId}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">`
    }
    gradientDef += `<stop offset="0%" stop-color="${gradientColor1}"/>`
    gradientDef += `<stop offset="100%" stop-color="${gradientColor2}"/>`
    gradientDef += `</${gradientType === 'radial' ? 'radialGradient' : 'linearGradient'}>`
    parts.push(`<defs>${gradientDef}</defs>`)
  }

  const actualFill = gradientType !== 'solid' ? 'url(#qr-grad)' : fill

  // Helper to get SVG path for module style
  const getModulePath = (x: number, y: number, cs: number): string => {
    switch (moduleStyle) {
      case 'square':
        return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${actualFill}"/>`
      case 'rounded':
        return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="${cs * 0.25}" fill="${actualFill}"/>`
      case 'extra-rounded':
        return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="${cs * 0.4}" fill="${actualFill}"/>`
      case 'dot':
        return `<circle cx="${x + cs / 2}" cy="${y + cs / 2}" r="${cs * 0.42}" fill="${actualFill}"/>`
    }
  }

  // Helper to get SVG path for finder (corner) module
  const getFinderPath = (x: number, y: number, cs: number): string => {
    switch (cornerStyle) {
      case 'square':
        return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" fill="${actualFill}"/>`
      case 'rounded':
        return `<rect x="${x}" y="${y}" width="${cs}" height="${cs}" rx="${cs * 0.2}" fill="${actualFill}"/>`
      case 'circle':
        return `<circle cx="${x + cs / 2}" cy="${y + cs / 2}" r="${cs * 0.45}" fill="${actualFill}"/>`
    }
  }

  // Finder pattern regions
  const isFinder = (row: number, col: number): boolean => {
    const region = 7
    return (
      (row < region && col < region) ||
      (row < region && col >= matrixSize - region) ||
      (row >= matrixSize - region && col < region)
    )
  }

  // Render modules
  for (let row = 0; row < matrixSize; row++) {
    for (let col = 0; col < matrixSize; col++) {
      const moduleIndex = row * matrixSize + col
      if (modules.data[moduleIndex]) {
        const x = offset + col * cellSize
        const y = offset + row * cellSize
        const cs = cellSize + 0.5

        if (isFinder(row, col)) {
          parts.push(getFinderPath(x, y, cs))
        } else {
          parts.push(getModulePath(x, y, cs))
        }
      }
    }
  }

  // Draw finder frames
  const finderPositions: [number, number][] = [
    [0, 0],
    [0, matrixSize - 7],
    [matrixSize - 7, 0],
  ]
  for (const [r, c] of finderPositions) {
    const fx = offset + c * cellSize
    const fy = offset + r * cellSize
    const fs = 7 * cellSize
    if (cornerStyle === 'rounded' || cornerStyle === 'circle') {
      parts.push(`<rect x="${fx}" y="${fy}" width="${fs}" height="${fs}" rx="${cellSize * 1.5}" fill="none" stroke="${actualFill}" stroke-width="${cellSize * 2}"/>`)
    } else {
      parts.push(`<rect x="${fx}" y="${fy}" width="${fs}" height="${fs}" fill="none" stroke="${actualFill}" stroke-width="${cellSize * 2}"/>`)
    }
  }

  // Draw logo if provided
  if (logoDataUrl) {
    const maxLogoSize = size * (logoSizePercent / 100)
    const logoCenter = maxLogoSize / 2
    const lx = size / 2 - logoCenter
    const ly = size / 2 - logoCenter
    parts.push(`<rect x="${lx - 4}" y="${ly - 4}" width="${maxLogoSize + 8}" height="${maxLogoSize + 8}" rx="8" fill="white"/>`)
    parts.push(`<image x="${lx}" y="${ly}" width="${maxLogoSize}" height="${maxLogoSize}" href="${logoDataUrl}" preserveAspectRatio="xMidYMid meet"/>`)
  }

  // Assemble SVG
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    ...parts,
    '</svg>',
  ].join('\n')

  return svg
}
