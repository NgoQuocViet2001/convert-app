# Convert-App (Tauri + React + TypeScript)

Ứng dụng desktop chuyển đổi file (convert) xây dựng bằng **Tauri v2** (Rust) và **React + Vite + TypeScript**.  
Mục tiêu: gọn nhẹ, chạy đa nền tảng, đóng gói bộ cài **NSIS** cho Windows.

## ✨ Tính năng chính

- Giao diện React/Vite nhanh và nhẹ.
- Khung ứng dụng Tauri: tiêu thụ ít tài nguyên, đóng gói tiện lợi.
- Có thể mở hộp thoại chọn file, chạy tool chuyển đổi nội bộ, lưu kết quả.
- Hỗ trợ đóng gói bộ cài **.exe (NSIS)** cho Windows.

> Lưu ý: Bạn có thể tuỳ biến tính năng convert trong thư mục `resources/` và gọi từ Rust/JS tuỳ nhu cầu.

---

## 🧰 Chuẩn bị môi trường

Trước khi chạy hoặc build app, hãy đảm bảo bạn đã cài đầy đủ các thành phần sau trên hệ điều hành của mình.

### 🪟 Windows / 💻 macOS / 🐧 Linux

1. **Cài Node.js 18+**

   - Tải từ [https://nodejs.org](https://nodejs.org)
   - Kiểm tra:
     ```bash
     node -v
     npm -v
     ```

2. **Cài Yarn global**

   ```bash
   npm install -g yarn
   ```

   Sau đó kiểm tra:

   ```bash
   yarn -v
   ```

3. **Cài Rust (Rustup)**

   - Chạy trong terminal:
     ```bash
     curl https://sh.rustup.rs -sSf | sh
     ```
     hoặc trên Windows tải [rustup-init.exe](https://win.rustup.rs)
   - Kiểm tra:
     ```bash
     rustc --version
     cargo --version
     ```

4. **Cài Tauri CLI (nếu chưa có)**

   ```bash
   cargo install tauri-cli --version "^2"
   ```

5. **Windows users:**
   - Cài **Visual Studio Build Tools** (Desktop development with C++).
   - Cài **NSIS** để build file `.exe`: [https://nsis.sourceforge.io/Download](https://nsis.sourceforge.io/Download)

---

## 📦 Cài đặt dự án

```bash
git clone <repo-url>
cd convert-app
yarn
```

> Sau khi cài đủ môi trường và clone repo, chỉ cần chạy `yarn` hoặc `yarn install` là tự động cài dependencies.

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
