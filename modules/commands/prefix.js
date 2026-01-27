const _axios = require('axios')
const moment = require('moment-timezone')

module.exports.config = {
  name: 'prefix',
  version: '2.0.0',
  hasPermission: 0,
  credits: 'DongDev',
  description: 'prefix bot',
  commandCategory: 'Hệ thống',
  usages: '[]',
  cooldowns: 0,
}

module.exports.handleEvent = async ({ api, event, client }) => {
  const { threadID, body } = event
  if (!body) return

  const { PREFIX } = global.config
  const _gio = moment.tz('Asia/Ho_Chi_Minh').format('HH:mm:ss || DD/MM/YYYY')

  const threadSetting = global.data.threadData.get(threadID) || {}
  const prefix = threadSetting.PREFIX || PREFIX

  const lowerBody = body.toLowerCase()

  if (
    lowerBody === 'prefix' ||
    lowerBody === 'prefix bot là gì' ||
    lowerBody === 'quên prefix r' ||
    lowerBody === 'dùng sao'
  ) {
    api.sendMessage(
      `✏️ Prefix của nhóm: ${prefix}\n📎 Prefix hệ thống: ${PREFIX}`,
      threadID,
      event.messageID
    )
  }
}

module.exports.run = async () => {}
