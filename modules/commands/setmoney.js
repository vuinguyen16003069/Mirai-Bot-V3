const Decimal = require('decimal.js')

// Cấu hình độ chính xác cho số lớn
Decimal.set({ precision: 200 })

module.exports.config = {
  name: 'setmoney',
  version: '2.0.0', // Nâng cấp version
  hasPermssion: 3, // Chỉ Admin
  credits: 'CatalizCS, refactor by G3K',
  description: 'Quản lý tiền tệ: add, set, clean, all, reset, setmulti',
  commandCategory: 'Admin',
  usages: '[add/set/clean/reset/all/setmulti] [UID/@tag/reply] [số tiền]',
  cooldowns: 5,
  dependencies: {
    'decimal.js': '',
  },
}

module.exports.languages = {
  vi: {
    invalidAmount: "❎ Số tiền không hợp lệ: '%1'. (Hỗ trợ: k, m, b, gb...)",
    addSuccess: '✅ Đã cộng %1 vào tài khoản của %2.',
    setSuccess: '✅ Đã đặt số dư của %2 thành %1.',
    cleanSuccess: '✅ Đã xóa sạch tiền của %1.',
    allSuccess: '✅ Đã đặt %1 cho %2 người dùng.',
    resetSuccess: '✅ Đã reset tiền của %1 người dùng về 0.',
    noPermission: '🚫 Bạn không có quyền sử dụng lệnh này.',
    invalidUser: '🚫 Không tìm thấy người dùng hợp lệ.',
    setMultiSuccess: '✅ Đã xử lý %1 người dùng.\n❎ Lỗi: %2',
    unknownCommand: '❎ Lệnh không hợp lệ. Dùng: add, set, clean, all, reset, setmulti',
    error: '⚠️ Đã xảy ra lỗi: %1',
  },
}

module.exports.run = async ({ event, api, args, Users, Currencies }) => {
  const { threadID, messageID, senderID, mentions, type, messageReply } = event
  const { languages } = module.exports

  // --- HELPER FUNCTIONS ---

  const getText = (key, ...values) => {
    let text = languages.vi[key] || key
    values.forEach((v, i) => {
      text = text.replace(`%${i + 1}`, v)
    })
    return text
  }

  const formatMoney = (n) => {
    try {
      return `${BigInt(new Decimal(n).toFixed(0)).toLocaleString('en-US')} $`
    } catch {
      return '0 $'
    }
  }

  // Hàm parse tiền tệ mạnh mẽ (hỗ trợ k, m, b, gb..., và số khoa học)
  const parseMoney = (text) => {
    if (!text) return null
    const input = String(text).toLowerCase().replace(/,/g, '').trim()
    if (!input) return null

    const units = { tb: 21, gb: 18, mb: 15, kb: 12, b: 9, m: 6, k: 3 }
    let multiplier = new Decimal(1)
    let numStr = input

    for (const [unit, pow] of Object.entries(units)) {
      if (input.endsWith(unit)) {
        multiplier = new Decimal(10).pow(pow)
        numStr = input.slice(0, -unit.length)
        break
      }
    }

    if (!/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(numStr)) return null
    try {
      const result = new Decimal(numStr).times(multiplier)
      if (result.isNegative()) return null // Không nhận số âm
      return result
    } catch {
      return null
    }
  }

  // Hàm đảm bảo data user tồn tại
  const ensureUserData = async (uid) => {
    try {
      let name = await Users.getNameUser(uid)
      if (!name || name === 'Facebook User') {
        const info = await api.getUserInfo(uid)
        name = info[uid]?.name || `User ${uid}`
      }
      await Users.createData(uid, { name, data: {} })
      await Currencies.createData(uid, { money: 0 })
      return { name }
    } catch {
      return { name: `User ${uid}` }
    }
  }

  // --- MAIN LOGIC ---
  try {
    const command = args[0]?.toLowerCase()
    if (!command) return api.sendMessage(getText('unknownCommand'), threadID, messageID)

    // 2. Xử lý SetMulti (Logic tách biệt)
    if (command === 'setmulti') {
      const raw = args.slice(1).join(' ')
      // Regex tìm cặp UID:Money hoặc UID Money
      const regex = /(\d{10,18})[\s:]+([0-9.,]+[kmbgt]?b?)/gi
      const matches = [...raw.matchAll(regex)]

      if (matches.length === 0)
        return api.sendMessage(
          '❎ Sai cú pháp. Dùng: setmulti <UID>:<Tiền> ...',
          threadID,
          messageID
        )

      let success = 0
      const errors = []
      for (const m of matches) {
        const uid = m[1]
        const moneyVal = parseMoney(m[2])
        if (!moneyVal) {
          errors.push(`${uid} (tiền lỗi)`)
          continue
        }
        try {
          await ensureUserData(uid)
          await Currencies.setData(uid, { money: moneyVal.toFixed(0) })
          success++
        } catch {
          errors.push(uid)
        }
      }
      return api.sendMessage(
        getText('setMultiSuccess', success, errors.join(', ') || 'Không'),
        threadID,
        messageID
      )
    }

    // 3. Xử lý All / Reset (Batch action)
    if (['all', 'reset'].includes(command)) {
      const moneyVal = command === 'all' ? parseMoney(args[1]) : new Decimal(0)
      if (command === 'all' && !moneyVal)
        return api.sendMessage(getText('invalidAmount', args[1]), threadID, messageID)

      const allUsers = await Currencies.getAll(['userID'])
      let count = 0

      // Xử lý song song từng batch nhỏ để tránh lag
      const batchSize = 20
      for (let i = 0; i < allUsers.length; i += batchSize) {
        const batch = allUsers.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (u) => {
            try {
              await Currencies.setData(u.userID, { money: moneyVal.toFixed(0) })
              count++
            } catch {}
          })
        )
      }

      const msgKey = command === 'all' ? 'allSuccess' : 'resetSuccess'
      return api.sendMessage(
        getText(msgKey, command === 'all' ? formatMoney(moneyVal) : count, count),
        threadID,
        messageID
      )
    }

    // 4. Xử lý Add / Set / Clean (Single user action)
    if (!['add', 'set', 'clean'].includes(command)) {
      return api.sendMessage(getText('unknownCommand'), threadID, messageID)
    }

    // --- Logic xác định Target & Amount ---
    let targetID = null
    let amountStr = null

    // Ưu tiên 1: Tag
    if (Object.keys(mentions).length > 0) {
      targetID = Object.keys(mentions)[0]
      amountStr = args
        .slice(1)
        .filter((a) => !a.includes('@'))
        .pop() // Lấy tham số tiền (loại bỏ tag)
    }
    // Ưu tiên 2: Reply
    else if (type === 'message_reply') {
      targetID = messageReply.senderID
      amountStr = args[1]
    }
    // Ưu tiên 3: UID nhập tay (Check kỹ độ dài UID)
    else if (args[1] && args[2] && /^\d{10,18}$/.test(args[1])) {
      targetID = args[1]
      amountStr = args[2]
    }
    // Ưu tiên 4: Chính người gửi (Nếu args[1] là tiền hoặc trống)
    else {
      targetID = senderID
      amountStr = args[1]
    }

    if (!targetID) return api.sendMessage(getText('invalidUser'), threadID, messageID)

    // Parse tiền (Clean thì không cần tiền)
    let money = new Decimal(0)
    if (command !== 'clean') {
      money = parseMoney(amountStr)
      if (!money)
        return api.sendMessage(getText('invalidAmount', amountStr || 'trống'), threadID, messageID)
    }

    // Thực thi
    const userData = await ensureUserData(targetID)

    if (command === 'clean') {
      await Currencies.setData(targetID, { money: '0' })
      return api.sendMessage(getText('cleanSuccess', userData.name), threadID, messageID)
    }

    if (command === 'set') {
      await Currencies.setData(targetID, { money: money.toFixed(0) })
      return api.sendMessage(
        getText('setSuccess', formatMoney(money), userData.name),
        threadID,
        messageID
      )
    }

    if (command === 'add') {
      const currentData = await Currencies.getData(targetID)
      const currentMoney = new Decimal(currentData?.money || 0)
      const newTotal = currentMoney.plus(money)
      await Currencies.setData(targetID, { money: newTotal.toFixed(0) })
      return api.sendMessage(
        getText('addSuccess', formatMoney(money), userData.name),
        threadID,
        messageID
      )
    }
  } catch (e) {
    console.error(e)
    return api.sendMessage(getText('error', e.message), threadID, messageID)
  }
}
