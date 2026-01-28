const axios = require('axios')
const moment = require('moment-timezone')

module.exports.config = {
  name: 'money',
  version: '1.2.0',
  hasPermssion: 0,
  credits: 'Quất & G3K Optimizer',
  description: 'Quản lý tiền tệ: Check, Set, Pay, Tính toán (Admin)',
  commandCategory: 'Người dùng',
  usages: '[+/-/*/ / / ++/ --/ +-/ ^/ √/ +%/ -%/ pay] [số tiền]',
  cooldowns: 2,
  usePrefix: false,
}

module.exports.run = async ({ Currencies, api, event, args, Users, permssion }) => {
  const { senderID, mentions, type, messageReply, threadID } = event
  const i = async (url) => (await axios.get(url, { responseType: 'stream' })).data
  const link = 'https://files.catbox.moe/shxujt.gif'
  const time = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss - DD/MM/YYYY')

  // Xác định đối tượng mục tiêu
  const targetID =
    type === 'message_reply'
      ? messageReply.senderID
      : Object.keys(mentions).length > 0
        ? Object.keys(mentions)[0]
        : senderID

  try {
    const name = await Users.getNameUser(targetID)
    const userData = (await Currencies.getData(targetID)) || {}
    const currentMoney = userData.money || 0

    // 1. Trường hợp chỉ xem tiền
    if (!args[0]) {
      const msg =
        currentMoney === Infinity
          ? `${name} có vô hạn tiền`
          : `${name} hiện đang có ${currentMoney}$`
      return api.sendMessage(msg, threadID)
    }

    // 2. Xử lý lệnh 'pay' (Người dùng thường)
    if (args[0] === 'pay') {
      if (targetID === senderID) {
        return api.sendMessage('❌ Không thể chuyển tiền cho chính mình!', threadID)
      }
      const senderData = await Currencies.getData(senderID)
      const bet = args[1] === 'all' ? senderData.money : parseInt(args[1], 10)

      if (Number.isNaN(bet) || bet <= 0 || senderData.money < bet) {
        return api.sendMessage('Số tiền chuyển không hợp lệ hoặc bạn không đủ số dư!', threadID)
      }

      await Currencies.decreaseMoney(senderID, bet)
      await Currencies.increaseMoney(targetID, bet)
      return api.sendMessage(`✅ Đã chuyển cho ${name} ${bet}$`, threadID)
    }

    // 3. Các lệnh Admin (Quyền hạn >= 2)
    if (permssion < 2)
      return api.sendMessage('⚠️ Bạn không đủ quyền hạn để thực thi lệnh này.', threadID)

    const val = parseFloat(args[1])
    let newMoney = currentMoney
    let actionText = ''

    switch (args[0]) {
      case '+':
        newMoney += val
        actionText = `được cộng thêm ${val}$`
        break
      case '-':
        newMoney -= val
        actionText = `bị trừ đi ${val}$`
        break
      case '*':
        newMoney *= val
        actionText = `được nhân lên ${val} lần`
        break
      case '/':
        newMoney /= val
        actionText = `bị chia đi ${val} lần`
        break
      case '++':
        newMoney = Infinity
        actionText = `được thay đổi thành vô hạn`
        break
      case '--':
        newMoney = 0
        actionText = `bị reset về 0`
        break
      case '+-':
        newMoney = val
        actionText = `được thay đổi thành ${val}$`
        break
      case '^':
        newMoney = currentMoney ** val
        actionText = `được lũy thừa bậc ${val}`
        break
      case '√':
        newMoney = currentMoney ** (1 / val)
        actionText = `được căn bậc ${val}`
        break
      case '+%': {
        const addP = (currentMoney * val) / 100
        newMoney += addP
        actionText = `được cộng thêm ${val}% (${addP}$)`
        break
      }
      case '-%': {
        const subP = (currentMoney * val) / 100
        newMoney -= subP
        actionText = `bị trừ đi ${val}% (${subP}$)`
        break
      }
      default:
        return api.sendMessage('❌ Lệnh không hợp lệ!', threadID)
    }

    // Cập nhật Database (Dùng set cho chính xác tuyệt đối sau khi tính toán)
    await Currencies.setData(targetID, { money: parseInt(newMoney, 10) || 0 })

    return api.sendMessage(
      {
        body: `💸 Money của ${name} ${actionText}\n💸 Số dư mới: ${newMoney}$\n⏰ Thời gian: ${time}`,
        attachment: await i(link),
      },
      threadID
    )
  } catch (e) {
    console.error(e)
    return api.sendMessage('🔥 Đã xảy ra lỗi hệ thống khi xử lý lệnh.', threadID)
  }
}
