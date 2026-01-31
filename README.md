# 🤖 Mirai Bot Unofficial v3.0.0 🚀

<p align="center">
  <img src="https://i.imgur.com/sxW5AWa.png" alt="Logo" width="200" style="border-radius: 20px;">
  <br>
  <b>Một dự án Messenger Chatbot mạnh mẽ, bảo mật và dễ tùy biến.</b>
</p>

<p align="center">
  <a href="https://nodejs.org/dist/v20.17.0"><img src="https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Nodejs Support"></a>
  <a href="https://github.com/vuinguyen16003069/Mirai-Bot-V3"><img src="https://img.shields.io/github/stars/vuinguyen16003069/Mirai-Bot-V3?style=for-the-badge&color=yellow" alt="Stars"></a>
  <img src="https://img.shields.io/github/repo-size/vuinguyen16003069/Mirai-Bot-V3?style=for-the-badge&color=blue" alt="size">
  <img src="https://img.shields.io/badge/License-GPL--3.0-brightgreen?style=for-the-badge" alt="license">
  <img src="https://visitor-badge.laobi.icu/badge?page_id=vuinguyen16003069.Mirai-Bot-V3&style=for-the-badge" alt="Visitors">
</p>

---

## 📋 Mục lục

- [📝 Giới thiệu](#-giới-thiệu)
- [✨ Tính năng nổi bật](#-tính-năng-nổi-bật)
- [🔄 Những cải tiến](#-những-cải-tiến-mod-by-vuinguyen)
- [📜 Hướng dẫn cài đặt](#-hướng-dẫn-cài-đặt)
- [🚀 Khởi chạy](#-khởi-chạy)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [☎️ Liên hệ hỗ trợ](#-liên-hệ-hỗ-trợ)
- [📄 License](#-license)

---

## 📝 Giới thiệu

**Mirai Bot V3 Unofficial** là phiên bản kế thừa từ dự án của *Catalizcs* & *SpermLord*, được **DongDev** cập nhật và đặc biệt được Mod lại bởi **[Vuinguyen (G3K)](https://github.com/vuinguyen16003069)**.

> [!IMPORTANT]
> Bản Mod này tập trung tối ưu vào **Bảo mật**, **Hiệu suất hệ thống** và **Khả năng bảo trì lâu dài**.

---

## ✨ Tính năng nổi bật

| Tính năng | Chi tiết |
| :--- | :--- |
| **🤖 Automation** | Phản hồi tin nhắn, thực thi lệnh tự động trong nhóm. |
| **🛡️ Quản lý** | Anti-spam, duyệt nhóm tự động, quản trị viên thông minh. |
| **🎮 Giải trí** | Tài xỉu, Bầu cua (sử dụng link Imgur), Music, Game mini. |
| **🛠️ Công cụ** | Tải video (TikTok, Youtube), tra cứu thông tin nhanh. |
| **⚙️ Tùy biến** | Hệ thống Prefix linh hoạt, cấu hình `config.json` trực quan. |

---

## 🔄 Những cải tiến (Mod by Vuinguyen)

Dưới đây là những thay đổi quan trọng giúp bot vận hành ổn định trên Ubuntu/Linux:

- 🔒 **Security**: Chuyển đổi hoàn toàn sang `appstate.json` (Thay vì cookie truyền thống).
- ⚡ **Performance**: Downgrade `chalk` (v4) và `gradient-string` (v2) để đạt độ ổn định cao nhất trên Node 20.x.
- 🧹 **Auto-Clean**: Tự động dọn dẹp thư mục `cache` mỗi khi khởi động, tối ưu dung lượng VPS.
- 💎 **Code Quality**: Tích hợp **Biome** để linting và formatting code chuẩn chỉnh.
- 🚫 **Git Protection**: Đã cấu hình `.gitignore` để tránh leak `database.sqlite` và `fca-config.json`.

---

## 📜 Hướng dẫn cài đặt

### 💡 Yêu cầu hệ thống

- **Node.js**: v20.x trở lên ([Download](https://nodejs.org/))
- **Bộ nhớ**: Trống tối thiểu 1-2GB
- **Hệ điều hành**: Ubuntu (khuyên dùng), Windows hoặc Android (Termux)

### ⚙️ Các bước thực hiện

1. **Clone Source Code**
   ```bash
   git clone https://github.com/vuinguyen16003069/Mirai-Bot-V3.git
   cd Mirai-Bot-V3
   ```

2. **Cài đặt Dependencies**
   ```bash
   npm install
   ```

3. **Cấu hình hệ thống**
   - Chỉnh sửa ID Admin và tên bot tại file `config.json`
   - Tạo file `appstate.json` và dán mã bảo mật của tài khoản bot vào

---

## 🚀 Khởi chạy

```bash
npm start
```

Bot sẽ tự động khởi động và hiển thị thông tin đăng nhập.

---

## 🛠️ Troubleshooting

### Lỗi thường gặp

**1. ECONNREFUSED khi load GIF**
- Nguyên nhân: Server catbox.moe block IP
- Giải pháp: Bot sẽ tự động fallback chỉ gửi text

**2. Cannot find module '../../../utils/log'**
- Nguyên nhân: Path resolution issue trên server
- Giải pháp: Đã fix trong commit mới, pull code mới nhất

**3. Gradient stops error**
- Nguyên nhân: gradient-string array rỗng
- Giải pháp: Đã fix theme 'hacker' trong utils/log.js

**4. Checkpoint Facebook**
- Giải pháp: Dùng appstate mới, tránh login thường xuyên

### Logs quan trọng

- `[ LOGIN ] > Đăng nhập thành công` - Bot online
- `[ FCA-UNO ] > fca-unoffcial premium` - FCA hoạt động
- `[ LOADING ] > Loaded X commands` - Commands loaded

---

## ☎️ Liên hệ hỗ trợ

| Developer | Platform | Link |
| --- | --- | --- |
| **Vuinguyen (G3K)** | Facebook | [Kết nối](https://facebook.com/vuinguyen16003069) |
| **Vuinguyen (G3K)** | GitHub | [@vuinguyen16003069](https://github.com/vuinguyen16003069) |
| **DongDev** | Facebook | [Kết nối](https://facebook.com/DongDev-VN) |
| **DongDev** | GitHub | [@DongDev-VN](https://github.com/DongDev-VN) |

---

## 📄 License

Dự án được phát hành dưới giấy phép GPL-3.0. Vui lòng tuân thủ các điều khoản khi sử dụng và phát triển lại.

<p align="center">Made with ❤️ by Vuinguyen</p>