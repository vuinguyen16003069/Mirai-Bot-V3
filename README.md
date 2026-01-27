# Mirai Bot Unofficial🤖<sub><sub>v3.0.0🚀</sub></sub>
<p align="center">
    <a href="https://nodejs.org/dist/v20.17.0"><img src="https://img.shields.io/badge/Nodejs%20Support-20.x-brightgreen.svg?style=flat-square" alt="Nodejs Support v20.x"></a>
    <img alt="size" src="https://img.shields.io/github/repo-size/vuinguyen16003069/Mirai-Bot-V3.svg?style=flat-square&label=size">
    <img alt="code-version" src="https://img.shields.io/badge/dynamic/json?color=red&label=code%20version&prefix=v&query=%24.version&url=https://raw.githubusercontent.com/vuinguyen16003069/Mirai-Bot-V3/refs/heads/main/package.json&style=flat-square">
    <a href="https://github.com/vuinguyen16003069/Mirai-Bot-V3/commits"><img alt="Commits" src="https://img.shields.io/github/commit-activity/m/vuinguyen16003069/Mirai-Bot-V3.svg?label=commit&style=flat-square"></a>
<img alt="Visitors" src="https://visitor-badge.laobi.icu/badge?page_id=vuinguyen16003069.Mirai-Bot-V3">
<img alt="size" src="https://img.shields.io/badge/license-GPL--3.0-green?style=flat-square&color=brightgreen">
<a href="https://github.com/vuinguyen16003069/Mirai-Bot-V3"><img src="https://i.imgur.com/sxW5AWa.png" alt="Logo"></a>
<p align="center">
    A Simple MiraiBot for starting a Messenger Chatbot.
    <br />
    <br />

## 📋 Table of Contents
- [📝 Introduce](#-introduce)
- [✨ Features](#-features)
- [🔄 Changes (Mod by Vuinguyen)](#-changes-mod-by-vuinguyen)
- [📜 Installation](#-installation)
- [📚 Contributing](#-contributing)
- [☎️ Contact](#️-contact)
- [📄 License](#-license)
    
## 📝 **introduce**
<p>
<strong>Mirai Bot V3 Unofficial</strong> Là một dự án được DongDev update và tiếp tục phát triển từ project Mirai-V2 của Catalizcs and SpermLord xây dựng. Được mod lại bởi <strong><a href="https://www.facebook.com/vui.nguyen.quang.2025">Vuinguyen</a></strong> (<a href="https://github.com/vuinguyen16003069">GitHub</a>) với các cải tiến về bảo mật, hiệu suất và bảo trì code.
</p>

## ✨ **Features**
- **Chatbot tự động**: Phản hồi tin nhắn, lệnh trong nhóm Facebook.
- **Quản lý nhóm**: Duyệt nhóm, quản lý thành viên, anti-spam.
- **Giải trí**: Các lệnh như taixiu, baucua, music, v.v.
- **Tiện ích**: Tải video, ảnh, tra cứu thông tin.
- **Tùy chỉnh**: Hệ thống prefix, config dễ dàng.
- **Bảo mật**: Login an toàn với appstate.json, chống leak thông tin.

### 🔄 **Các thay đổi chính (Mod by Vuinguyen)**
- **Bảo mật**: Chuyển từ `cookie.txt` sang `appstate.json` để login an toàn hơn.
- **Cập nhật dependencies**: Downgrade `gradient-string` xuống v2 và `chalk` xuống v4 để tương thích.
- **Tối ưu hình ảnh**: Sử dụng direct Imgur links cho hình ảnh xúc xắc trong các lệnh `taixiu`, `tx`, và `baucua` để giảm phụ thuộc local.
- **Auto clean cache**: Tự động dọn dẹp thư mục cache khi khởi động bot, giữ nguyên thư mục.
- **Dọn dẹp code**: Loại bỏ logic `status-hack.json` không cần thiết khỏi lệnh `tx.js`.
- **Cấu hình Biome**: Thêm công cụ linting và formatting Biome để duy trì code chất lượng.
- **Git security**: Loại bỏ `fca-config.json` và `database.sqlite` khỏi Git tracking để bảo mật.

## 📜 **Installation**

Sau đây là các bước cơ bản để có thể cài đặt và vận hành.

### 💡 **Yêu cầu**

- Dung lượng của máy phải trống tầm 1-2gb.
- Cần một số phần mềm chỉnh sửa file, khuyến khích sử dụng [notepad++](https://notepad-plus-plus.org/downloads/) hoặc [sublime text 3](https://www.sublimetext.com/3)
- Cần hiểu biết sơ lược qua về node, javascript.
- Một tài khoản Facebook dùng để làm bot(Khuyến khích nên sử dụng acc đã bỏ hoặc không còn sử dụng để tránh mất acc hay acc bị khoá).
- Đối với:
    - Windows: Cần cài đặt windows-build-tools.
    - Linux: Cần cài đặt python3 hoặc python2.
    - Android Sử dụng termux để vận hành bot.

### ⚙️ **Cài Đặt**

1. Tải về [Nodejs](https://nodejs.org/en/) và [git](https://git-scm.com/) sau đó cài đặt
2. Clone source code của bot
    1. chuột phải ở folder cần cài đặt source code nhấn vào git bash
    2. nhập
    ```sh
    git clone https://github.com/DongDev-VN/Mirai-Bot-V3 Mirai-Bot-V3
    ```
    
3. Cài đặt các package cần thiết
    1. Mở cmd/terminal ở thư mục bot, LƯU Ý thư mục đó phải có file package.json
    2. Nhập
    ```sh
    npm install
    ```
    
4. Chỉnh sửa file config
    1. Mở file config.json thông qua notepad++ hoặc sublime text 3 đã cài đặt ở trên
    2. tùy chỉnh id admin, tên bot, ...
    3. Sao lưu và đóng lại
    
5. Lấy appstate
    - Sử dụng extension như "Get FB Appstate" hoặc tool để lấy appstate.json
    - Tạo file appstate.json trong thư mục bot và paste nội dung vào, save để lưu
      
6. Chạy bot và tận hưởng
    1. Nhập
    ```sh
      npm start
      ```
    2. Đợi source code load file và tận hưởng!

## 📚 **Contributing**

Sự đóng góp của bạn sẽ khiến cho project ngày càng tốt hơn, các bước để bạn có thể đóng góp

1. Fork project này
2. Tạo một branch mới chứa tính năng của bạn (`git checkout -b feature/AmazingFeature`)
3. Commit những gì bạn muốn đóng góp (`git commit -m 'Add some AmazingFeature'`)
4. Đẩy branch chứa tính năng của bạn lên (`git push origin feature/AmazingFeature`)
5. Tạo một pull request mới và sự đóng góp của bạn đã sẵn sàng để có thể đóng góp!

<!-- CONTACT -->
## ☎️ **Contact**

- DongDev - [Facebook](https://facebook.com/minhdong.dev) - [GitHub](https://github.com/DongDev-VN) - dongdz.user@gmail.com
- Vuinguyen - [Facebook](https://www.facebook.com/vui.nguyen.quang.2025) - [GitHub](https://github.com/vuinguyen16003069)

## 📄 **License**

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.
