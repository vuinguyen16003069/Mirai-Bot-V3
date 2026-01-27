module.exports = ({ api, models }) => {
  const fs = require('node:fs')
  const path = require('path')
  const axios = require('axios')
  const { DateTime } = require('luxon')
  const { co } = require('../utils/log')

  const userCache = new Map()
  const threadCache = new Map()
  const CACHE_TTL = 10 * 60 * 1000 // 10 phút
  const thinhCache = { data: null, timestamp: 0 }
  const THINH_CACHE_TTL = 60 * 60 * 1000 // 1 giờ

  async function getRandomThinh() {
    const now = Date.now()
    if (thinhCache.data && now - thinhCache.timestamp < THINH_CACHE_TTL) {
      const keys = Object.keys(thinhCache.data)
      const randomKey = keys[Math.floor(Math.random() * keys.length)]
      return thinhCache.data[randomKey]
    }
    try {
      const response = await axios.get(
        'https://raw.githubusercontent.com/Sang070801/api/main/thinh1.json'
      )
      const fullData = response.data
      const data = fullData?.data
      if (typeof data === 'object' && !Array.isArray(data)) {
        thinhCache.data = data
        thinhCache.timestamp = now
        const keys = Object.keys(data)
        const randomKey = keys[Math.floor(Math.random() * keys.length)]
        return data[randomKey]
      }
    } catch (err) {
      console.error('Lỗi lấy thính từ API:', err)
    }
    return 'Không có câu thính nào.'
  }

  // Hàm lấy tên user với cache
  async function getUserName(_api, Users, senderID) {
    const now = Date.now()
    if (userCache.has(senderID)) {
      const { name, timestamp } = userCache.get(senderID)
      if (now - timestamp < CACHE_TTL) {
        return name
      }
    }
    try {
      const name = (await Users.getNameUser(senderID)) || 'Unknown User'
      userCache.set(senderID, { name, timestamp: now })
      return name
    } catch (err) {
      console.error('Lỗi lấy tên user:', err)
      return 'Unknown User'
    }
  }

  // Hàm lấy tên thread với cache
  async function getThreadName(api, Threads, threadID) {
    const now = Date.now()
    if (threadCache.has(threadID)) {
      const { name, timestamp } = threadCache.get(threadID)
      if (now - timestamp < CACHE_TTL) {
        return name
      }
    }
    try {
      let threadInfo = await Threads.getData(threadID)
      if (!threadInfo || !threadInfo.threadInfo || !threadInfo.threadInfo.name) {
        threadInfo = await api.getThreadInfo(threadID)
      }
      const name = threadInfo?.threadInfo?.name || `Thread ${threadID}`
      threadCache.set(threadID, { name, timestamp: now })
      return name
    } catch (err) {
      console.error('Lỗi lấy tên thread:', err)
      return `Thread ${threadID}`
    }
  }

  function padRight(str, len) {
    const s = String(str)
    if (s.length >= len) return s
    return s + ' '.repeat(len - s.length)
  }

  function makeBorder(title, width) {
    const line = '─'.repeat(Math.max(0, width - 2))
    const top = `╭${line}╮`
    const bottom = `╰${line}╯`
    const titleLine = `│ ${title}${' '.repeat(Math.max(0, width - title.length - 3))}│`
    return {
      top: co(top),
      titleLine: co(titleLine),
      bottom: co(bottom),
    }
  }
  const Users = require('./controllers/users')({
    models,
    api,
  })
  const Threads = require('./controllers/threads')({
    models,
    api,
  })
  const Currencies = require('./controllers/currencies')({
    models,
  })
  const logger = require('../utils/log.js')
  require('./handle/handleSchedule.js')({
    api,
    Threads,
    Users,
    models,
  })
  logger(
    `${api.getCurrentUserID()} - [ ${global.config.PREFIX} ] • ${!global.config.BOTNAME ? 'This bot was made by CatalizCS and SpermLord' : global.config.BOTNAME}`,
    '[ BOT INFO ] >'
  )
  ;(async () => {
    try {
      logger.loader('Tiến hành tải dữ liệu người dùng và nhóm')
      const [threads, users, currencies] = await Promise.all([
        Threads.getAll(),
        Users.getAll(['userID', 'name', 'data']),
        Currencies.getAll(['userID']),
      ])
      for (let i = 0; i < threads.length; i++) {
        const data = threads[i]
        const idThread = String(data.threadID)
        global.data.allThreadID.push(idThread)
        global.data.threadData.set(idThread, data.data || {})
        global.data.threadInfo.set(idThread, data.threadInfo || {})
        if (data.data?.banned) {
          global.data.threadBanned.set(idThread, {
            reason: data.data.reason || '',
            dateAdded: data.data.dateAdded || '',
          })
        }
        if (data.data?.commandBanned?.length) {
          global.data.commandBanned.set(idThread, data.data.commandBanned)
        }
        if (data.data?.NSFW) {
          global.data.threadAllowNSFW.push(idThread)
        }
      }
      for (let i = 0; i < users.length; i++) {
        const dataU = users[i]
        const idUsers = String(dataU.userID)
        global.data.allUserID.push(idUsers)
        if (dataU.name?.length) {
          global.data.userName.set(idUsers, dataU.name)
        }
        if (dataU.data?.banned) {
          global.data.userBanned.set(idUsers, {
            reason: dataU.data.reason || '',
            dateAdded: dataU.data.dateAdded || '',
          })
        }
        if (dataU.data?.commandBanned?.length) {
          global.data.commandBanned.set(idUsers, dataU.data.commandBanned)
        }
      }
      for (let i = 0; i < currencies.length; i++) {
        const dataC = currencies[i]
        global.data.allCurrenciesID.push(String(dataC.userID))
      }
      logger.loader(`Tải thành công dữ liệu của ${global.data.allThreadID.length} nhóm`)
      logger.loader(`Tải thành công dữ liệu của ${global.data.allUserID.length} người dùng`)
    } catch (error) {
      logger(`Tải môi trường thất bại: ${error}`, 'error')
    }
  })()
  const handlers = fs.readdirSync(path.join(__dirname, './handle')).reduce((acc, file) => {
    return {
      ...acc,
      [path.basename(file, '.js')]: require(`./handle/${file}`)({
        api,
        models,
        Users,
        Threads,
        Currencies,
      }),
    }
  }, {})
  return async (event) => {
    const a = path.join(__dirname, '/../utils/data/approvedThreads.json')
    const b = path.join(__dirname, '/../utils/data/pendingThreads.json')
    if (!fs.existsSync(a)) {
      fs.writeFileSync(a, JSON.stringify([]), 'utf-8')
    }
    if (!fs.existsSync(b)) {
      fs.writeFileSync(b, JSON.stringify([]), 'utf-8')
    }
    const c = JSON.parse(fs.readFileSync(a, 'utf-8'))
    const d = global.config.ADMINBOT
    const e = global.config.NDH
    const f = global.config.BOXADMIN
    const g = await api.getThreadInfo(event.threadID)
    const _h = g.threadName
    if (!c.includes(event.threadID) && !d.includes(event.senderID) && !e.includes(event.senderID)) {
      const i = (await Threads.getData(String(event.threadID))).data || {}
      const j = Object.hasOwn(i, 'PREFIX') ? i.PREFIX : global.config.PREFIX
      const _k = global.config.BOTNAME
      if (event.body && event.body.toLowerCase() === 'duyetbox') {
        api.sendMessage(`[ Thông Báo ]\n\n📜 Yêu cầu duyệt từ box ID: ${event.threadID}`, f)
        return api.sendMessage(
          `✅ Đã gửi yêu cầu duyệt đến nhóm admin!`,
          event.threadID,
          async (err, info) => {
            if (err) console.error(err)
            await new Promise((resolve) => setTimeout(resolve, 10 * 1000))
            api.unsendMessage(info.messageID)
            const l = JSON.parse(fs.readFileSync(b, 'utf-8'))
            if (!l.includes(event.threadID)) {
              l.push(event.threadID)
              fs.writeFileSync(b, JSON.stringify(l, null, 2), 'utf-8')
            }
          }
        )
      }
      if (event.body?.startsWith(j)) {
        return api.sendMessage(
          `❎ Nhóm của bạn chưa được Admin duyệt, hãy chat "duyetbox" để yêu cầu được duyệt`,
          event.threadID,
          async (err, info) => {
            if (err) console.error(err)
            await new Promise((resolve) => setTimeout(resolve, 10 * 1000))
            api.unsendMessage(info.messageID)
          }
        )
      }
    }
    await handlers.handleCreateDatabase({
      event,
    })
    switch (event.type) {
      case 'message':
      case 'message_reply':
      case 'message_unsend':
        await Promise.all([
          handlers.handleCommand({
            event,
          }),
          handlers.handleReply({
            event,
          }),
          handlers.handleCommandEvent({
            event,
          }),
        ])
        // Log message to console
        if (global.config?.console !== false) {
          const botID = api.getCurrentUserID()
          if (event.senderID !== botID) {
            try {
              const [nameUser, nameBox] = await Promise.all([
                getUserName(api, Users, event.senderID),
                getThreadName(api, Threads, event.threadID),
              ])

              let msg = event.body?.trim() ? event.body.trim() : ''
              if (!msg) {
                if (event.attachments?.length) msg = `📎 ${event.attachments.length} attachment(s)`
                else msg = '📎 Ảnh, video hoặc ký tự đặc biệt'
              }

              const time = DateTime.now()
                .setZone('Asia/Ho_Chi_Minh')
                .toFormat('dd/MM/yyyy HH:mm:ss')
              const width = 68 // box width
              const title = ` ${nameBox} `
              const { top, bottom } = makeBorder(title, width);

              const labelWidth = 14
              const lines = []
              lines.push(top)
              lines.push(co(`│ ${padRight('[📌] Tên nhóm:', labelWidth)} ${nameBox}`))
              lines.push(co(`│ ${padRight('[👥] ID nhóm:', labelWidth)} ${event.threadID}`))
              lines.push(co(`│ ${padRight('[💢] Người dùng:', labelWidth)} ${nameUser}`))
              lines.push(co(`│ ${padRight('[🆔] ID người dùng:', labelWidth)} ${event.senderID}`))
              lines.push(co(`│ ${padRight('[💬] Nội dung:', labelWidth)} ${msg}`))
              lines.push(co(`│ ${padRight('[🕐] Thời gian:', labelWidth)} ${time}`))
              lines.push(bottom)

              const thinh = await getRandomThinh()
              lines.push('')
              lines.push(co(`${thinh}`))
              lines.push('')

              console.log(lines.join('\n'))
            } catch (error) {
              console.error('Lỗi log message:', error)
            }
          }
        }
        break
      case 'event':
        await Promise.all([
          handlers.handleEvent({
            event,
          }),
          handlers.handleRefresh({ event }),
        ])
        break
      case 'message_reaction':
        await handlers.handleReaction({
          event,
        })
        break
      default:
        break
    }
  }
}
