const axios = require('axios')
const fs = require('fs-extra')
const path = require('path')

const BASE_URL = 'https://api.satoru.click/api/downall?url='
const STATE_FILE = path.join(__dirname, 'data', 'autodown_state.json')

const loadState = () => {
  try {
    return fs.existsSync(STATE_FILE) ? fs.readJsonSync(STATE_FILE) : {}
  } catch {
    return {}
  }
}

const saveState = (state) => {
  try {
    fs.ensureDirSync(path.dirname(STATE_FILE))
    fs.writeJsonSync(STATE_FILE, state, { spaces: 2 })
  } catch (e) {
    console.error('Lỗi lưu state:', e)
  }
}

this.config = {
  name: 'autodown',
  version: '1.1.0',
  hasPermssion: 0, // Để 0 nếu muốn ai cũng bật được, 2 cho Admin
  credits: 'DongDev mod by G3K',
  description: 'Tự động tải đa nền tảng hoặc tải file từ URL',
  commandCategory: 'Tiện ích',
  usages: '[on/off] hoặc [download <url>]',
  cooldowns: 5,
  prefix: true,
}

this.handleEvent = async ({ api, event }) => {
  const { threadID, messageID, body, senderID } = event
  if (senderID === api.getCurrentUserID() || !body) return

  const state = loadState()
  if (!state[threadID]?.enabled) return

  // Tìm tất cả các link có trong tin nhắn
  const regUrl = /(https?:\/\/[^\s]+)/g
  const urls = body.match(regUrl)
  if (!urls) return

  const stream = async (url, ext) => {
    try {
      const res = await axios.get(url, { responseType: 'stream' })
      // Tạo tên file ngẫu nhiên để tránh ghi đè khi nhiều người dùng cùng lúc
      const filePath = path.join(
        __dirname,
        'cache',
        `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      )
      fs.ensureDirSync(path.join(__dirname, 'cache'))

      const writeStream = fs.createWriteStream(filePath)
      res.data.pipe(writeStream)

      return new Promise((resolve, reject) => {
        writeStream.on('finish', () => resolve(fs.createReadStream(filePath)))
        writeStream.on('error', reject)
      })
    } catch {
      return null
    }
  }

  for (const url of urls) {
    try {
      // Regex kiểm tra các nền tảng hỗ trợ
      const isSupported =
        /(facebook|fb|tiktok|twitter|x\.com|youtube|youtu\.be|instagram|bilibili|douyin|capcut|threads)/i.test(
          url
        )
      if (!isSupported) continue

      const { data: res } = await axios.get(`${BASE_URL}${encodeURIComponent(url)}`)
      if (!res.success || !res.data.attachment.length) continue

      const attachments = await Promise.all(
        res.data.attachment.map((at) => {
          const ext = at.type === 'Video' ? 'mp4' : at.type === 'Audio' ? 'mp3' : 'jpg'
          return stream(at.url, ext)
        })
      )

      const validAttachments = attachments.filter((a) => a !== null)
      if (validAttachments.length === 0) continue

      api.sendMessage(
        {
          body: `[ AUTODOWN ]\n────────────────\n⩺ Tiêu đề: ${res.data.title || 'Không có'}`,
          attachment: validAttachments,
        },
        threadID,
        messageID
      )
    } catch (error) {
      console.error('Lỗi khi tải file:', error.message)
    }
  }
}

this.run = async ({ api, event, args }) => {
  const state = loadState()
  const threadID = event.threadID

  if (args[0] === 'on') {
    state[threadID] = { enabled: true }
    saveState(state)
    return api.sendMessage('✅ Đã bật tự động tải cho nhóm!', threadID)
  }

  if (args[0] === 'off') {
    state[threadID] = { enabled: false }
    saveState(state)
    return api.sendMessage('❌ Đã tắt tự động tải cho nhóm!', threadID)
  }

  if (args[0] === 'download' && args[1]) {
    const url = args[1]
    try {
      const res = await axios.get(url, { responseType: 'stream' })
      const ext = path.extname(url).slice(1) || 'file'
      const filePath = path.join(
        __dirname,
        'cache',
        `${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      )
      fs.ensureDirSync(path.join(__dirname, 'cache'))

      const writeStream = fs.createWriteStream(filePath)
      res.data.pipe(writeStream)

      return new Promise((resolve) => {
        writeStream.on('finish', () => {
          api.sendMessage(
            {
              attachment: fs.createReadStream(filePath),
            },
            threadID
          )
          resolve()
        })
        writeStream.on('error', (err) => {
          api.sendMessage(`❌ Lỗi khi tải file: ${err.message}`, threadID)
          resolve()
        })
      })
    } catch (error) {
      return api.sendMessage(`❌ Lỗi khi tải file: ${error.message}`, threadID)
    }
  }

  const status = state[threadID]?.enabled ? 'Bật' : 'Tắt'
  api.sendMessage(
    `📊 Trạng thái Autodown: ${status}\n💡 Dùng: ${this.config.name} on/off\n💡 Tải file: ${this.config.name} download <url>`,
    threadID
  )
}
