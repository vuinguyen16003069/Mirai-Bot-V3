module.exports.config = {
  name: 'qtv',
  version: '1.0.0',
  hasPermssion: 1,
  credits: 'Niiozic',
  description: 'Thêm hoặc xoá qtv',
  commandCategory: 'Nhóm',
  usages: '[test]',
  cooldowns: 5,
}
module.exports.run = async function ({ event, api, args, Threads }) {
  if (!args[0]) return api.sendMessage('⚠️ Lựa chọn qtv add [tag/reply]', event.threadID)
  const dataThread = (await Threads.getData(event.threadID)).threadInfo
  if (
    !dataThread.adminIDs.some((item) => item.id === api.getCurrentUserID()) &&
    !dataThread.adminIDs.some((item) => item.id === event.senderID)
  )
    return api.sendMessage(
      '❎ Bạn không đủ quyền hạn dùng lệnh này',
      event.threadID,
      event.messageID
    )
  let uid, uid1
  if (args[0] === 'add') {
    if (event.type === 'message_reply') {
      uid1 = event.senderID
      uid = event.messageReply.senderID
      api.sendMessage('📌 Thả cảm xúc tin nhắn này để xác nhận', event.threadID, (_error, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          type: 'add',
          messageID: info.messageID,
          author: uid1,
          userID: uid,
        })
        event.messageID
      })
    } else if (args.join().indexOf('@') !== -1) {
      uid = Object.keys(event.mentions)[0]
      uid1 = event.senderID
      api.sendMessage('📌 Thả cảm xúc tin nhắn này để xác nhận', event.threadID, (_error, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          type: 'add',
          messageID: info.messageID,
          author: uid1,
          userID: uid,
        })
        event.messageID
      })
    } else {
      uid1 = event.senderID
      api.sendMessage('📌 Thả cảm xúc tin nhắn này để xác nhận', event.threadID, (_error, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          type: 'add',
          messageID: info.messageID,
          author: uid1,
          userID: uid1,
        })
        event.messageID
      })
    }
  }
  if (args[0] === 'remove') {
    if (event.type === 'message_reply') {
      uid1 = event.senderID
      uid = event.messageReply.senderID
      api.sendMessage('📌 Thả cảm xúc tin nhắn này để xác nhận', event.threadID, (_error, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          type: 'remove',
          messageID: info.messageID,
          author: uid1,
          userID: uid,
        })
        event.messageID
      })
    } else if (args.join().indexOf('@') !== -1) {
      uid = Object.keys(event.mentions)[0]
      uid1 = event.senderID
      api.sendMessage('📌 Thả cảm xúc tin nhắn này để xác nhận', event.threadID, (_error, info) => {
        global.client.handleReaction.push({
          name: this.config.name,
          type: 'remove',
          messageID: info.messageID,
          author: uid1,
          userID: uid,
        })
        event.messageID
      })
    }
  }
}
module.exports.handleReaction = async ({ event, api, handleReaction, Users }) => {
  console.log(handleReaction)
  if (event.userID !== handleReaction.author) return
  let name
  if (handleReaction.type === 'add') {
    name = (await Users.getData(handleReaction.userID)).name
    api.changeAdminStatus(event.threadID, handleReaction.userID, true, editAdminsCallback)
    function editAdminsCallback(err) {
      if (err)
        return api.sendMessage(
          '❎ Bot không đủ quyền hạn để thêm quản trị viên',
          event.threadID,
          event.messageID
        )
      return api.sendMessage(`✅ Đã thêm ${name} làm qtv nhóm`, event.threadID, event.messageID)
    }
  }
  if (handleReaction.type === 'remove') {
    name = (await Users.getData(handleReaction.userID)).name
    api.changeAdminStatus(event.threadID, handleReaction.userID, false, editAdminsCallback)
    function editAdminsCallback(err) {
      if (err)
        return api.sendMessage(
          '❎ Bot không đủ quyền hạn để thêm quản trị viên',
          event.threadID,
          event.messageID
        )
      return api.sendMessage(`✅ Đã gỡ qtv của ${name}`, event.threadID, event.messageID)
    }
  }
}
