# 📦 File Sharing API

A fully functional **Node.js REST API** for uploading, downloading, and deleting files — with pluggable storage backends, rate limits, scheduled cleanup, and Swagger UI documentation.

This project was built as a backend coding assessment and follows all requirements strictly, using best practices in architecture, modularization, and test coverage.

---

## 🚀 Features

✅ **File Upload, Download, Delete**  
- `POST /files` – upload a file (returns `publicKey`, `privateKey`)  
- `GET /files/:publicKey` – download a file  
- `DELETE /files/:privateKey` – delete a file  

✅ **Storage Providers (Pluggable Architecture)**  
- Local File System (default)  
- Google Cloud Storage (fully implemented + mock mode to avoid billing)

✅ **Daily Rate Limits**  
- Uploads and downloads per IP, configurable via `.env`

✅ **Automatic File Cleanup**  
- Old files are deleted after inactivity (configurable days)

✅ **Swagger UI Documentation**  
- Full interactive API explorer at:  
  👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

✅ **Comprehensive Tests**  
- Unit and Integration tests using Jest + Supertest  
- 100% pass rate  
- Mock GCS support for free testing (no Google billing needed)

---

## 🧩 Tech Stack

| Layer | Technology |
|--------|-------------|
| **Runtime** | Node.js (LTS) |
| **Framework** | Express.js |
| **Storage** | Local File System / Google Cloud Storage |
| **Testing** | Jest + Supertest |
| **Docs** | Swagger (OpenAPI 3) |
| **Scheduler** | node-cron |
| **Middleware** | express-rate-limit, multer |
| **Env Config** | dotenv |

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/file-sharing-api.git
cd file-sharing-api
```

### 2️⃣ Install dependencies
```bash
npm install
```

### 3️⃣ Environment variables
Create a `.env` file in the project root:

```bash
PORT=3000
FOLDER=./storage_root
PROVIDER=local
CONFIG=./gcs-config.json
UPLOAD_LIMIT=20
DOWNLOAD_LIMIT=200
CLEANUP_DAYS=7
MOCK_GCS=true
```

> ⚠️ By default, it uses **local storage** and **mock Google Cloud mode** (so no billing or credentials required).

### 4️⃣ Start the server
```bash
npm start
```

Visit:  
👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

---

## 🧠 API Endpoints

| Method | Endpoint | Description |
|--------|-----------|-------------|
| **POST** | `/files` | Upload a new file (multipart/form-data, key = `file`) |
| **GET** | `/files/:publicKey` | Download an existing file |
| **DELETE** | `/files/:privateKey` | Delete a file |

Example upload using `curl`:

```bash
curl -F "file=@/path/to/myfile.txt" http://localhost:3000/files
```

Response:
```json
{
  "publicKey": "a7f9c3f6f44d",
  "privateKey": "b92c10a1e22e"
}
```

---

## 🪣 Google Cloud Storage Provider

### ✅ Mock Mode (No Billing, Default)
This project runs GCS in **mock mode** by default.  
Set `MOCK_GCS=true` in `.env`.

This mode simulates uploads/downloads locally (using `/tmp`) while keeping 100% compatibility with real GCS APIs.

### 🔐 Real GCS Mode (Optional)
If you already have a billing-enabled Google Cloud account and bucket:
1. Enable the **Google Cloud Storage JSON API**
2. Create a service account key and download its JSON
3. Create a `gcs-config.json` file like:

```json
{
  "projectId": "your-project-id",
  "bucketName": "your-bucket-name",
  "credentials": {
    "type": "service_account",
    "project_id": "your-project-id",
    "private_key_id": "xxxx",
    "private_key": "-----BEGIN PRIVATE KEY-----\nABC...\n-----END PRIVATE KEY-----\n",
    "client_email": "service-account@project-id.iam.gserviceaccount.com",
    "client_id": "1234567890"
  }
}
```

Then set:
```
PROVIDER=google
CONFIG=./gcs-config.json
MOCK_GCS=false
```

---

## 🧪 Running Tests

Run all tests:

```bash
npm test
```

Output (expected):
```
⚙️ Running in MOCK Google Storage mode
 PASS  src/tests/unit/googleStorage.unit.test.js
 PASS  src/tests/unit/localStorage.unit.test.js
 PASS  src/tests/integration/files.integration.test.js
 PASS  src/tests/integration/google.integration.test.js
Test Suites: 4 passed, 4 total
Tests:       10 passed, 10 total
```

---

## 🧹 Cleanup Service

A cron job runs daily (03:00) to remove inactive files.  
You can adjust `CLEANUP_DAYS` in `.env` (default: 7 days).  
In test mode (`NODE_ENV=test`), cleanup is disabled to prevent open handles.

---

## 🚫 Rate Limiting

Daily upload/download limits are configurable via:

```
UPLOAD_LIMIT=20
DOWNLOAD_LIMIT=200
```

If a client exceeds the limit:
```json
{ "error": "Daily upload limit reached" }
```

---

## 🧭 Swagger UI

Open interactive docs:

👉 [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Available operations:
- `POST /files` (Upload file)
- `GET /files/{publicKey}` (Download)
- `DELETE /files/{privateKey}` (Delete)

---

## 🧩 Project Structure

```
src/
├── app.js                 # Express app setup
├── server.js              # Entry point
├── controllers/
│   └── filesController.js # Endpoint handlers
├── routes/
│   └── files.js           # /files endpoints
├── middlewares/
│   └── rateLimiter.js     # Daily IP rate limits
├── services/
│   ├── cleanupService.js  # Scheduled cleanup
│   └── storage/
│       ├── localStorage.js
│       └── googleStorage.js
├── utils/
│   └── keyGenerator.js
└── tests/
    ├── unit/
    └── integration/
```

---

## 🧠 Design Overview

### Architecture Flow
1. User uploads a file → handled by **Multer**
2. Controller saves via a **Storage Provider** (local or Google)
3. System generates `publicKey` & `privateKey`
4. Downloads stream the file directly via Express
5. Deletions require the `privateKey`
6. Cleanup runs daily to remove inactive files
7. Rate limit middleware restricts per-IP traffic

---

## ⚖️ Environment Variables Summary

| Variable | Description | Default |
|-----------|-------------|----------|
| `PORT` | Port for the API server | 3000 |
| `FOLDER` | Root folder for local file storage | `./storage_root` |
| `PROVIDER` | Storage provider (`local` or `google`) | `local` |
| `CONFIG` | Path to storage provider config file | `./gcs-config.json` |
| `UPLOAD_LIMIT` | Daily upload limit per IP | 20 |
| `DOWNLOAD_LIMIT` | Daily download limit per IP | 200 |
| `CLEANUP_DAYS` | Days of inactivity before cleanup | 7 |
| `MOCK_GCS` | Run GoogleStorage in mock mode (no billing) | `true` |

---

## 🧪 Test Coverage (Optional)

Generate coverage report:

```bash
npm test -- --coverage
```

HTML report will appear under:
```
/coverage/index.html
```

---

## 🏁 Conclusion

✅ Fully working file-sharing REST API  
✅ Modular architecture with pluggable providers  
✅ Clean code, best practices, and tests  
✅ Free to run, no billing required  
✅ Swagger UI + documentation  

> **Developed by:** *Mustak Ahmed*  
> **Location:** Bangladesh 🇧🇩  
> **Date:** 2025  
> **Assessment:** Node.js Backend Code Test  
