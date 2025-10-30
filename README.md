# Convert-App (Tauri + React + TypeScript)

Ứng dụng desktop **chuyển đổi file CAJ sang PDF** (convert CAJ to PDF)  
xây dựng bằng **Tauri v2** (Rust) và **React + Vite + TypeScript**.  
Mục tiêu: gọn nhẹ, chạy đa nền tảng, đóng gói bộ cài **NSIS** cho Windows.

> ⚡ Ứng dụng hiện hỗ trợ tính năng **convert CAJ → PDF**.  
> Trong tương lai sẽ mở rộng thêm nhiều định dạng khác.

---

## ✨ Tính năng chính

- Chuyển đổi file **CAJ sang PDF** nhanh và chính xác.
- Giao diện React/Vite thân thiện, tốc độ cao.
- Khung ứng dụng Tauri giúp gọn nhẹ, bảo mật và dễ đóng gói.
- Có thể mở hộp thoại chọn file, lưu kết quả, hiển thị thông báo.
- Hỗ trợ build file cài đặt `.exe` bằng **NSIS** cho Windows.

---

## 🧰 Chuẩn bị môi trường

Trước khi chạy hoặc build app, đảm bảo bạn đã cài đầy đủ môi trường.

### 🪟 Windows / 💻 macOS / 🐧 Linux

1. **Cài Node.js 18+**  
   [https://nodejs.org](https://nodejs.org)

2. **Cài Yarn global**

   ```bash
   npm install -g yarn
   ```

3. **Cài Rust (Rustup)**

   ```bash
   curl https://sh.rustup.rs -sSf | sh
   ```

   _(hoặc tải [rustup-init.exe](https://win.rustup.rs) cho Windows)_

4. **Cài Tauri CLI**

   ```bash
   cargo install tauri-cli --version "^2"
   ```

5. **Windows users:**
   - Cài **Visual Studio Build Tools (Desktop development with C++)**
   - Cài **NSIS** để build file `.exe`:  
     [https://nsis.sourceforge.io/Download](https://nsis.sourceforge.io/Download)

---

## 📦 Cài đặt dự án

```bash
git clone <repo-url>
cd convert-app
yarn
```

> Sau khi cài môi trường, chỉ cần chạy `yarn` hoặc `yarn install` là đủ.

---

## 🚀 Chạy Dev

```bash
yarn tauri dev
```

hoặc chỉ chạy frontend React:

```bash
yarn dev
```

---

## 🏗️ Build Production (bundle NSIS cho Windows)

```bash
yarn tauri build --bundles nsis
```

Kết quả nằm tại:

```
src-tauri/target/release/bundle/nsis/*.exe
```

---

## 🗂️ Cấu trúc thư mục

```
convert-app/
├─ src/                  # React/TS code
├─ src-tauri/            # Mã nguồn Rust
├─ resources/            # Tools hoặc scripts convert
└─ dist/                 # Build output
```

---

## 🧪 Kiểm thử nhanh

```bash
yarn build
yarn tauri build --bundles nsis
```

---

## 📄 License

MIT
