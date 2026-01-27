const axios = require('axios')
const fs = require('node:fs')

module.exports = {
  config: {
    name: 'note',
    version: '0.0.1',
    hasPermssion: 3,
    credits: 'DC-Nam',
    description: 'Upload code to paste.rs',
    commandCategory: 'Admin',
    usages: '[]',
    prefix: false,
    cooldowns: 3,
  },
  run: async (o) => {
    const name = module.exports.config.name
    const url = o.event?.messageReply?.args?.[0] || o.args[1]
    const path = `${__dirname}/${o.args[0]}`
    const send = (msg) =>
      new Promise((r) =>
        o.api.sendMessage(msg, o.event.threadID, (_err, res) => r(res), o.event.messageID)
      )

    try {
      if (/^https:\/\//.test(url)) {
        return send(`🔗 File: ${path}\n\nThả cảm xúc để xác nhận thay thế nội dung file`).then(
          (res) => {
            res = {
              ...res,
              name,
              path,
              o,
              url,
              action: 'confirm_replace_content',
            }
            global.client.handleReaction.push(res)
          }
        )
      } else {
        //if (o.args[0] === 'edit' && o.args[1])path = `${__dirname}/${o.args[1]}`;
        if (!fs.existsSync(path)) return send(`❎ Đường dẫn file không tồn tại để export`)
        const content = fs.readFileSync(path, 'utf8')
        const response = await axios.post('https://paste.rs/', content, {
          headers: {
            'Content-Type': 'text/plain'
          }
        })
        const url = response.data.trim()
        return send(
          `📝 Raw: ${url}\n────────────────\n• File: ${path}\n\n📌 Thả cảm xúc để upload code`
        ).then((res) => {
          res = {
            ...res,
            name,
            path,
            o,
            url,
            action: 'confirm_replace_content',
          }
          global.client.handleReaction.push(res)
        })
      }
    } catch (e) {
      console.error(e)
      send(e.toString())
    }
  },
  handleReaction: async (o) => {
    const _ = o.handleReaction
    const send = (msg) =>
      new Promise((r) =>
        o.api.sendMessage(msg, o.event.threadID, (_err, res) => r(res), o.event.messageID)
      )

    try {
      if (o.event.userID !== _.o.event.senderID) return

      switch (_.action) {
        case 'confirm_replace_content':
          {
            const content = (
              await axios.get(_.url, {
                responseType: 'text',
              })
            ).data

            fs.writeFileSync(_.path, content)
            send(`✅ Đã upload code thành công\n\n🔗 File: ${_.path}`).then((res) => {
              res = {
                ..._,
                ...res,
              }
              global.client.handleReaction.push(res)
            })
          }
          break
        default:
          break
      }
    } catch (e) {
      console.error(e)
      send(e.toString())
    }
  },
}
