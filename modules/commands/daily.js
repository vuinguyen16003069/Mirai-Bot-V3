module.exports.config = {
  name: 'daily',
  version: '1.0.2',
  hasPermssion: 0,
  credits: 'Mirai Team',
  description: 'Nhận 100000000 coins mỗi ngày!',
  commandCategory: 'Tiền tệ',
  cooldowns: 5,
  envConfig: {
    cooldownTime: 43200000 * 2, // (12 nhân 2) tiếng =))))
    rewardCoin: 100000000,
  },
}

module.exports.languages = {
  vi: {
    cooldown: 'Bạn đang trong thời gian chờ\nVui lòng thử lại sau: %1!',
    rewarded:
      'Điểm danh thành công,bạn đã nhận %1$, để có thể tiếp tục nhận, vui lòng quay lại sau %2 nữa',
  },
}

module.exports.run = async ({ event, api, Currencies, getText }) => {
  const { threadID, senderID } = event
  const { cooldownTime, rewardCoin } = module.exports.config.envConfig
  const data = (await Currencies.getData(senderID)).data || {}

  if (typeof data !== 'undefined' && cooldownTime - (Date.now() - (data.dailyCoolDown || 0)) > 0) {
    const time = cooldownTime - (Date.now() - data.dailyCoolDown)
    const formattedTime = formatTime(time)
    return api.sendMessage(getText('cooldown', formattedTime), threadID)
  }
  const currentMoney = Number.parseInt(data.money, 10) || 0
  await Currencies.increaseMoney(senderID, rewardCoin)
  await Currencies.setData(senderID, {
    data: {
      money: (currentMoney + rewardCoin).toString(),
      dailyCoolDown: Date.now(),
    },
  })
  return api.sendMessage(
    getText('rewarded', rewardCoin.toLocaleString(), formatTime(cooldownTime)),
    threadID
  )
}

const formatTime = (time) => {
  const pad = (num) => (num < 10 ? `0${num}` : num)
  const hours = pad(Math.floor(time / (60 * 60 * 1000)))
  const minutes = pad(Math.floor((time % (60 * 60 * 1000)) / (60 * 1000)))
  const seconds = pad(Math.floor((time % (60 * 1000)) / 1000))
  return `${hours}:${minutes}:${seconds}`
}
