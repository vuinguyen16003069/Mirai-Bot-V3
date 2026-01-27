module.exports.config = {
  name: 'gỡ',
  version: '1.0.0',
  hasPermssion: 0,
  credits: 'HungCatMoi',
  description: 'Gỡ tin nhắn của Bot',
  commandCategory: 'Nhóm',
  usages: 'gỡ',
  usePrefix: false,
  cooldowns: 10,
  dependencies: [],
}

module.exports.run = async ({ api, event }) => {
  if (!event.messageReply) {
    return
  }
  if (event.type !== 'message_reply') {
    return api.sendMessage('❌ Bạn cần reply tin nhắn bot để gỡ.', event.threadID, event.messageID)
  }
  if (event.messageReply.senderID !== api.getCurrentUserID()) {
    return api.sendMessage('⚠️ Tin nhắn này không phải do bot gửi.', event.threadID, event.messageID)
  }

  return api.unsendMessage(event.messageReply.messageID, (err) => {
    if (err) {
      return api.sendMessage('⚠️ Đã xảy ra lỗi khi gỡ tin nhắn.', event.threadID, event.messageID)
    }
  })
}
