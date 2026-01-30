const _handleRefresh = require('../../includes/handle/handleRefresh.js')
module.exports.config = {
  name: 'leaveNoti',
  eventType: ['log:unsubscribe'],
  version: '1.0.1',
  credits: 'Ranz',
  description: 'Thông báo khi người dùng rời khỏi nhóm có random gif/ảnh/video',
  dependencies: {
    'fs-extra': '',
    path: '',
  },
}

module.exports.onLoad = () => {
  const { existsSync, mkdirSync } = require('fs-extra')
  const { join } = require('path')

  const path = join(__dirname, 'cache', 'leaveGif')
  if (!existsSync(path)) mkdirSync(path, { recursive: true })

  const path2 = join(__dirname, 'cache', 'leaveGif', 'randomgif')
  if (!existsSync(path2)) mkdirSync(path2, { recursive: true })

  return
}
module.exports.run = async ({ api, event, Users, Threads }) => {
  try {
    const { threadID } = event
    const iduser = event.logMessageData.leftParticipantFbId
    if (iduser === api.getCurrentUserID()) return

    const moment = require('moment-timezone')
    const time = moment.tz('Asia/Ho_Chi_Minh').format('DD/MM/YYYY || HH:mm:ss')

    const threadData = await Threads.getData(threadID)
    const data = threadData.data || {}

    const userData = await Users.getData(event.author)
    const nameAuthor = userData.name || 'Unknown'
    const name =
      global.data.userName.get(iduser) || (await Users.getNameUser(iduser)) || 'Unknown User'

    const type =
      event.author === iduser ? 'đã tự rời khỏi nhóm' : `đã bị ${nameAuthor} kick khỏi nhóm`

    const defaultMsg =
      '{name} {type}\n\nLink FB ⬇️\nhttps://www.facebook.com/profile.php?id={iduser}\n\nThời gian: {time}'
    let msg = data.customLeave || defaultMsg

    msg = msg
      .replace(/\{name}/g, name)
      .replace(/\{type}/g, type)
      .replace(/\{iduser}/g, iduser)
      .replace(/\{author}/g, nameAuthor)
      .replace(/\{time}/g, time)

    // Send message
    await api.sendMessage(msg, threadID)
  } catch (error) {
    console.error('Error in leaveNoti:', error)
  }
}
