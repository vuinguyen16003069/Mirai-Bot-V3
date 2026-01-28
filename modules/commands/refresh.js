module.exports.config = {
  name: 'refresh',
  version: '2.1.0',
  hasPermssion: 1,
  credits: 'ReU',
  description: 'Làm mới data nhóm',
  commandCategory: 'Nhóm',
  usages: '[để trống hoặc nhập ID nhóm]',
  cooldowns: 5,
}

module.exports.run = async ({ event, args, api, Threads }) => {
  const { threadID, messageID } = event
  const targetID = args[0] || threadID

  try {
    const threadInfo = await api.getThreadInfo(targetID)

    // Kiểm tra xem dữ liệu có bị lỗi không (dựa trên thư viện)
    const isError =
      !threadInfo ||
      threadInfo.__status === 'unavailable' ||
      threadInfo.__status === 'cooldown' ||
      !threadInfo.threadName ||
      threadInfo.threadName === 'null' ||
      threadInfo.participantIDs.length === 0

    if (isError) {
      return api.sendMessage(
        `❌ Không thể lấy thông tin nhóm này.\n` +
          `💡 Mẹo: Hãy đảm bảo nhóm có tin nhắn gần đây, bot là thành viên và thử lại sau 5 phút nếu bị cooldown.`,
        threadID,
        messageID
      )
    }

    // Xử lý dữ liệu cuối cùng
    const threadName = threadInfo.threadName || threadInfo.name || 'Không tên'
    const adminList = threadInfo.adminIDs || []
    const qtv = Array.isArray(adminList) ? adminList.length : 0
    const participantCount = threadInfo.participantIDs ? threadInfo.participantIDs.length : 0

    // Cập nhật vào Database với dữ liệu mới nhất (Threads.setData sẽ merge và làm mới)
    await Threads.setData(targetID, { threadInfo })

    return api.sendMessage(
      `✅ Đã làm mới data nhóm thành công!\n` +
        `━━━━━━━━━━━\n` +
        `👨‍💻 Tên nhóm: ${threadName}\n` +
        `🔎 ID: ${targetID}\n` +
        `👥 Thành viên: ${participantCount}\n` +
        `📌 Quản trị viên: ${qtv} người`,
      threadID,
      messageID
    )
  } catch (error) {
    console.error('[REFRESH ERROR]', error)
    const errorMsg = error.message || 'Lỗi không xác định'
    return api.sendMessage(
      `❌ Lỗi hệ thống: ${errorMsg}\n💡 Thử lại sau hoặc kiểm tra quyền bot.`,
      threadID,
      messageID
    )
  }
}
