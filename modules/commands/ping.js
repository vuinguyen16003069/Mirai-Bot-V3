module.exports.config = {
  name: 'ping',
  version: '1.0.5',
  hasPermssion: 1,
  credits: 'Mirai Team',
  description: 'tag toàn bộ thành viên',
  commandCategory: 'group',
  usages: '[Text]',
  cooldowns: 80,
}

module.exports.run = async ({ api, event, args }) => {
  try {
    const botID = api.getCurrentUserID()
    let listAFK, listUserID
    if (global.moduleData.afk?.afkList) {
      listAFK = Object.keys(global.moduleData.afk.afkList || [])
    } else {
      listAFK = []
    }
    listUserID = event.participantIDs.filter((ID) => ID !== botID && ID !== event.senderID)
    listUserID = listUserID.filter((item) => !listAFK.includes(item))
    let body = args.length !== 0 ? args.join(' ') : 'Bạn đã bị quản trị viên xóa ra khỏi nhóm.',
      mentions = [],
      index = 0
    for (const idUser of listUserID) {
      body = `‎${body}`
      mentions.push({ id: idUser, tag: '‎', fromIndex: index - 1 })
      index -= 1
    }

    return api.sendMessage({ body, mentions }, event.threadID, event.messageID)
  } catch (e) {
    return console.log(e)
  }
}
