// modules/commands/Game/tx.js
const path = require('node:path');
const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');

exports.config = {
  name: 'tx',
  version: '2.0.0',
  hasPermssion: 0,
  credits: 'DC-Nam mod by G3K',
  description: 'Tài xỉu nhiều người chơi',
  commandCategory: 'Game',
  usages:
    '\nDùng txiu create để tạo bàn\n> Để tham gia cược hãy chat: tài/xỉu + [số_tiền/allin/%/k/m/b/kb/mb/gb/g]\n> Xem thông tin bàn chat: info\n> Để rời bàn hãy chat: rời\n> bắt đầu xổ chat: xổ\nCông thức:\nĐơn vị sau là số 0\nk 12\nm 15\nb 18\nkb 21\nmb 24\ngb 27\ng 36',
  cooldowns: 5,
};

// Hàm định dạng số tiền
const formatMoney = (amount) => {
  try {
    const num = Number(amount);
    if (Number.isNaN(num)) {
      throw new Error('Số tiền không hợp lệ');
    }
    return `${num.toLocaleString('en-EN')} $`;
  } catch (error) {
    return `Lỗi: ${error.message}`;
  }
};

let data = {};
const save = async (_d) => {
  try {
    // fs-extra provides writeJson to write object as JSON
    await fs.writeJson(path_file, data, { spaces: 2 });
  } catch (err) {
    console.error('Lỗi khi lưu status-hack.json:', err?.message || err);
  }
};
// Khởi tạo file cấu hình bất đồng bộ, dùng IIFE để tránh top-level await
(async () => {
  try {
    if (await fs.pathExists(path_file)) {
      data = await fs.readJson(path_file);
    } else {
      await save();
    }
  } catch (err) {
    console.error('Lỗi khi khởi tạo dữ liệu status-hack.json:', err?.message || err);
  }
})();

let d = global.data_command_ban_tai_xiu;
if (!d) {
  d = global.data_command_ban_tai_xiu = {};
}
if (!d.s) {
  d.s = {};
}
if (!d.t) {
  d.t = setInterval(() => Object.entries(d.s).map(($) => ($[1] <= Date.now() ? delete d.s[$[0]] : '')), 1000);
}

const rate = 1;
const bet_money_min = 50;
const select_values = { t: 'tài', x: 'xỉu' };
const units = {
  k: 3, // 10^3 = 1000
  m: 6, // 10^6 = 1000000
  b: 9, // 10^9 = 1000000000 (1 tỷ)
  kb: 12, // 10^12 = 1000000000000
  mb: 15, // 10^15 = 1000000000000000
  gb: 18, // 10^18 = 1000000000000000000
  tb: 21, // 10^21
};

const dicePhotos = [
  "https://imgur.com/qn9PXUX.jpg",
  "https://imgur.com/hbQISCE.jpg",
  "https://imgur.com/gyskBsm.jpg",
  "https://imgur.com/vHMWTc2.jpg",
  "https://imgur.com/HvA4KVd.jpg",
  "https://imgur.com/JVuky8r.jpg"
];

const admin_tx = [global.config.ADMINBOT[0]];
const _id_box = global.config.BOXNOTI;

async function mergeImages(imagePaths, outputPath) {
  try {
    const images = await Promise.all(imagePaths.map((path) => loadImage(path)));
    const totalWidth = images.reduce((sum, img) => sum + img.width, 0);
    const maxHeight = Math.max(...images.map((img) => img.height));
    const canvas = createCanvas(totalWidth, maxHeight);
    const ctx = canvas.getContext('2d');
    let xOffset = 0;
    for (const img of images) {
      ctx.drawImage(img, xOffset, 0);
      xOffset += img.width;
    }
    await fs.ensureDir(path.dirname(outputPath));
    const buffer = canvas.toBuffer('image/jpeg');
    await fs.writeFile(outputPath, buffer);
    return outputPath;
  } catch (error) {
    console.error(`Lỗi hợp nhất hình ảnh: ${error.message}`, '[ TAIXIU ERROR ]');
    throw error;
  }
}

exports.run = (o) => {
  const { args, senderID: sid, threadID: tid, messageID: mid } = o.event;
  const send = (msg, callback) => o.api.sendMessage(msg, tid, undefined, callback);
  if (/^hack$/.test(o.args[0]) && admin_tx.includes(sid)) {
    return o.api.getThreadList(100, null, ['INBOX'], (_err, res) => {
      const thread_list = res.filter(($) => $.isSubscribed && $.isGroup);
      const message = `${thread_list.map(($, i) => `${i + 1}. ${data[$.threadID] === true ? 'on' : 'off'} - ${$.name}`).join('\n')}\n\n-> Reply (phản hồi) theo stt để on/off`;
      send(message, (_err2, res2) => {
        const replyObj = Object.assign({}, res2, {
          name: exports.config.name,
          type: 'status.hack',
          o,
          thread_list,
        });
        global.client.handleReply.push(replyObj);
      });
    });
  }
  if (/^(create|c|-c)$/.test(o.args[0])) {
    if (tid in d) {
      return send('❎ Nhóm đã tạo bàn tài xỉu rồi!');
    }
    d.s[sid] = Date.now() + 1000 * 60 * 5;
    d[tid] = {
      author: sid,
      players: [],
      set_timeout: setTimeout(
        () => {
          delete d[tid];
          send('⛔ Đã trôi qua 5p không có ai xổ, tiến hành hủy bàn', null);
        },
        1000 * 60 * 5,
      ),
    };
    send('✅ Tạo bàn tài xỉu thành công\n📌 Ghi tài/xỉu + số tiền để cược');
  } else if (/^end$/.test(o.args[0])) {
    if (!d[tid]) {
      return send(`❎ Nhóm chưa tạo bàn tài xỉu để tạo hãy dùng lệnh: ${o.args[0]} create`);
    }
    if (global.data.threadInfo.get(tid).adminIDs.some(($) => $.id === sid)) {
      return send(
        `📌 QTV đã yêu cầu kết thúc bàn tài xỉu những người đặt cược sau đây thả cảm xúc để xác nhận.\n\n${d[tid].players.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)}`).join('\n')}\n\nTổng cảm xúc đạt ${Math.ceil(
          (d[tid].players.length * 50) / 100,
        )}/${d[tid].players.length} người bàn tài xỉu sẽ kết thúc.`,
        (_err2, res2) => {
          const reactObj = Object.assign({}, res2, {
            name: exports.config.name,
            p: d[tid].players,
            r: 0,
          });
          global.client.handleReaction.push(reactObj);
        },
      );
    }
  } else {
    send(exports.config.usages);
  }
};

exports.handleEvent = async (o) => {
  const { args = [], senderID: sid, threadID: tid, messageID: mid } = o.event;
  const send = (msg, mid, callback) => {
    let messageId = mid;
    let cb = callback;
    if (typeof messageId === 'function') {
      cb = messageId;
      messageId = undefined;
    }
    o.api.sendMessage(msg, tid, messageId, cb);
  };
  const select = ((t) =>
    /^(tài|tai|t)$/.test(t)
      ? 't'
      : /^(xỉu|xiu|x)$/.test(t)
        ? 'x'
        : /^(rời|leave)$/.test(t)
          ? 'l'
          : /^info$/.test(t)
            ? 'i'
            : /^xổ$/.test(t)
              ? 'o'
              : /^(end|remove|xóa)$/.test(t)
                ? 'r'
                : null)((args[0] || '').toLowerCase());
  const money = async (id) => {
    const data = await o.Currencies.getData(id);
    const balance = data?.money;
    return balance ? BigInt(Math.floor(Number(balance.toString() || '0'))) : BigInt(0);
  };
  let bet_money = args[1];
  let p;
  if (!(tid in d) || args.length === 0 || select == null) {
    return;
  }
  p = d[tid].players;
  if (d[tid]?.playing === true) {
    return send('❎ Bàn đang xổ không thể thực hiện hành động');
  }
  if (['t', 'x'].includes(select)) {
    if (/^(allin|all)$/.test(bet_money)) {
      bet_money = await money(sid);
    } else if (/^[0-9]+%$/.test(bet_money)) {
      const percent = BigInt(bet_money.match(/^[0-9]+/)[0]);
      const userMoney = await money(sid);
      bet_money = (userMoney * percent) / BigInt(100);
      bet_money = BigInt(Math.floor(Number(bet_money.toString())));
    } else {
      const unit = Object.entries(units).find(($) => RegExp(`^[0-9]+${$[0]}$`, 'i').test(bet_money));
      if (unit) {
        const numStr = bet_money.replace(new RegExp(`${unit[0]}$`, 'i'), '');
        if (!/^[0-9]+$/.test(numStr)) {
          return send('❎ Số tiền không hợp lệ');
        }
        bet_money = BigInt(numStr + '0'.repeat(unit[1]));
      } else {
        bet_money = !Number.isNaN(bet_money) ? BigInt(bet_money) : false;
      }
    }
    if (!bet_money || Number.isNaN(Number(bet_money.toString()))) {
      return send('❎ Số tiền phải là 1 số or allin/all');
    }
    if (bet_money < BigInt(bet_money_min)) {
      return send(`❎ Vui lòng đặt ít nhất ${formatMoney(bet_money_min)}`);
    }
    const userMoney = await money(sid);
    if (bet_money > userMoney) {
      return send('❎ Bạn không đủ tiền');
    }
    const player = p.find(($) => $.id === sid);
    if (player) {
      send(
        `✅ Đã thay đổi cược từ ${select_values[player.select]} ${formatMoney(player.bet_money)} sang ${select_values[select]} ${formatMoney(bet_money)}`,
      );
      player.select = select;
      player.bet_money = bet_money;
    } else {
      p.push({ id: sid, select, bet_money });
      send(`✅ Bạn đã cược ${select_values[select]} với số tiền ${formatMoney(bet_money)}`);
    }
  }
  if (select === 'l') {
    if (sid === d[tid].author) {
      clearTimeout(d[tid].set_timeout);
      delete d[tid];
      return send('✅ Rời bàn thành công vì bạn là chủ bàn nên bàn sẽ bị huỷ');
    }
    if (p.some(($) => $.id === sid)) {
      p.splice(
        p.findIndex(($) => $.id === sid),
        1,
      );
      return send('✅ Rời bàn thành công');
    }
    return send('❎ Bạn không có trong bàn tài xỉu');
  }
  if (select === 'i') {
    return send(
      `🎰 Tỉ lệ ăn 1:${rate}\n👤 Tổng ${p.length} người tham gia gồm:\n${p.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)} cược ${formatMoney($.bet_money)} vào (${select_values[$.select]})\n`).join('')}\n📌 Chủ bàn: ${global.data.userName.get(d[tid].author)}`,
    );
  }
  if (select === 'o') {
    if (sid !== d[tid].author) {
      return send('❎ Bạn không phải chủ bàn nên không thể bắt đầu xổ');
    }
    if (p.length === 0) {
      return send('❎ Chưa có ai tham gia đạt cược nên không thể bắt đầu xổ');
    }
    d[tid].playing = true;
    const dices = [0, 0, 0].map(() => (Math.random() * 6 + 1) << 0);
    const sum = dices.reduce((s, $) => s + $, 0);
    const winner = sum > 10 ? 't' : 'x';
    const winner_players = p.filter(($) => $.select === winner);
    const lose_players = p.filter(($) => $.select !== winner);
    const outputPath = path.join(__dirname, 'cache', 'merged_dice.jpg');
    const diceImages = dices.map(($) => dicePhotos[$ - 1]);
    try {
      await mergeImages(diceImages, outputPath);

      // Tạo chuỗi thông báo, thực hiện tăng/giảm tiền trước khi gửi
      const winnersText = winner_players
        .map(($, i) => {
          const crease_money = $.bet_money * BigInt(rate);
          try {
            o.Currencies.increaseMoney($.id, Number(crease_money.toString()));
          } catch (e) {
            console.error('Lỗi khi tăng tiền cho người thắng:', e?.message);
          }
          return `${i + 1}. ${global.data.userName.get($.id)} chọn (${select_values[$.select]})\n+${formatMoney(crease_money)}`;
        })
        .join('\n');

      const losersText = lose_players
        .map(($, i) => {
          try {
            o.Currencies.decreaseMoney($.id, Number($.bet_money.toString()));
          } catch (e) {
            console.error('Lỗi khi trừ tiền cho người thua:', e?.message);
          }
          return `${i + 1}. ${global.data.userName.get($.id)} chọn (${select_values[$.select]})\n-${formatMoney($.bet_money)}`;
        })
        .join('\n');

      const messageBody = `🎲 Xúc xắc: ${dices.join('|')} - ${sum} điểm (${select_values[winner]})\n👑 Những người thắng:\n${winnersText}\n\n💸 Những người thua:\n${losersText}\n\n👤 Chủ bàn: ${global.data.userName.get(d[tid].author)}`;

      await new Promise((resolve, reject) => {
        o.api.sendMessage(
          {
            body: messageBody,
            attachment: fs.createReadStream(outputPath),
          },
          tid,
          (err, info) => {
            fs.remove(outputPath).catch((err) => console.error('Lỗi xóa file:', err));
            if (err) {
              console.error('Lỗi gửi ảnh tài xỉu:', err);
              try {
                o.api.sendMessage(`❎ Lỗi khi gửi ảnh: ${err.message}`, tid);
              } catch (e) {
                console.error('Lỗi khi thông báo lỗi gửi ảnh:', e?.message);
              }
              return reject(err);
            }
            resolve(info);
          },
        );
      });
    } catch (error) {
      console.error('Lỗi hợp nhất hình ảnh:', error);
      await send(`❎ Lỗi khi xử lý hình ảnh xúc xắc: ${error.message}`);
    }
    if (data[tid] === true) {
      for (const id of admin_tx) {
        await send(
          `🎲 Xúc xắc: ${dices.join('.')} - ${sum} điểm (${select_values[winner]})\n🎰 Tỉ lệ ăn 1:${rate}\n🏆 Tổng Kết:\n👑 Những người thắng:\n${winner_players
            .map(($, i) => {
              const crease_money = $.bet_money * BigInt(rate);
              return `${i + 1}. ${global.data.userName.get($.id)} chọn (${select_values[$.select]})\n⬆️ ${formatMoney(crease_money)}`;
            })
            .join(
              '\n',
            )}\n\n💸 Những người thua:\n${lose_players.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)} chọn (${select_values[$.select]})\n⬇️ ${formatMoney($.bet_money)}`).join('\n')}\n\n👤 Chủ bàn: ${global.data.userName.get(
            d[tid].author,
          )}\n🏘️ Nhóm: ${global.data.threadInfo.get(tid).threadName}`,
          id,
        ).then((res) => {
          setTimeout(() => send('Đã xổ ☑️', res.messageID, id), 1000);
          const replyObj = Object.assign({}, res, {
            name: exports.config.name,
            type: 'change.result.dices',
            o,
          });
          replyObj.cb = (new_result) => {
            dices[0] = new_result[0];
            dices[1] = new_result[1];
            dices[2] = new_result[2];
            return new_result;
          };
          global.client.handleReply.push(replyObj);
        });
      }
    }
    clearTimeout(d[tid].set_timeout);
    delete d[tid];
  }
  if (select === 'r') {
    if (global.data.threadInfo.get(tid).adminIDs.some(($) => $.id === sid)) {
      return send(
        `QTV đã yêu cầu kết thúc bàn tài xỉu những người đặt cược sau đây thả cảm xúc để xác nhận.\n\n${p.map(($, i) => `${i + 1}. ${global.data.userName.get($.id)}`).join('\n')}\n\nTổng cảm xúc đạt ${Math.ceil((p.length * 50) / 100)}/${p.length} người bàn tài xỉu sẽ kết thúc.`,
        (_err2, res2) => {
          const reactObj = Object.assign({}, res2, {
            name: exports.config.name,
            p,
            r: 0,
          });
          global.client.handleReaction.push(reactObj);
        },
      );
    }
  }
};

exports.handleReply = async (o) => {
  const _ = o.handleReply;
  const { args, senderID: sid, threadID: tid, messageID: mid } = o.event;
  const send = (msg, mid, callback) => {
    let messageId = mid;
    let cb = callback;
    if (typeof messageId === 'function') {
      cb = messageId;
      messageId = undefined;
    }
    o.api.sendMessage(msg, tid, messageId, cb);
  };
  if (sid === o.api.getCurrentUserID()) {
    return;
  }
  if (_.type === 'status.hack' && admin_tx.includes(sid)) {
    const list = args
      .filter(($) => Number.isFinite($) && !!_.thread_list[$ - 1])
      .map(($) => {
        const idx = Number($) - 1;
        const thread = _.thread_list[idx];
        const toggled = (data[thread.threadID] = !data[thread.threadID]);
        return `${$}. ${thread.name} - ${toggled ? 'on' : 'off'}`;
      })
      .join('\n');
    try {
      await send(list).catch(() => {});
    } catch (e) {}
    await save();
    return;
  }
  if (_.type === 'change.result.dices') {
    if (args.length === 3 && args.every(($) => Number.isFinite($) && $ > 0 && $ < 7)) {
      _.cb(args.map(Number));
      return send('✅ Đã thay đổi kết quả tài xỉu');
    }
    if (/^(tài|tai|t|xỉu|xiu|x)$/.test(args[0].toLowerCase())) {
      return send(
        `✅ Đã thay đổi kết quả thành ${args[0]}\n🎲 Xúc xắc: ${_.cb(/^(tài|tai|t)$/.test(args[0].toLowerCase()) ? dices_sum_min_max(11, 18) : dices_sum_min_max(3, 10)).join('.')}`,
      );
    }
    return send('Vui lòng reply tài/xỉu hoặc 3 số của mặt xúc xắc\nVD: 2 3 4');
  }
};

exports.handleReaction = async (o) => {
  const _ = o.handleReaction;
  const { reaction, userID, threadID: tid, messageID: mid } = o.event;
  const send = (msg, mid, callback) => {
    let messageId = mid;
    let cb = callback;
    if (typeof messageId === 'function') {
      cb = messageId;
      messageId = undefined;
    }
    o.api.sendMessage(msg, tid, messageId, cb);
  };
  if (!(tid in d)) {
    return send('❎ Bàn tài xỉu đã kết thúc không thể bỏ phiếu tiếp');
  }
  if (_.p.some(($) => $.id === userID)) {
    const reactionObj = _;
    reactionObj.r = (reactionObj.r || 0) + 1;
    await send(`📌 Đã có ${reactionObj.r}/${reactionObj.p.length} phiếu`);
    if (reactionObj.r >= Math.ceil((reactionObj.p.length * 50) / 100)) {
      clearTimeout(d[tid].set_timeout);
      delete d[tid];
      return send('✅ Đã hủy bàn tài xỉu thành công');
    }
  }
};

const dices_sum_min_max = (sMin, sMax) => {
  while (true) {
    const i = [0, 0, 0].map((_$) => (Math.random() * 6 + 1) << 0);
    const s = i[0] + i[1] + i[2];
    if (s >= sMin && s <= sMax) {
      return i;
    }
  }
};
