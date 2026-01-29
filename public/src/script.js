// Modernized script: DPR-aware canvas for particles + DOM-based snow (CSS animations)
const canvas = document.getElementById('myCanvas')
const ctx = canvas?.getContext?.('2d', { willReadFrequently: true }) || null
let points = []
const pointCount = 200
const str = 'FCA-UNOFFICIAL'
const baseFontFamily = "'Poppins', sans-serif"

// Load config from server (try several endpoints and show helpful debug info)
async function loadConfig() {
  const endpoints = ['/config.json', '/config']
  let lastErr = null
  let data = null

  for (const ep of endpoints) {
    try {
      const res = await fetch(ep)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      data = await res.json()
      break
    } catch (err) {
      lastErr = err
    }
  }

  if (!data) {
    console.error('Config fetch failed:', lastErr)
    showToast('Không lấy được cấu hình (xem console)')
    return
  }

  // config may nest under HTML
  const cfg = data?.HTML || data?.html || data || {}

  // Update username
  const userNameEl = document.querySelector('.userName')
  if (userNameEl) userNameEl.innerText = cfg.UserName || 'Unknown'

  // Update avatar initial
  const avatarEl = document.querySelector('.avatar')
  if (avatarEl && cfg.UserName) {
    avatarEl.innerText = cfg.UserName.charAt(0).toUpperCase()
    avatarEl.title = cfg.UserName
  }

  // Update music
  const audioEl = document.getElementById('backgroundAudio')
  const playPromptBtn = document.getElementById('playMusicPrompt')
  const trackNameEl = document.querySelector('.track-name')
  const trackLinkEl = document.getElementById('track-link')

  if (cfg.MusicLink) {
    if (trackNameEl) trackNameEl.innerText = 'Custom Music'
    if (trackLinkEl) {
      trackLinkEl.style.display = ''
      trackLinkEl.href = cfg.MusicLink
      trackLinkEl.textContent = 'Open track'
    }
    if (audioEl) {
      audioEl.src = cfg.MusicLink
      audioEl.style.display = ''
      if (playPromptBtn) playPromptBtn.disabled = false
      // try autoplay silently
      audioEl.play().catch(() => {})
    }
    if (playPromptBtn) {
      playPromptBtn.style.display = ''
      playPromptBtn.textContent = 'Bật nhạc'
      playPromptBtn.disabled = false
    }
  } else {
    if (trackNameEl) trackNameEl.innerText = 'No track available'
    if (trackLinkEl) trackLinkEl.style.display = 'none'
    if (audioEl) audioEl.style.display = 'none'
    if (playPromptBtn) {
      playPromptBtn.style.display = ''
      playPromptBtn.disabled = true
      playPromptBtn.textContent = 'No track'
    }
  }

  if (playPromptBtn && audioEl) {
    playPromptBtn.addEventListener('click', async () => {
      if (!audioEl.src) return showToast('Không có track để phát')
      try {
        await audioEl.play()
      } catch (err) {
        console.log('Play failed:', err)
        showToast('Không thể phát nhạc')
      }
    })
  }
}

loadConfig()

// Generate session id
const sessionId = crypto?.randomUUID?.() || Math.random().toString(36).substr(2, 9)
const sessionEl = document.getElementById('session-id')
if (sessionEl) sessionEl.innerText = sessionId

// DOM-based snow configuration
const snowLayerId = 'snowLayer'
let snowEnabled = true

// UI controls
const snowToggle = document.getElementById('snowToggle')
const densityInput = document.getElementById('density')
const themeToggle = document.getElementById('themeToggle')
const speedInput = document.getElementById('snowSpeed')
const windInput = document.getElementById('snowWind')
const playPauseBtn = document.getElementById('playPauseBtn')
const volRange = document.getElementById('volRange')
const reloadBtn = document.getElementById('reloadConfig')
const toastEl = document.getElementById('toast')
const audio = document.getElementById('backgroundAudio') || document.querySelector('audio')
// regionSelect and saveRegion removed — informational page only
const copySessionBtn = document.getElementById('copySession')

// sensible defaults
let density = densityInput ? Number(densityInput.value) : 100

function clamp(v, a, b) {
  return Math.max(a, Math.min(b, v))
}

function ensureSnowLayer() {
  let layer = document.getElementById(snowLayerId)
  if (!layer) {
    layer = document.createElement('div')
    layer.id = snowLayerId
    layer.setAttribute('aria-hidden', 'true')
    document.body.appendChild(layer)
  }
  return layer
}

function initSnow() {
  const layer = ensureSnowLayer()
  layer.innerHTML = ''
  if (!snowEnabled) return

  const cssW = window.innerWidth
  const cssH = window.innerHeight
  const areaFactor = (cssW * cssH) / (1366 * 768)
  const target = Math.round((density / 100) * 100 * clamp(areaFactor, 0.6, 3))

  for (let i = 0; i < target; i++) {
    const f = document.createElement('div')
    f.className = 'snowflake'
    const left = Math.random() * 100
    const size = Math.random() * 14 + 4 // px
    const baseDuration = Math.random() * 12 + 6 // seconds
    // negative delay but bounded to the duration so flakes are not already completed
    const delay = -Math.random() * baseDuration
    const opacity = Math.random() * 0.7 + 0.15
    f.style.left = `${left}%`;
    f.style.width = `${size}px`
    f.style.height = `${size}px`
    f.style.opacity = `${opacity}`
    // set combined animation: fall + horizontal sway
    // speed control: higher -> faster (shorter duration)
    const speedScale = speedInput ? Number(speedInput.value) : 100
    const actualDuration = Math.max(1, baseDuration * (100 / Math.max(1, speedScale)))

    // wind control: control horizontal sway amplitude
    const windScale = windInput ? Number(windInput.value) : 4
    const sway = (2 + Math.random() * Math.max(1, windScale)).toFixed(2)

    // fall: moves from top to bottom continuously, sway: horizontal oscillation infinite
    f.style.animation = `fall ${actualDuration}s linear ${delay}s infinite, sway ${sway}s ease-in-out ${delay}s infinite`
    layer.appendChild(f)
  }
}

window.addEventListener('resize', () => {
  clearTimeout(window._snowResizeTimer)
  window._snowResizeTimer = setTimeout(() => {
    initSnow()
    handleResize()
  }, 140)
})

// update snow controls
if (speedInput) speedInput.addEventListener('input', () => initSnow())
if (windInput) windInput.addEventListener('input', () => initSnow())

// Responsive canvas
function resizeCanvas() {
  if (!canvas || !ctx) return
  const dpr = window.devicePixelRatio || 1
  const containerW = Math.min(900, Math.max(320, window.innerWidth * 0.85))
  const desiredWidth = Math.round(containerW)
  const desiredHeight = window.innerWidth < 720 ? 120 : 160

  canvas.style.width = `${desiredWidth}px`
  canvas.style.height = `${desiredHeight}px`

  canvas.width = Math.floor(desiredWidth * dpr)
  canvas.height = Math.floor(desiredHeight * dpr)
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}

resizeCanvas()
window.addEventListener('resize', () => {
  clearTimeout(window._canvasResizeTimer)
  window._canvasResizeTimer = setTimeout(() => handleResize(), 120)
})

function handleResize() {
  resizeCanvas()
  // re-init points and animation when canvas size changes
  points = []
  init()
}

class Point {
  constructor(x, y) {
    this.x = x
    this.y = y
    this.vx = (Math.random() - 0.5) * 1.2
    this.vy = (Math.random() - 0.5) * 1.2
  }
  update(mask) {
    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.arc(this.x, this.y, 1.1, 0, 2 * Math.PI)
    ctx.fill()
    ctx.closePath()

    // bounce if outside mask or edges
    const nextX = this.x + this.vx
    const nextY = this.y + this.vy
    const idx = (Math.floor(nextY) * mask.width + Math.floor(nextX)) * 4
    const inside = mask.data[idx] === 255
    if (!inside || nextX < 0 || nextX >= mask.width) this.vx *= -1
    if (!inside || nextY < 0 || nextY >= mask.height) this.vy *= -1

    // lines
    for (let i = 0; i < points.length; i++) {
      const p = points[i]
      if (p === this) continue
      const dx = this.x - p.x
      const dy = this.y - p.y
      const d = Math.hypot(dx, dy)
      if (d < 22) {
        ctx.lineWidth = 0.08
        ctx.strokeStyle = 'rgba(255,255,255,0.12)'
        ctx.beginPath()
        ctx.moveTo(this.x, this.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
    }

    this.x += this.vx
    this.y += this.vy
  }
}

function init() {
  if (!ctx) return

  // work in CSS pixels; canvas is already scaled by DPR
  const w = canvas.width / (window.devicePixelRatio || 1)
  const h = canvas.height / (window.devicePixelRatio || 1)

  ctx.save()
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)

  // font sizing
  let fontSize = Math.min(84, Math.floor(h * 0.7))
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#fff'
  ctx.font = `bold ${fontSize}px ${baseFontFamily}`
  const padding = 24
  while (ctx.measureText(str).width > w - padding && fontSize > 14) {
    fontSize -= 2
    ctx.font = `bold ${fontSize}px ${baseFontFamily}`
  }

  // try multi-line if still long
  let lines = [str]
  if (ctx.measureText(str).width > w - padding && str.includes(' ')) {
    const words = str.split(' ')
    lines = ['']
    for (const word of words) {
      const test = lines[lines.length - 1] ? `${lines[lines.length - 1]} ${word}` : word
      if (ctx.measureText(test).width < w - padding) lines[lines.length - 1] = test
      else lines.push(word)
    }
  }

  const textY = h / 2
  if (lines.length === 1) ctx.fillText(lines[0], w / 2, textY)
  else {
    const lh = fontSize * 1.1
    const offset = -((lines.length - 1) * lh) / 2
    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], w / 2, textY + offset + i * lh);
    }
  }

  const mask = ctx.getImageData(0, 0, Math.floor(w), Math.floor(h))
  ctx.clearRect(0, 0, w, h)
  ctx.restore()

  // spawn points inside mask
  const whitePixels = []
  for (let y = 0; y < mask.height; y++) {
    for (let x = 0; x < mask.width; x++) {
      const i = (y * mask.width + x) * 4
      if (mask.data[i] === 255 && mask.data[i + 1] === 255 && mask.data[i + 2] === 255)
        whitePixels.push([x, y])
    }
  }

  points = []
  const spawnCount = Math.max(60, Math.min(400, Math.round(pointCount * (w / 600))))
  for (let i = 0; i < spawnCount; i++) {
    if (whitePixels.length) {
      const s = whitePixels[Math.floor(Math.random() * whitePixels.length)]
      points.push(new Point(s[0], s[1]))
    } else points.push(new Point(Math.random() * w, Math.random() * h))
  }

  ;(function loop() {
    ctx.clearRect(0, 0, w, h)
    for (let i = 0; i < points.length; i++) points[i].update({ data: mask.data, width: mask.width })
    requestAnimationFrame(loop)
  })()
}

// audio fallback: if audio exists but has no src, show disabled state
if (audio) {
  const hasSrc = !!(audio.getAttribute('src') || audio.src)
  if (!hasSrc) {
    const tn = document.querySelector('.track-name')
    if (tn) tn.textContent = 'No track available'
    audio.style.display = 'none'
  }
}

// small toast helper
function showToast(msg, timeout = 2500) {
  if (!toastEl) return
  toastEl.textContent = msg
  toastEl.classList.add('visible')
  clearTimeout(window._toastTimer)
  window._toastTimer = setTimeout(() => {
    toastEl.classList.remove('visible')
  }, timeout)
}

// wire up UI controls
if (snowToggle)
  snowToggle.addEventListener('change', (e) => {
    snowEnabled = e.target.checked
    if (snowEnabled) initSnow()
    else {
      const layer = document.getElementById(snowLayerId)
      if (layer) layer.innerHTML = ''
    }
  })
if (densityInput)
  densityInput.addEventListener('input', (e) => {
    density = Number(e.target.value)
    initSnow()
  })
if (themeToggle)
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('theme-light')
  })

// Reload server config via API
if (reloadBtn) {
  reloadBtn.addEventListener('click', async () => {
    reloadBtn.disabled = true
    try {
      const resp = await fetch('/api/reload')
      if (resp.ok) {
        const data = await resp.json()
        showToast(data.message || 'Reloaded')
      } else {
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.message || 'Failed')
      }
    } catch (err) {
      console.error(err)
      showToast('Reload failed')
    } finally {
      reloadBtn.disabled = false
    }
  })
}

// Play/Pause & volume control
if (audio) {
  try {
    audio.volume = 0.8
  } catch (_) {}

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play()
        playPauseBtn.textContent = 'Pause'
      } else {
        audio.pause()
        playPauseBtn.textContent = 'Play'
      }
    })
  }

  if (volRange) {
    volRange.addEventListener('input', (e) => {
      if (!audio) return
      audio.volume = Number(e.target.value) / 100
    })
  }
}

// Note: removed duplicate /api/config fetch; primary config loaded above from /config.json

// Region picker removed from informational page

// Save region UI removed

// copy session id
if (copySessionBtn) {
  copySessionBtn.addEventListener('click', async () => {
    const codeEl = document.querySelector('.session code')
    if (!codeEl) return showToast('Không tìm thấy Session ID')
    const text = codeEl.textContent || ''
    try {
      await navigator.clipboard.writeText(text)
      showToast('Session ID đã được sao chép')
    } catch (_) {
      try {
        const ta = document.createElement('textarea')
        ta.value = text
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        ta.remove()
        showToast('Session ID đã được sao chép')
      } catch (_) {
        showToast('Không thể sao chép')
      }
    }
  })
}

// Initialize everything
resizeCanvas()
init()
initSnow()
