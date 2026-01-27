// modules/commands/Game/baucua.js
const path = require('node:path')
const fs = require('fs-extra')
const { createCanvas, loadImage } = require('canvas')

const baucuaPhotos = {
  bầu: 'https://i.imgur.com/ybt65mR.jpeg',
  cua: 'https://i.imgur.com/Zkxwe2K.jpeg',
  tôm: 'https://i.imgur.com/2B02qow.jpeg',
  cá: 'https://i.imgur.com/IAgv9ak.jpeg',
  gà: 'https://i.imgur.com/BQBIXV3.jpeg',
  nai: 'https://i.imgur.com/KYprGnd.jpeg',
}

module.exports.config = {
  name: 'baucua',
  version: '1.0.3',
  hasPermssion: 0,
  credits: 'G3K',
  description: 'Chơi game Bầu Cua',
  commandCategory: 'Game',
  usages: '[bầu/cua/tôm/cá/gà/nai] ... [số_tiền/all/%/k/m/b/kb/mb]',
  cooldowns: 5,
  dependencies: {
    'fs-extra': '',
    canvas: '',
  },
}

/* ---------- Helpers for BigInt money handling ---------- */

// chuyển giá trị (string|number|bigint) -> BigInt an toàn
const toBigIntSafe = (val) => {
  if (typeof val === 'bigint') {
    return val
  }
  if (typeof val === 'number') {
    return BigInt(Math.floor(val))
  }
  if (typeof val === 'string') {
    // loại bỏ dấu phẩy, khoảng trắng, ký hiệu $ nếu có
    const s = val.replace(/[,\s$]/g, '')
    if (s === '' || s === '-') {
      return 0n
    }
    // nếu chứa dấu thập phân thì bỏ phần thập phân (bán xuống)
    if (s.includes('.')) {
      const [intPart] = s.split('.')
      return BigInt(intPart || '0')
    }
    return BigInt(s)
  }
  return 0n
}

// format BigInt thành chuỗi có dấu phẩy + $ ở cuối
const formatMoney = (amount) => {
  try {
    let v = toBigIntSafe(amount)
    const neg = v < 0n
    if (neg) {
      v = -v
    }
    const s = v.toString()
    const withCommas = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${neg ? '-' : ''}${withCommas} $`
  } catch (error) {
    return `Lỗi: ${error.message}`
  }
}

/* ---------- Image merge (chuyển sang Canvas) ---------- */
const mergeImages = async (imagePaths, outputPath, logger) => {
  try {
    const images = await Promise.all(
      imagePaths.map((file) =>
        loadImage(file).catch(() => {
          throw new Error(`Không tải được hình ảnh: ${file}`)
        })
      )
    )
    const totalWidth = images.reduce((sum, img) => sum + img.width, 0)
    const maxHeight = Math.max(...images.map((img) => img.height))
    const canvas = createCanvas(totalWidth, maxHeight)
    const ctx = canvas.getContext('2d')
    let xOffset = 0
    images.forEach((img) => {
      ctx.drawImage(img, xOffset, 0)
      xOffset += img.width
    })
    await fs.ensureDir(path.dirname(outputPath))
    const buffer = canvas.toBuffer('image/jpeg')
    await fs.writeFile(outputPath, buffer)
    return outputPath
  } catch (error) {
    logger(`[Baucua] Lỗi hợp nhất hình ảnh: ${error.message}`, '[ERROR]')
    throw error
  }
}

/* ---------- Parse bet amount -> trả về BigInt ---------- */
const parseBetAmount = async (bet, userId, Currencies) => {
  if (!bet) {
    return [null, '🚫 Vui lòng nhập số tiền cược! Ví dụ: 100k, all, 50%']
  }

  const currency = (await Currencies.getData(userId)) || { money: '0' }
  const userMoney = toBigIntSafe(currency.money || '0')

  if (userMoney < 0n) {
    return [null, `🚫 Số dư không hợp lệ: ${formatMoney(userMoney)}`]
  }

  const betStr = String(bet).toLowerCase().trim()

  // all / allin
  if (/^(allin|all)$/.test(betStr)) {
    if (userMoney > 0n) {
      return [userMoney, null]
    }
    return [null, `🚫 Số dư không đủ: ${formatMoney(userMoney)}`]
  }

  // percent e.g. 50%
  if (/^[0-9]+%$/.test(betStr)) {
    const percent = Number(betStr.match(/^[0-9]+/)[0])
    if (percent < 1 || percent > 100) {
      return [null, '🚫 Phần trăm phải từ 1% đến 100%']
    }
    const betAmount = (userMoney * BigInt(percent)) / 100n // BigInt division floors
    if (betAmount <= 0n) {
      return [null, `🚫 Số tiền cược không hợp lệ: ${formatMoney(betAmount)}`]
    }
    return [betAmount, null]
  }

  // units
  const units = { k: 3n, m: 6n, b: 9n, kb: 12n, mb: 15n, gb: 18n, tb: 21n } // chú ý: kiểm tra kb/mb trước b/m/k
  let foundUnit = ''
  for (const unit of Object.keys(units)) {
    if (betStr.endsWith(unit)) {
      foundUnit = unit
      break
    }
  }
  const exp = foundUnit ? units[foundUnit] : 0
  const numberText = foundUnit ? betStr.slice(0, -foundUnit.length) : betStr

  // validate numeric format (allow decimals)
  if (!/^[0-9]+(\.[0-9]+)?$/.test(numberText)) {
    return [null, '🚫 Định dạng số tiền không hợp lệ! Ví dụ: 100k, 1.5m, 500']
  }

  // convert numberText (may contain decimal) to BigInt: floor(number * 10**exp)
  const [intPart, fracPart] = numberText.split('.')
  const fracLen = fracPart ? fracPart.length : 0
  const fracDiv = 10n ** BigInt(fracLen)
  const numerator = BigInt(intPart || '0') * fracDiv + (fracPart ? BigInt(fracPart) : 0n)
  const multiplier = 10n ** BigInt(exp)
  const result = (numerator * multiplier) / fracDiv // floor

  if (result > userMoney) {
    return [null, `🚫 Số dư không đủ: ${formatMoney(userMoney)} < ${formatMoney(result)}`]
  }
  if (result < 100n) {
    return [null, `🚫 Số tiền cược tối thiểu: ${formatMoney(100n)}`]
  }

  return [result, null]
}

/* ---------- Main run ---------- */
module.exports.run = async ({ api, event, args, Users, Currencies }) => {
  const { threadID, messageID, senderID } = event
  const logger = require('../../../utils/log')
  const baucuaOptions = Object.keys(baucuaPhotos)
  const send = (msg, callback) => api.sendMessage(msg, threadID, callback)

  try {
    if (args.length < 2) {
      return api.sendMessage(
        `🚫 Sử dụng: baucua <${baucuaOptions.join('/')}> ... <số_tiền/all/%/k/m/b/kb/mb>\nVí dụ: baucua bầu cua 100k`,
        threadID,
        messageID
      )
    }

    const betAmountText = args[args.length - 1]
    const choices = [...new Set(args.slice(0, -1).map((c) => c.toLowerCase()))]
    if (choices.some((c) => !baucuaOptions.includes(c))) {
      return send(`🚫 Lựa chọn không hợp lệ. Chọn: ${baucuaOptions.join(', ')}`)
    }
    if (choices.length > 3) {
      return send('🚫 Đặt tối đa 3 con.')
    }

    const [betAmount, error] = await parseBetAmount(betAmountText, senderID, Currencies, logger)
    if (error) {
      return send(error)
    }

    const currency =
      (await Currencies.getData(senderID)) ||
      (await Currencies.setData(senderID, {
        money: '0',
        exp: 0,
        data: {},
      }).then(() => Currencies.getData(senderID)))
    const currentBalance = toBigIntSafe(currency.money || '0')
    if (betAmount > currentBalance) {
      return send(`🚫 Số dư không đủ: ${formatMoney(currentBalance)} < ${formatMoney(betAmount)}`)
    }

    // sinh kết quả
    const diceResults = Array(3)
      .fill()
      .map(() => baucuaOptions[Math.floor(Math.random() * baucuaOptions.length)])
    let totalWinAmount = 0n
    const winDetails = []
    const betPerChoice = betAmount / BigInt(choices.length) // BigInt division floors

    for (const choice of choices) {
      const winCount = diceResults.filter((r) => r === choice).length
      const multipliers = { 1: 2n, 2: 3n, 3: 5n }
      if (winCount > 0) {
        const winAmount = betPerChoice * multipliers[winCount]
        totalWinAmount += winAmount
        winDetails.push(
          `✅ ${choice.charAt(0).toUpperCase() + choice.slice(1)} x${winCount} (x${Number(multipliers[winCount])}) → +${formatMoney(winAmount)}`
        )
      } else {
        winDetails.push(
          `❌ ${choice.charAt(0).toUpperCase() + choice.slice(1)} → -${formatMoney(betPerChoice)}`
        )
      }
    }

    const totalBetAmount = betPerChoice * BigInt(choices.length)
    const finalAmount = totalWinAmount - totalBetAmount // BigInt, có thể âm/duong/0
    let response
    if (finalAmount > 0n) {
      response = `🎉 Bạn thắng +${formatMoney(finalAmount)}`
    } else if (finalAmount < 0n) {
      response = `Bạn thua -${formatMoney(-finalAmount)}`
    } else {
      response = 'Hòa - không mất không được'
    }

    // cập nhật tiền (lưu dưới dạng string)
    await Currencies.setData(senderID, {
      money: (currentBalance + finalAmount).toString(),
    })

    const authorName = await (async () => {
      try {
        const u = await Users.getData(senderID)
        return u?.name
          ? u.name
          : global.data?.userName?.get(senderID)
            ? global.data.userName.get(senderID)
            : 'Người dùng'
      } catch (e) {
        logger(`[Baucua] Lỗi lấy tên người dùng ${senderID}: ${e.message}`, '[ERROR]')
        return 'Người dùng'
      }
    })()

    const dataTrave = [
      `[ ${authorName} ]`,
      `🎲 Kết quả: ${diceResults.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(' - ')}`,
      ...winDetails,
      response,
      `💰 Số dư hiện tại của bạn: ${formatMoney(currentBalance + finalAmount)}`,
    ].join('\n')

    const imagePaths = diceResults.map((result) => baucuaPhotos[result])
    const mergedImagePath = path.join(__dirname, 'cache', `baucua_${senderID}_${Date.now()}.jpg`)

    try {
      const mergedPath = await mergeImages(imagePaths, mergedImagePath, logger)
      await api.sendMessage(
        { body: dataTrave, attachment: fs.createReadStream(mergedPath) },
        threadID,
        messageID
      )
      await fs.remove(mergedImagePath)
    } catch (error) {
      await api.sendMessage(
        `${dataTrave}\n🚫 Lỗi hiển thị hình ảnh: ${error.message}`,
        threadID,
        messageID
      )
    }
  } catch (error) {
    logger(`[Baucua] Lỗi: ${error.message}`, '[ERROR]')
    await send(`🚫 Lỗi: ${error.message}`)
  }
}

module.exports.handleEvent = async () => {}
