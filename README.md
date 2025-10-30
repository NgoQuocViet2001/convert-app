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

## 🧰 Yêu cầu trước khi bắt đầu

### Hệ thống

- **Node.js 18+** và **Yarn 1.x**
- **Rust toolchain** (Rustup)
- **Tauri v2 CLI**
- **Windows**:
  - Visual Studio Build Tools (Desktop development with C++)
  - **NSIS** (để build installer `.exe`)

### Repo này

- React 19, Vite 7, TypeScript 5
- Tauri CLI ^2, @tauri-apps/api ^2

---

## 📦 Cài đặt

```bash
git clone <repo-url>
cd convert-app
yarn
```

---

## 🚀 Chạy Dev

```bash
yarn tauri dev
```

hoặc chỉ chạy React:

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
