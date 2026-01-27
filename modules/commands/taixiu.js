// modules/commands/Game/taixiu.js
const fs = require('fs-extra')
const path = require('node:path')
const { createCanvas, loadImage } = require('canvas')

const dicePhotos = [
  'https://imgur.com/qn9PXUX.jpg',
  'https://imgur.com/hbQISCE.jpg',
  'https://imgur.com/gyskBsm.jpg',
  'https://imgur.com/vHMWTc2.jpg',
  'https://imgur.com/HvA4KVd.jpg',
  'https://imgur.com/JVuky8r.jpg',
]

module.exports.config = {
  name: 'taixiu',
  version: '1.4.1',
  hasPermssion: 0,
  credits: 'G3K',
  description: 'Tài Xỉu 1 người chơi',
  commandCategory: 'Game',
  usages: '[tài/xỉu] [số_tiền/all/%/k/m/b/kb/mb]',
  cooldowns: 5,
  dependencies: {
    'fs-extra': '',
    canvas: '',
  },
}

/* ---- Helpers (Giữ nguyên theo yêu cầu của bạn) ---- */

function toBigIntSafe(val) {
  if (typeof val === 'bigint') return val
  if (typeof val === 'number') return BigInt(Math.floor(val))
  if (typeof val === 'string') {
    const s = val.replace(/[,\s$]/g, '')
    if (s === '') return 0n
    if (s.includes('.')) {
      const [intPart] = s.split('.')
      return BigInt(intPart || '0')
    }
    return BigInt(s)
  }
  return 0n
}

function formatMoney(amount) {
  try {
    let v = toBigIntSafe(amount)
    const neg = v < 0n
    if (neg) v = -v
    const s = v.toString()
    const withCommas = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    return `${neg ? '-' : ''}${withCommas} $`
  } catch (e) {
    return `Lỗi: ${e.message}`
  }
}

/* ---- Cải tiến hiệu suất vẽ ảnh ---- */
async function createDiceImage(diceValues, outputPath) {
  const images = await Promise.all(diceValues.map((v) => loadImage(dicePhotos[v])))
  const totalWidth = images.reduce((sum, img) => sum + img.width, 0)
  const maxHeight = Math.max(...images.map((img) => img.height))

  const canvas = createCanvas(totalWidth, maxHeight)
  const ctx = canvas.getContext('2d')

  let xOffset = 0
  for (const img of images) {
    ctx.drawImage(img, xOffset, 0)
    xOffset += img.width
  }

  const buffer = canvas.toBuffer('image/jpeg')
  await fs.outputFile(outputPath, buffer)
  return outputPath
}

async function parseBet(bet, userMoney) {
  if (!bet) return [null, '🚫 Vui lòng nhập số tiền cược!']
  const normalizedBet = bet.toLowerCase().trim()

  if (['all', 'allin'].includes(normalizedBet)) return [userMoney, null]

  if (normalizedBet.endsWith('%')) {
    const percent = parseInt(normalizedBet, 10)
    if (Number.isNaN(percent) || percent < 1 || percent > 100)
      return [null, '🚫 Phần trăm phải từ 1-100']
    const amount = (userMoney * BigInt(percent)) / 100n
    return amount > 0n ? [amount, null] : [null, '🚫 Số tiền quá nhỏ']
  }

  const units = { k: 3n, m: 6n, b: 9n, kb: 12n, mb: 15n, gb: 18n, tb: 21n } // chú ý: kiểm tra kb/mb trước b/m/k
  let unitExp = 0n
  let numStr = normalizedBet

  for (const [u, exp] of Object.entries(units)) {
    if (normalizedBet.endsWith(u)) {
      unitExp = exp
      numStr = normalizedBet.slice(0, -u.length)
      break
    }
  }

  if (!/^[0-9]+(\.[0-9]+)?$/.test(numStr)) return [null, '🚫 Số tiền không hợp lệ']

  // Xử lý số thập phân với đơn vị (VD: 1.5k)
  const [int, frac] = numStr.split('.')
  const fracLen = frac ? frac.length : 0
  const multiplier = 10n ** unitExp
  const divisor = 10n ** BigInt(fracLen)
  const result = ((BigInt(int || 0) * divisor + BigInt(frac || 0)) * multiplier) / divisor

  if (result < 100n) return [null, '🚫 Cược tối thiểu 100 $']
  return [result, null]
}

/* ---- Run ---- */
module.exports.run = async ({ api, event, args, Currencies, Users }) => {
  const { threadID, messageID, senderID } = event

  if (args.length < 2) {
    return api.sendMessage('🚫 Sử dụng: taixiu <tài/xỉu> <số_tiền/all/%/...>', threadID, messageID)
  }

  const choice = args[0].toLowerCase()
  if (!['tài', 'xỉu'].includes(choice))
    return api.sendMessage("🚫 Chọn 'tài' hoặc 'xỉu'", threadID, messageID)

  // Chạy song song để giảm lag
  const [userData, userCurrency] = await Promise.all([
    Users.getData(senderID),
    Currencies.getData(senderID),
  ])

  const currentBalance = toBigIntSafe(userCurrency?.money || '0')
  const [betAmount, err] = await parseBet(args[1], currentBalance)

  if (err) return api.sendMessage(err, threadID, messageID)
  if (betAmount > currentBalance) {
    return api.sendMessage(`🚫 Số dư không đủ: ${formatMoney(currentBalance)}`, threadID, messageID)
  }

  const diceValues = [0, 0, 0].map(() => Math.floor(Math.random() * 6))
  const total = diceValues.reduce((s, v) => s + (v + 1), 0)
  const result = total >= 11 ? 'tài' : 'xỉu'
  const win = choice === result

  const newBalance = win ? currentBalance + betAmount : currentBalance - betAmount
  await Currencies.setData(senderID, { money: newBalance.toString() })

  const name = userData?.name || 'Người chơi'
  const cachePath = path.join(__dirname, 'cache', `tx_${senderID}_${Date.now()}.jpg`)

  try {
    await createDiceImage(diceValues, cachePath)

    const msg = {
      body: `[ ${name} ]\n🎲 Xúc xắc: ${diceValues.map((v) => v + 1).join('|')} - ${total} điểm (${result.toUpperCase()})\n${win ? `🎉 Thắng +${formatMoney(betAmount)}` : `❌ Thua -${formatMoney(betAmount)}`}`,
      attachment: fs.createReadStream(cachePath),
    }

    api.sendMessage(
      msg,
      threadID,
      () => {
        if (fs.existsSync(cachePath)) fs.unlinkSync(cachePath)
      },
      messageID
    )
  } catch (_e) {
    api.sendMessage(
      `[ ${name} ]\n🎲 Xúc xắc: ${diceValues.map((v) => v + 1).join('|')} - ${total} điểm (${result})\n${win ? `🎉 Thắng +${formatMoney(betAmount)}` : `❌ Thua -${formatMoney(betAmount)}`}\n⚠️ Lỗi hiển thị ảnh.`,
      threadID,
      messageID
    )
  }
}
