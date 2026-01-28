// modules/commands/Nhóm/setprefix.js
module.exports.config = {
  name: 'setprefix',
  version: '2.0.33', // Tăng version để theo dõi thay đổi
  hasPermssion: 1,
  credits: 'BraSL mod by G3K',
  description: 'Đặt lại prefix của nhóm',
  commandCategory: 'Nhóm',
  usages: '[prefix/reset]',
  cooldowns: 10,
};

module.exports.run = async ({ api, event, args, Threads }) => {
  const { threadID, messageID } = event;
  const prefix = args[0]?.trim();

  if (!prefix) {
    return api.sendMessage('❎ Prefix không được để trống!', threadID, messageID);
  }

  try {
    if (prefix.toLowerCase() === 'reset') {
      // Reset prefix về mặc định
      await Threads.setData(threadID, { prefix: null });

      // Cập nhật hoặc xóa cache
      if (global.prefixCache) {
        delete global.prefixCache[threadID]; // Xóa cache để buộc lấy prefix mới từ DB
      }

      api.sendMessage(
        `✅ Đã reset prefix về mặc định: ${global.config.PREFIX}`,
        threadID,
        async (err) => {
          if (!err) {
            // Sau đó mới đổi biệt danh bot
            const botID = api.getCurrentUserID();
            await api.changeNickname(`『${global.config.PREFIX}』• ${global.config.BOTNAME}`, threadID, botID);
            console.log(`✅ Reset prefix cho thread ${threadID} về: ${global.config.PREFIX}`);
          }
        },
        messageID,
      );
    } else {
      await Threads.setData(threadID, { prefix });

      // Cập nhật hoặc xóa cache
      if (global.prefixCache) {
        global.prefixCache[threadID] = prefix; // Cập nhật cache với prefix mới
      }

      api.sendMessage(
        `✅ Prefix của nhóm đã được đổi thành: ${prefix}`,
        threadID,
        async (err) => {
          if (!err) {
            // Sau đó mới đổi biệt danh bot
            const botID = api.getCurrentUserID();
            await api.changeNickname(`『${prefix}』• ${global.config.BOTNAME}`, threadID, botID);
          }
        },
        messageID,
      );
    }
  } catch (e) {
    console.error('❎ Lỗi khi xử lý setprefix:', e);
    return api.sendMessage(`❎ Đã có lỗi xảy ra khi thay đổi prefix: ${e.message}`, threadID, messageID);
  }
};

module.exports.handleEvent = async ({ api, event, Threads }) => {
  if (!event.body || event.body.toLowerCase() !== 'prefix') {
    return;
  }
  const { threadID, messageID } = event;

  try {
    // Lấy prefix từ database
    const threadData = await Threads.getData(threadID);
    const prefix = threadData?.prefix && threadData.prefix.trim() !== '' ? threadData.prefix : global.config.PREFIX;

    // Cập nhật cache nếu cần
    if (global.prefixCache) {
      global.prefixCache[threadID] = prefix;
    }

    api.sendMessage(`Prefix hệ thống: ${global.config.PREFIX}\nPrefix nhóm của bạn: ${prefix}`, threadID, messageID);
  } catch (e) {
    console.error('❎ Lỗi khi lấy prefix từ DB:', e);
    api.sendMessage('❎ Không thể lấy prefix của nhóm này!', threadID, messageID);
  }
};
