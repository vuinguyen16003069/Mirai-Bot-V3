const axios = require('axios')
const BASE_URL = 'https://api.satoru.click/api/downall?url='

this.config = {
  name: 'autodown',
  version: '1.0.0',
  hasPermssion: 2,
  credits: 'DongDev', //Thay credit làm 🐶
  description: 'Autodown Facebook, Tiktok, YouTube, Instagram, Bilibili, Douyin, Capcut, Threads',
  commandCategory: 'Công cụ',
  usages: '[]',
  cooldowns: 5,
  prefix: true,
}
this.handleEvent = async ({ api, event, args }) => {
  if (event.senderID === api.getCurrentUserID()) return
  if (!args) return
  const stream = (url, ext = 'jpg') =>
    require('axios')
      .get(url, { responseType: 'stream' })
      .then((res) => {
        res.data.path = `tmp.${ext}`
        return res.data
      })
      .catch((_e) => null)
  const send = (msg) => api.sendMessage(msg, event.threadID, event.messageID)
  const head = (app) => `[ AUTODOWN - ${app} ]\n────────────────`
  for (const url of args) {
    if (/(^https:\/\/)(\w+\.|m\.)?(facebook|fb)\.(com|watch)\//.test(url)) {
      const res = (await axios.get(`${BASE_URL}${encodeURIComponent(url)}`)).data
      if (res.success && res.data.attachment && res.data.attachment.length > 0) {
        const attachment = []
        for (const attachmentItem of res.data.attachment) {
          if (attachmentItem.type === 'Video') {
            attachment.push(await stream(attachmentItem.url, 'mp4'))
          } else if (attachmentItem.type === 'Photo') {
            attachment.push(await stream(attachmentItem.url, 'jpg'))
          }
        }
        send({
          body: `${head('FACEBOOK')}\n⩺ Tiêu đề: ${res.data.title || 'Không có tiêu đề'}\n⩺ Tác giả: ${res.data.author || 'unknown'}`.trim(),
          attachment,
        })
      }
    } else if (
      /^(https:\/\/)(www\.|vt\.|vm\.|m\.|web\.|v\.|mobile\.)?(tiktok\.com|t\.co|twitter\.com|youtube\.com|instagram\.com|bilibili\.com|douyin\.com|capcut\.com|threads\.net)\//.test(
        url
      )
    ) {
      const platform = /tiktok\.com/.test(url)
        ? 'TIKTOK'
        : /twitter\.com/.test(url)
          ? 'TWITTER'
          : /youtube\.com/.test(url)
            ? 'YOUTUBE'
            : /instagram\.com/.test(url)
              ? 'INSTAGRAM'
              : /bilibili\.com/.test(url)
                ? 'BILIBILI'
                : /douyin\.com/.test(url)
                  ? 'DOUYIN'
                  : /threads\.net/.test(url)
                    ? 'THREADS'
                    : /capcut\.com/.test(url)
                      ? 'CAPCUT'
                      : 'UNKNOWN'
      const res = (await axios.get(`${BASE_URL}${encodeURIComponent(url)}`)).data
      const attachments = []
      if (res.success && res.data.attachment && res.data.attachment.length > 0) {
        for (const at of res.data.attachment) {
          if (at.type === 'Video') {
            attachments.push(await stream(at.url, 'mp4'))
          } else if (at.type === 'Photo') {
            attachments.push(await stream(at.url, 'jpg'))
          } else if (at.type === 'Audio') {
            attachments.push(await stream(at.url, 'mp3'))
          }
        }
        send({
          body: `${head(platform)}\n⩺ Tiêu đề: ${res.data.title || 'Không có tiêu đề'}\n⩺ Tác giả: ${res.data.author || 'unknown'}`,
          attachment: attachments,
        })
      }
    }
  }
}

this.run = async () => {}
