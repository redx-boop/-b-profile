# Camera and QR Code Based User Authentication System Using Node.js, Express, and MySQL

A production-ready authentication system that **automatically captures a camera image on signup**, **generates a unique QR code per user**, and supports **dual login methods** (camera-based and QR scan).

## ✨ Key Features
- Automatic camera activation and capture using WebRTC.
- Secure signup with bcrypt hashing.
- **Automatic QR generation immediately after signup** (unique token per user).
- QR-based login with validation against MySQL.
- Camera-based login with image comparison (pixel similarity check).
- Professional, responsive UI with smooth transitions.

---

## 📁 Project Structure
```
public/
  html/
  css/
  js/
server/
  routes/
  controllers/
  middleware/
  config/
uploads/
  images/
  qr_codes/
database/
```

---

## ✅ Step-by-Step System Flow

### 1) Signup — Automatic Camera Capture + QR Generation
1. User enters username + password.
2. Browser requests camera permission.
3. The external USB camera is selected and activated automatically.
4. A countdown begins and the image is captured automatically (no button click).
5. Backend hashes the password using **bcrypt** and saves the image on disk.
6. Backend generates a UUID and a **unique QR token**.
7. QR code is generated using the `qrcode` library and saved to `uploads/qr_codes/`.
8. User receives and downloads/prints their QR code.

### 2) Camera Login (Face Authentication)
1. User types their username.
2. Camera captures a new live image automatically.
3. Backend compares the stored image and the live capture using pixel similarity.
4. If similarity ≥ 85%, login is approved and a JWT token is returned.

### 3) QR Code Login
1. User scans their personal QR code.
2. QR payload (userId + token) is sent to the backend.
3. Backend verifies that the QR token matches the user.
4. If valid, login is approved and JWT token is returned.

---

## 🔐 Security Design
- **bcrypt** password hashing.
- Prepared statements via `mysql2` to prevent SQL injection.
- Input validation on the backend.
- Secure image uploads (stored on server, not in DB).
- JWT-based session tokens.
- Unique QR token per user to prevent forgery.

---

## 🧩 MySQL Database Schema
Use the SQL below (also available in `database/schema.sql`).

```sql
CREATE DATABASE IF NOT EXISTS camera_qr_auth;
USE camera_qr_auth;

CREATE TABLE IF NOT EXISTS users (
  user_id CHAR(36) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  image_path VARCHAR(255) NOT NULL,
  qr_token CHAR(36) NOT NULL,
  qr_image_path VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🛠️ Setup & Run

### 1) Install dependencies
```bash
npm install
```

### 2) Configure environment
```bash
cp .env.example .env
```
Update `.env` with your MySQL credentials.

### 3) Create database
```bash
mysql -u root -p < database/schema.sql
```

### 4) Start the server
```bash
npm run dev
```

Open the app at: `http://localhost:3000`

---

## 📷 Automatic Camera Activation & Capture
- The browser uses `navigator.mediaDevices.getUserMedia()` to request camera access.
- It automatically selects an external USB camera if available.
- A 3-second countdown triggers automatic image capture.

---

## 🧾 QR Code Generation (Automatic)
- After signup, the backend generates a **unique UUID token**.
- The token and user ID are embedded in a QR payload.
- The QR code is saved to `uploads/qr_codes` and displayed on the UI.
- User can download or print the QR code immediately.

---

## ✅ QR Validation During Login
- QR scanner reads the payload and sends it to `/api/auth/login-qr`.
- Backend verifies the payload against MySQL.
- If the token matches and user exists, login succeeds.

---

## ✅ Node.js + Express Image Handling
- Images are sent as base64 from the browser.
- Backend saves them in `uploads/images/`.
- For camera login, stored and live images are compared using `pixelmatch`.

---

## 🧪 API Endpoints
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Signup + auto QR generation |
| POST | `/api/auth/login-camera` | Camera-based login |
| POST | `/api/auth/login-qr` | QR code login |

---

## ✅ Notes for Presentation
- The UI is responsive and uses smooth gradients/animations.
- The system is designed for school ICT demos and showcases advanced security flows.

---

## 📌 Environment Variables
```
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=camera_qr_auth
JWT_SECRET=change-this-secret
```

---

## ✅ Tech Stack
- **Frontend:** HTML, CSS, JavaScript
- **Backend:** Node.js + Express
- **Database:** MySQL
- **QR Generator:** `qrcode`
- **Face Comparison:** `pixelmatch`

---

## 📣 Reminder
Signup is **ONLY COMPLETE** after the QR code is generated successfully. If QR generation fails, the backend returns an error.
