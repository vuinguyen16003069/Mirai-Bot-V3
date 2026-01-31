const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')
const { pipeline } = require('node:stream/promises')

// ===== CONFIGURATION =====
const CONFIG = {
  MAX_FILE_SIZE: 25 * 1024 * 1024, // 25MB
  MAX_IMAGES: 50,
  MAX_VIDEOS: 5,
  MAX_AUDIOS: 5,
  MEDIA_TIMEOUT: 60000,
  API_TIMEOUT: 20000,
  OVERALL_TIMEOUT: 120000,
  FILE_CLEANUP_DELAY: 60000,
  MAX_RETRIES: 3,
  RETRY_DELAY_BASE: 2,
}

const SUPPORTED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.watch',
  'instagram.com',
  'threads.net',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'douyin.com',
  'capcut.com',
  'bilibili.com',
  'soundcloud.com',
  'spotify.com',
]

const CACHE_DIR = path.join(__dirname, 'cache')
const STATE_FILE = path.join(__dirname, 'data', 'autodown_state.json')

// Khởi tạo thư mục cache ngay khi load module
fs.ensureDirSync(CACHE_DIR)

// ===== UTILITIES =====
const loadState = () => (fs.existsSync(STATE_FILE) ? fs.readJsonSync(STATE_FILE) : {})
const saveState = (state) => fs.outputJsonSync(STATE_FILE, state, { spaces: 2 })

const getHeaders = (urlStr) => {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
  ]
  try {
    const { hostname } = new URL(urlStr)
    return {
      'User-Agent': userAgents[Math.floor(Math.random() * userAgents.length)],
      Referer: `https://${hostname}/`,
      Origin: `https://${hostname}`,
    }
  } catch {
    return { 'User-Agent': userAgents[0] }
  }
}

const client = axios.create({
  timeout: CONFIG.API_TIMEOUT,
  headers: { Accept: '*/*', Connection: 'keep-alive' },
})

// ===== IMPROVED MEDIA FETCH =====
const fetchMedia = async (url, mediaType, ext) => {
  const fileName = `${mediaType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`
  const filePath = path.join(CACHE_DIR, fileName)

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await client.get(url, {
        responseType: 'stream',
        timeout: CONFIG.MEDIA_TIMEOUT,
        headers: getHeaders(url),
      })

      const size = parseInt(response.headers['content-length'], 10)
      if (size > CONFIG.MAX_FILE_SIZE) throw new Error('File too large')

      await pipeline(response.data, fs.createWriteStream(filePath))

      const stats = await fs.stat(filePath)
      if (stats.size === 0) throw new Error('Empty file')

      // Tự động xóa sau delay
      setTimeout(() => fs.remove(filePath).catch(() => {}), CONFIG.FILE_CLEANUP_DELAY)
      return filePath // Trả về path thay vì stream để reuse hoặc kiểm tra
    } catch (_err) {
      await fs.remove(filePath).catch(() => {})
      if (attempt === CONFIG.MAX_RETRIES) return null
      await new Promise((r) => setTimeout(r, CONFIG.RETRY_DELAY_BASE ** attempt * 1000))
    }
  }
}

// ===== NORMALIZE API RESPONSE =====
const normalizeData = (resData) => {
  const raw = resData.data || resData
  const result = {
    source: raw.source || 'Social Media',
    title: raw.title || 'No Title',
    author: raw.author || 'Unknown',
    media: [],
  }

  const processMedia = (items) =>
    (Array.isArray(items) ? items : [items]).map((item) => ({
      type: (item.type || 'video').toLowerCase(),
      url: typeof item === 'string' ? item : item.url,
    }))

  if (raw.media_urls) result.media = processMedia(raw.media_urls)
  else if (raw.medias) result.media = processMedia(raw.medias)
  else if (raw.attachment) result.media = processMedia(raw.attachment)
  else if (raw.url) result.media = processMedia(raw.url)

  return result
}

// ===== MODULE EXPORTS =====
this.config = {
  name: 'autodown',
  version: '2.1.0',
  hasPermssion: 0,
  credits: 'Dongdev',
  description: 'Tự động tải media đa nền tảng',
  commandCategory: 'Tiện ích',
  usages: '[on/off] hoặc [download <url>]',
  cooldowns: 5,
  prefix: true,
}

this.handleEvent = async ({ api, event }) => {
  const { threadID, body, senderID, messageID } = event
  if (senderID === api.getCurrentUserID() || !body) return

  const state = loadState()
  if (!state[threadID]?.enabled) return

  const urls = body.match(/(https?:\/\/[^\s]+)/g)
  if (!urls) return

  for (const url of urls) {
    if (!SUPPORTED_DOMAINS.some((d) => url.includes(d))) continue

    api.setMessageReaction('⌛', messageID, threadID)

    try {
      const res = await client.get(
        `https://api.satoru.click/api/downall?url=${encodeURIComponent(url)}`,
        { headers: getHeaders(url) }
      )
      const data = normalizeData(res.data)
      if (!data.media.length) throw new Error('No media found')

      const _filePaths = []
      // Tối ưu: Chỉ lấy media cần thiết để tránh spam
      const video = data.media.find((m) => m.type === 'video')
      const audios = data.media.filter((m) => m.type === 'audio').slice(0, CONFIG.MAX_AUDIOS)
      const images = data.media
        .filter((m) => m.type === 'image' || m.type === 'photo')
        .slice(0, CONFIG.MAX_IMAGES)

      // Fetch song song để tăng tốc
      const tasks = []
      if (video) tasks.push(fetchMedia(video.url, 'video', 'mp4'))
      for (const img of images) {
        tasks.push(fetchMedia(img.url, 'image', 'jpg'))
      }
      for (const aud of audios) {
        tasks.push(fetchMedia(aud.url, 'audio', 'mp3'))
      }

      const results = (await Promise.all(tasks)).filter(Boolean)

      if (results.length > 0) {
        const msg = {
          body: `[${data.source}]\n👤 Tác giả: ${data.author}\n📝 Tiêu đề: ${data.title}`,
          attachment: results.map((p) => fs.createReadStream(p)),
        }
        await api.sendMessage(msg, threadID, messageID)
        api.setMessageReaction('✅', messageID, threadID)
      } else {
        throw new Error('Failed to download media')
      }
    } catch (err) {
      console.error(`[Autodown Error]: ${err.message}`)
      api.setMessageReaction('❎', messageID, threadID)
    }
  }
}

this.run = async ({ api, event, args }) => {
  const { threadID } = event
  const state = loadState()

  if (args[0] === 'on' || args[0] === 'off') {
    state[threadID] = { enabled: args[0] === 'on' }
    saveState(state)
    return api.sendMessage(`✅ Đã ${args[0] === 'on' ? 'bật' : 'tắt'} tự động tải!`, threadID)
  }

  // Phân tích trạng thái hiện tại
  const isEnabled = state[threadID]?.enabled ? 'Bật' : 'Tắt'
  api.sendMessage(
    `📊 Trạng thái Autodown: ${isEnabled}\n💡 Cách dùng: ${this.config.name} [on/off]`,
    threadID
  )
}
