// <===> modules/events/anti.js <===//
module.exports.config = {
  name: 'anti',
  eventType: [
    'log:thread-name',
    'log:thread-image',
    'log:thread-icon',
    'log:thread-color',
    'log:thread-admins',
    'log:unsubscribe',
  ],
  version: '1.0.0',
  credits: 'BraSL',
  description: 'Anti change Box chat - Event Handler',
}

const { readFileSync } = require('fs-extra')
const path = require('path')
const fs = require('node:fs')

module.exports.run = async ({ event, api }) => {
  const { threadID, logMessageType, logMessageData } = event

  // Paths to data files
  const antiPath = path.join(__dirname, '..', 'commands', 'data', 'anti.json')
  const emojiPath = path.join(__dirname, '..', 'commands', 'data', 'antiemoji.json')
  const themePath = path.join(__dirname, '..', 'commands', 'data', 'antitheme.json')
  const qtvPath = path.join(__dirname, '..', 'commands', 'data', 'antiqtv.json')

  // Load anti.json
  let dataAnti
  try {
    dataAnti = JSON.parse(readFileSync(antiPath, 'utf8'))
  } catch {
    dataAnti = { boxname: [], boximage: [], antiNickname: [], antiout: {} }
  }
  if (!Array.isArray(dataAnti.boxname)) dataAnti.boxname = []
  if (!Array.isArray(dataAnti.boximage)) dataAnti.boximage = []
  if (!Array.isArray(dataAnti.antiNickname)) dataAnti.antiNickname = []
  if (typeof dataAnti.antiout !== 'object' || dataAnti.antiout === null) dataAnti.antiout = {}

  // Load emoji data
  let emojiData
  try {
    emojiData = JSON.parse(fs.readFileSync(emojiPath, 'utf8'))
  } catch {
    emojiData = {}
  }

  // Load theme data
  let themeData
  try {
    themeData = JSON.parse(fs.readFileSync(themePath, 'utf8'))
  } catch {
    themeData = {}
  }

  // Load qtv data
  let qtvData
  try {
    qtvData = JSON.parse(fs.readFileSync(qtvPath, 'utf8'))
  } catch {
    qtvData = {}
  }

  switch (logMessageType) {
    case 'log:thread-name': {
      const nameItem = dataAnti.boxname.find((item) => item.threadID === threadID)
      if (nameItem) {
        api.setTitle(nameItem.name, threadID, () => {
          api.sendMessage('🚫 Phát hiện đổi tên nhóm! Đã khôi phục tên cũ.', threadID)
        })
      }
      break
    }
    case 'log:thread-image': {
      const imageItem = dataAnti.boximage.find((item) => item.threadID === threadID)
      if (imageItem) {
        // Download image and set
        const axios = require('axios')
        const { pipeline } = require('node:stream/promises')
        const fs = require('node:fs')
        const tempPath = path.join(__dirname, '..', 'commands', 'cache', `temp_${threadID}.jpg`)
        try {
          const response = await axios.get(imageItem.url, { responseType: 'stream' })
          await pipeline(response.data, fs.createWriteStream(tempPath))
          api.changeGroupImage(fs.createReadStream(tempPath), threadID, () => {
            fs.unlink(tempPath, () => {})
            api.sendMessage('🚫 Phát hiện đổi ảnh nhóm! Đã khôi phục ảnh cũ.', threadID)
          })
        } catch (err) {
          console.error('Error restoring group image:', err)
        }
      }
      break
    }
    case 'log:thread-icon': {
      if (emojiData[threadID]?.emojiEnabled) {
        api.changeThreadEmoji(emojiData[threadID].emoji, threadID, () => {
          api.sendMessage('🚫 Phát hiện đổi emoji nhóm! Đã khôi phục emoji cũ.', threadID)
        })
      }
      break
    }
    case 'log:thread-color': {
      if (themeData[threadID]?.themeEnabled) {
        api.changeThreadColor(themeData[threadID].themeid, threadID, () => {
          api.sendMessage('🚫 Phát hiện đổi chủ đề nhóm! Đã khôi phục chủ đề cũ.', threadID)
        })
      }
      break
    }
    case 'log:thread-admins': {
      if (qtvData[threadID]) {
        // Logic to revert admin changes if needed
        // This might be complex, perhaps check if bot is still admin or revert changes
        api.sendMessage('🚫 Phát hiện thay đổi QTV! (Chức năng đang phát triển)', threadID)
      }
      break
    }
    case 'log:unsubscribe': {
      if (dataAnti.antiout[threadID]) {
        const leftUserId = logMessageData.leftParticipantFbId
        api.addUserToGroup(leftUserId, threadID, () => {
          api.sendMessage(
            `🚫 ${logMessageData.leftParticipantFbId} đã out nhóm! Đã thêm lại.`,
            threadID
          )
        })
      }
      break
    }
  }
}
