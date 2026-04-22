# 🤖 Google Maps Review Auto-Reply Bot

Production-grade automation system that monitors Google Maps business reviews and replies automatically using pre-written templates from Google Sheet.

## ✨ Features

- **Persistent Sessions** — Login once, reuse session forever
- **Google Sheet Templates** — Random reply from pre-written templates (column A)
- **Multi-Location** — Monitor multiple business locations
- **Human-Like Behavior** — Random delays, typing simulation, mouse movements
- **Anti-Detection** — Session breaks, randomized patterns, CAPTCHA detection
- **Duplicate Prevention** — MD5-based tracking in local JSON database
- **Detailed Logging** — Vietnamese-friendly logs with emoji indicators

---

## 📋 Prerequisites

- **Node.js** v18+ installed
- **Google account** that manages the business on Google Maps
- **Google Cloud project** with Sheets API enabled
- **Google Sheet** with reply templates

---

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd project-folder
npm install
npx playwright install chromium
```

### Step 2: Create Google Cloud Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Enable **Google Sheets API**:
   - Go to **APIs & Services > Library**
   - Search for "Google Sheets API"
   - Click **Enable**
4. Create Service Account:
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > Service Account**
   - Give it a name (e.g., "review-bot")
   - Click **Create and Continue** (skip optional steps)
   - Click **Done**
5. Create Key:
   - Click on the service account you just created
   - Go to **Keys** tab
   - Click **Add Key > Create New Key > JSON**
   - Download the JSON file
6. **Rename** the downloaded file to `service-account.json`
7. **Place** it in the project root directory

### Step 3: Prepare Google Sheet

1. Create a new Google Sheet
2. Create a tab named **`Replies`**
3. In the `Replies` tab:
   - Row 1: Header (e.g., "Reply Template") — this row is skipped
   - Row 2 onwards: One reply template per row in **column A**
   - Add 30–100 different replies for best randomization
4. **Share the sheet** with the service account email:
   - Look in `service-account.json` for `client_email`
   - Share the sheet with that email (Viewer access is enough)
5. **Copy the Sheet ID** from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
   ```

### Step 4: Configure the Bot

#### Google Sheet ID (in `bot.js`):
Open `bot.js` and replace:
```javascript
const GOOGLE_SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';
```
with your actual Sheet ID.

#### Business Locations (in `config.json`):
Edit `config.json` and update the `locations` array:
```json
{
  "locations": [
    {
      "name": "Quán Cafe Sài Gòn",
      "url": "https://www.google.com/maps/place/Your+Business+Name/..."
    },
    {
      "name": "Chi nhánh Quận 1",
      "url": "https://www.google.com/maps/place/Your+Branch/..."
    }
  ]
}
```

### Step 5: First Run (Login)

```bash
npm start
```

On first run:
1. Browser opens automatically
2. Navigate to Google Maps and **log in manually** with your business account
3. Once logged in, go back to terminal and press **ENTER**
4. Session is saved — subsequent runs won't require login

Or use login-only mode:
```bash
npm run login
```

### Step 6: Test Google Sheet Connection

```bash
npm run test-sheet
```

This will display all loaded reply templates without starting the bot.

---

## ⚙️ Configuration (config.json)

| Setting | Description | Default |
|---------|-------------|---------|
| `checkInterval.min/max` | Polling interval (minutes) | 5–10 min |
| `maxRepliesPerRun.min/max` | Max replies per cycle | 15–25 |
| `typingSpeed.min/max` | Typing speed (ms/char) | 50–150 ms |
| `delayBetweenActions.min/max` | Delay between UI actions | 3–10 sec |
| `delayBetweenReplies.min/max` | Delay between replies | 10–30 sec |
| `breakFrequency.afterReplies` | Take break after N replies | 5–8 |
| `breakFrequency.breakDuration` | Break duration | 2–5 min |

---

## 📁 Project Structure

```
project/
├── bot.js              # Main bot logic (Google Sheet ID hardcoded here)
├── config.json         # Timing, limits, and location URLs
├── db.json             # Local database (auto-managed)
├── service-account.json # Google Cloud credentials (you provide)
├── session/            # Browser session data (auto-created)
├── package.json        # Dependencies
└── README.md           # This file
```

---

## 📋 Log Examples

```
[12/04/2026 11:30:00] 🚀 🚀 BOT KHỞI ĐỘNG
[12/04/2026 11:30:01] ℹ️  Đã tải config.json thành công
[12/04/2026 11:30:02] ✅ Đã tải 45 reply template(s) từ Google Sheet
[12/04/2026 11:30:05] 📍 Đang quét: Quán Cafe Sài Gòn
[12/04/2026 11:30:15] ℹ️  → Tìm thấy 3 review mới
[12/04/2026 11:30:30] ✅ Đã reply cho review: "Quán cafe rất đẹp, đồ uống ngon..."
[12/04/2026 11:31:00] ⏸️  Chờ 15.3s trước reply tiếp theo (human-like)...
[12/04/2026 11:32:00] ⏸️  ⏸️  Nghỉ ngơi 3.2 phút (human-like)...
[12/04/2026 11:35:30] ✅ Hoàn thành 1 chu kỳ. Tổng reply: 3
[12/04/2026 11:35:30] 🔁 ✅ Nghỉ 7.5 phút trước chu kỳ tiếp theo...
```

---

## 🛡️ Safety Features

1. **CAPTCHA Detection** — Stops immediately if CAPTCHA/block is detected
2. **Error Limit** — Stops after 3 consecutive errors
3. **Session Breaks** — Pauses 2–5 minutes every 5–8 replies
4. **Reply Limit** — Max 15–25 replies per session
5. **Random Delays** — All timing is randomized
6. **No Proxies** — Uses your real IP (safer for Google)
7. **Persistent Session** — No repeated logins (avoids suspicion)

---

## ⚠️ Important Notes

- **Google Sheet link is hardcoded in `bot.js`** — never exposed in config or UI
- **Reply selection is fully random** — no star rating or sentiment analysis
- **Each reply is different** — random selection avoids patterns
- **Safety > Speed** — the bot intentionally operates slowly
- Do NOT modify timing constants to be faster
- Do NOT run multiple instances simultaneously

---

## 🔧 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Reply button not found" | Google Maps UI may have changed. Check browser for visual confirmation. |
| "CAPTCHA detected" | Stop the bot, wait a few hours, then restart. |
| "Cannot read Google Sheet" | Check service account email has access to the sheet. |
| Session expired | Delete `session/` folder and run `npm run login` again. |
| Bot stops after 3 errors | Check logs for specific error messages. |
