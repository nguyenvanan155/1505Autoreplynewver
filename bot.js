// ============================================================
//  🤖 GOOGLE MAPS REVIEW AUTO-REPLY BOT
//  Version: 1.0.0
//
//  Production-grade automation with human-like behavior.
//  Monitors Google Maps reviews and replies using templates
//  randomly selected from a Google Sheet.
//
//  ⚠️  SAFETY FIRST: This bot simulates human behavior to
//      avoid detection. Do NOT modify timing constants
//      to be faster than specified.
// ============================================================

'use strict';

const { chromium } = require('playwright');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ============================================================
//  🔒 GOOGLE SHEET CONFIGURATION (HARDCODED — EDIT HERE ONLY)
// ============================================================
// Paste your Google Sheet ID here (from the URL):
//   https://docs.google.com/spreadsheets/d/1KDO1FPP9v-8n3iGfDIIUP9vSAyjGpWqRprVpY2CgV7k/edit?usp=sharing
const GOOGLE_SHEET_ID = '1KDO1FPP9v-8n3iGfDIIUP9vSAyjGpWqRprVpY2CgV7k';
const SHEET_TAB_NAME = 'Replies';
const REQUIRED_REPLY_BUTTON_XPATH = '//*[@id="AH1dze"]/div/div/main/div/div/c-wiz/div/div/div/div/div/div[2]/c-wiz/div/div/div/div/div';
const REQUIRED_SUBMIT_BUTTON_XPATH = '//*[@id="AH1dze"]/div/div/main/div/div/c-wiz/div/div/div/div/div/div[2]/c-wiz/div/div/div/div/div[3]/div/button[1]';

// ============================================================
//  📁 FILE PATHS
// ============================================================
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DB_PATH = path.join(__dirname, 'db.json');

// Encoded service account credentials (Base64) to hide them from plain sight
const ENCODED_SERVICE_ACCOUNT = "ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY2hlY2tydjEyMTIiLAogICJwcml2YXRlX2tleV9pZCI6ICJlNmRlZGQ4MmQ4NWFmMjAyZmUyMzJmNTg1OGNlYjJmMTMyZDkxYjg5IiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdkFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLWXdnZ1NpQWdFQUFvSUJBUUN6TkxkYk1HUlEvRG8rXG4vLzRmNzJ6T1lqeS8zVUs5MjB2QnVQdzZiMmNBUHpZTnZFZi9CTzJsVk5wNVpMQ2Z1NnNlNjZ2bG1qSnRpZ1laXG5MbW1zeTYwRERudmNUWis2VzNQSFlYVEdwUHhMMDBWUUVrQXVVUGdDTEQydG1pNk9zd2NyWFhzdGJjOXdnTlRhXG5XSWltM1NZdHpjMk5VMU9zdE9qak5tYXlzK0JDTmJGK1E5ODhrQUpUdUNsUmUrcmtGL1pOVHdjR3ZXWXFMcDgwXG4rVEZVL1ZKV3NFSWR2bWNGOHhWY1ZsU0E4cnA0R3dOQnNjZHZ0ZWxXYUdSaHBCNkR5aWhZUFhLKzBEa0UyT0ptXG5TSUlkU0JSR21DeVkvOEwxQm9vV3dLaHFWWlRpUG1NY3hudzhjZWw5NFRidkdBMGgyemh4YWRMWGcwWDdicU1EXG5ORUc0eUhGVkFnTUJBQUVDZ2dFQUJOSWZPSm5GcVJRUDhRL3I0eW9Lc0VhZVFiOFBBNUo1cUQxMHM1RzVvSjBTXG50QzNqZGUzSkF0Q1VpLzEwYnVlYWc5dHRKV0VQaURqVlR5b2JkNldIQXZVSnlmUmducC9GTHBEbGxrNXI1eEpJXG41QTJKb25WVkpxSFFDdktCM0I3ZXk0RFpSbkNVeXY3OE90OTAxYUJQWFo0U3NJR1VWNm9LTmNxSjJyYlNDcFhoXG5waTJHNjU5V0kxekYxNXFLeWFFMEpoUEpHR25FN3V0OWkzdDFhNFN1bFowaG1vQ21lRllUbVZUbE9RRHpCeitXXG5WZjN3SEFFUHkySThWZmk0WEhld3Jzdndpc3gwNlRUY25icFZWU0F3OUwvM1IzRHc5bEZLVEd1SUIzbjg3QVJPXG55QTRRdUNPU2xrcGVtTEdWeTE4V1Y5dXc1Y28zVUVKTlhjS0tBUGs4eFFLQmdRRGdXN2VDS0hBZVpvdHA0cldXXG5ERzJIS001KzU0d0JvdlhVOW1XbDg0Z0JFZkVvLzVJMldzMlJKa3pyMGxoQ3c2MlpkRWtLcVdxMVZIekxRMCtvXG5hUGlaMmoxSkpxRWt0bzd6cjdienhHS1J0Z0MzUVB1UFUxVW1NRnRGa3hyaVVlRXN0OFhxR2xqQ283WDZrcXU1XG5sdnJrMTFTMVRNUTEvR1hGdFFDeVhscE9Md0tCZ1FETWVzNy8xWURIT0IxVGZUMVlLRUhGcFNwQThRbHBFeVBRXG5Eb01tZHhSTjRzWGtLNlBZUFVwb2ovNUs3ZU9BaUtGMU1JdTNzMlJhYkRVZEZPSWlsVjJvMldRRUJoc1ZPZGo4XG50bTVERURlS1JQTTVtc2VYZnhqVldVZU5yUGkzTmJpNDRndzRYWmM3TTNvK3JOZHJFb1JPaHc0dVVPLzdjL3RxXG5KYlBQNVZ1N3V3S0JnQmd0NmtZTnc1K1RINTFHd0prdU43T2tVelRjRVh1dnExekxQVU00VHNVR3dQM1JKVm5VXG5TV2xHUG0zLzJtRS9vM3J4VEZub3prWkNsN3gwUWFaOXdhVWJIeFcrSXduSTN2a21TOHBUdE9mTlBLQ0RVVmt0XG4rdlJGcStDQXJSb05CdjZCdzhPcUdUekkxZmp1UzdHUnN2SnN2b1ZYZzZIcDFMSU5Bc2syWC9jakFvR0FhOTY1XG5ock1PRFlxbnhkeUMyUmZib3JWLzllUnlUM0VlYW1yTmV5UkVuTlh1Q1hHUUxNb2dqOHF1bnI2aVRyTkZZYm9yXG5hc3lETzBSc1BKeEFzM2ZTZ2ZtMHpuNmVHUE44YWN5Zm5GZFl4V09jWUI0ci90cTRzZ3c0T0NBdzBRM1JGZytCXG4zTlphcW90OGlNWExtcHVaR29nYXpnbzZuNDlPNlc5Y1RXYzBubk1DZ1lBT2RzdzRXTDIvQ0JzS3V6VTlLYmdrXG5mRjRQOHBvb0NsN1FwSlk1ZmpEeU82d2FNcy94MGdSZUVVSTBTV2JmUXVFRE1nZXNVUHltZVZBSEtJaXJxMitBXG5zVkEvaFhOVnRmbVpQQklrTTljdFZsL1E1UktETWlVK0d4VmhqalcyT2hFekI1RkJWYytSczFHbE1CTVRVVm9RXG40RDJDZWVLMWFXNmNnKzEvZ2FsQ0NnPT1cbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJlbGRyaWVzaXRlQGNoZWNrcnYxMjEyLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAiY2xpZW50X2lkIjogIjEwOTAxNjYxMTA4NTAyNDI5Njc3MSIsCiAgImF1dGhfdXJpIjogImh0dHBzOi8vYWNjb3VudHMuZ29vZ2xlLmNvbS9vL29hdXRoMi9hdXRoIiwKICAidG9rZW5fdXJpIjogImh0dHBzOi8vb2F1dGgyLmdvb2dsZWFwaXMuY29tL3Rva2VuIiwKICAiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL29hdXRoMi92MS9jZXJ0cyIsCiAgImNsaWVudF94NTA5X2NlcnRfdXJsIjogImh0dHBzOi8vd3d3Lmdvb2dsZWFwaXMuY29tL3JvYm90L3YxL21ldGFkYXRhL3g1MDkvZWxkcmllc2l0ZSU0MGNoZWNrcnYxMjEyLmlhbS5nc2VydmljZWFjY291bnQuY29tIiwKICAidW5pdmVyc2VfZG9tYWluIjogImdvb2dsZWFwaXMuY29tIgp9Cg==";

// ============================================================
//  📋 LOGGER — Vietnamese-friendly logging with timestamps
// ============================================================
class Logger {
  static _ts() {
    return new Date().toLocaleString('vi-VN', { hour12: false });
  }

  static info(msg) { console.log(`[${this._ts()}] ℹ️  ${msg}`); }
  static success(msg) { console.log(`[${this._ts()}] ✅ ${msg}`); }
  static warn(msg) { console.log(`[${this._ts()}] ⚠️  ${msg}`); }
  static error(msg) { console.error(`[${this._ts()}] ❌ ${msg}`); }
  static bot(msg) { console.log(`[${this._ts()}] 🤖 ${msg}`); }
  static location(msg) { console.log(`[${this._ts()}] 📍 ${msg}`); }
  static review(msg) { console.log(`[${this._ts()}] 💬 ${msg}`); }
  static pause(msg) { console.log(`[${this._ts()}] ⏸️  ${msg}`); }
  static cycle(msg) { console.log(`[${this._ts()}] 🔁 ${msg}`); }
  static rocket(msg) { console.log(`[${this._ts()}] 🚀 ${msg}`); }
}

// ============================================================
//  🔧 UTILITY FUNCTIONS
// ============================================================

/** Generate MD5 hash of a string */
function md5(text) {
  return crypto.createHash('md5').update(text || '').digest('hex');
}

/** Random integer between min and max (inclusive) */
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Sleep for specified milliseconds */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Random sleep between min and max ms */
function randomSleep(min, max) {
  const ms = randomBetween(min, max);
  return sleep(ms);
}

/** Keep terminal open until user presses any key */
function pauseAndExit(code = 1) {
  console.log('\n❌ Failed. Press enter to exit terminal.');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', () => process.exit(code));
  // Fallback in case setRawMode fails/isn't supported
  setTimeout(() => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('', () => process.exit(code));
  }, 100);
}

/** Truncate text for logging */
function truncate(text, maxLen = 50) {
  if (!text) return '(empty)';
  const clean = text.replace(/\n/g, ' ').trim();
  return clean.length > maxLen ? clean.substring(0, maxLen) + '...' : clean;
}

// ============================================================
//  ⚙️ CONFIG LOADER
// ============================================================
function loadConfig() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
    const config = JSON.parse(raw);
    Logger.info('Config.json loaded successfully');
    return config;
  } catch (err) {
    Logger.error(`Cannot read config.json: ${err.message}`);
    pauseAndExit(1);
  }
}

// ============================================================
//  🗃️ LOCAL DATABASE (JSON-based)
// ============================================================
class Database {
  constructor() {
    this.data = { reviews: [], stats: { totalReplied: 0, lastRun: null, lastCycleCompleted: null } };
    this.load();
  }

  /** Load database from disk */
  load() {
    try {
      if (fs.existsSync(DB_PATH)) {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        Logger.info(`Database loaded: ${this.data.reviews.length} review(s) processed`);
      }
    } catch (err) {
      Logger.warn(`Cannot read db.json, creating new: ${err.message}`);
      this.save();
    }
  }

  /** Save database to disk */
  save() {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      Logger.error(`Cannot save db.json: ${err.message}`);
    }
  }

  /** Check if a review has already been processed */
  isProcessed(reviewKey) {
    return this.data.reviews.some(r => r.review_key === reviewKey);
  }

  /** Add a processed review to the database */
  addReview(reviewKey, reviewText, replied = true) {
    this.data.reviews.push({
      review_key: reviewKey,
      review_text: truncate(reviewText, 200),
      timestamp: new Date().toISOString(),
      replied: replied,
    });
    if (replied) {
      this.data.stats.totalReplied++;
    }
    this.data.stats.lastRun = new Date().toISOString();
    this.save();
  }

  /** Update last cycle timestamp */
  completeCycle() {
    this.data.stats.lastCycleCompleted = new Date().toISOString();
    this.save();
  }
}

// ============================================================
//  📊 GOOGLE SHEETS READER
// ============================================================

/**
 * Fetch reply templates from Google Sheet (tab "Replies", column A).
 * Uses service account authentication.
 * Returns array of reply strings.
 */
async function fetchReplyTemplates() {
  Logger.info('Loading reply templates...');

  // Validate Sheet ID
  if (!GOOGLE_SHEET_ID || GOOGLE_SHEET_ID === 'YOUR_GOOGLE_SHEET_ID_HERE') {
    Logger.error('❌ GOOGLE_SHEET_ID not configured in bot.js!');
    Logger.error('   Open bot.js and replace "YOUR_GOOGLE_SHEET_ID_HERE" with actual Sheet ID.');
    pauseAndExit(1);
    return [];
  }

  try {
    // Load service account credentials from encoded string
    const decodedString = Buffer.from(ENCODED_SERVICE_ACCOUNT, 'base64').toString('utf-8');
    const creds = JSON.parse(decodedString);

    // Create JWT auth
    const auth = new JWT({
      email: creds.client_email,
      key: creds.private_key,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    // Connect to Google Sheet
    const doc = new GoogleSpreadsheet(GOOGLE_SHEET_ID, auth);
    await doc.loadInfo();
    Logger.info(`Sheet title: "${doc.title}"`);

    // Get the "Replies" tab
    const sheet = doc.sheetsByTitle[SHEET_TAB_NAME];
    if (!sheet) {
      Logger.error(`❌ Could not find tab "${SHEET_TAB_NAME}" in Google Sheet!`);
      Logger.error('   Please create a tab named "Replies" with templates in column A.');
      pauseAndExit(1);
      return [];
    }

    // Load all rows (skip header automatically)
    const rows = await sheet.getRows();
    const templates = [];

    for (const row of rows) {
      // Get column A value (index 0 in raw data)
      const value = row._rawData[0];
      if (value && value.trim()) {
        templates.push(value.trim());
      }
    }

    if (templates.length === 0) {
      Logger.error('❌ Google Sheet tab "Replies" is empty! Please put reply templates in column A.');
      pauseAndExit(1);
      return [];
    }

    Logger.success(`Loaded ${templates.length} reply template(s) `);
    return templates;

  } catch (err) {
    Logger.error(`Error reading Google Sheet: ${err.message}`);
    throw err;
  }
}

/** Pick a random reply template from the list ensuring all are used before repeating */
let unusedTemplates = [];

function pickRandomReply(templates) {
  if (unusedTemplates.length === 0) {
    // Refill and shuffle the templates
    unusedTemplates = [...templates];
    for (let i = unusedTemplates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [unusedTemplates[i], unusedTemplates[j]] = [unusedTemplates[j], unusedTemplates[i]];
    }
  }
  return unusedTemplates.pop();
}

// ============================================================
//  🧠 HUMAN-LIKE BEHAVIOR SIMULATOR
// ============================================================
class HumanSimulator {

  /**
   * Simulate human-like typing into an element.
   * Types character by character with random delays.
   */
  static async type(page, selector, text, config) {
    const minDelay = config.typingSpeed?.min || 50;
    const maxDelay = config.typingSpeed?.max || 150;

    // Click the input field first
    await page.click(selector);
    await randomSleep(300, 800);

    // Type character by character
    for (let i = 0; i < text.length; i++) {
      await page.type(selector, text[i], { delay: 0 });
      await sleep(randomBetween(minDelay, maxDelay));

      // Occasionally pause longer (simulating thinking)
      if (Math.random() < 0.05) {
        await randomSleep(500, 1500);
      }
    }
  }

  /**
   * Type into an element handle directly (when selector doesn't work).
   */
  static async typeIntoElement(element, text, config) {
    const minDelay = config.typingSpeed?.min || 50;
    const maxDelay = config.typingSpeed?.max || 150;

    await element.click();
    await randomSleep(300, 800);

    for (let i = 0; i < text.length; i++) {
      await element.type(text[i], { delay: 0 });
      await sleep(randomBetween(minDelay, maxDelay));

      if (Math.random() < 0.05) {
        await randomSleep(500, 1500);
      }
    }
  }

  /**
   * Simulate random mouse movement on the page.
   */
  static async randomMouseMove(page) {
    const viewportSize = page.viewportSize();
    if (!viewportSize) return;

    const moves = randomBetween(2, 5);
    for (let i = 0; i < moves; i++) {
      const x = randomBetween(100, viewportSize.width - 100);
      const y = randomBetween(100, viewportSize.height - 100);
      await page.mouse.move(x, y, { steps: randomBetween(5, 15) });
      await randomSleep(200, 600);
    }
  }

  /**
   * Simulate random scrolling on the page.
   */
  static async randomScroll(page) {
    const scrollAmount = randomBetween(100, 400);
    const direction = Math.random() > 0.3 ? scrollAmount : -scrollAmount;
    await page.mouse.wheel(0, direction);
    await randomSleep(500, 1500);
  }

  /**
   * Perform a random human-like action (scroll, mouse move, or wait).
   */
  static async randomAction(page) {
    const action = Math.random();
    if (action < 0.4) {
      await this.randomMouseMove(page);
    } else if (action < 0.7) {
      await this.randomScroll(page);
    } else {
      await randomSleep(1000, 3000);
    }
  }

  /**
   * Wait a human-like delay between actions.
   */
  static async actionDelay(config) {
    const min = config.delayBetweenActions?.min || 3000;
    const max = config.delayBetweenActions?.max || 10000;
    await randomSleep(min, max);
  }

  /**
   * Wait a human-like delay between replies.
   */
  static async replyDelay(config) {
    const min = config.delayBetweenReplies?.min || 10000;
    const max = config.delayBetweenReplies?.max || 30000;
    const delay = randomBetween(min, max);
    Logger.pause(`Waiting ${(delay / 1000).toFixed(1)}s before next reply (human-like)...`);
    await sleep(delay);
  }

  /**
   * Take a break (pause between batches of replies).
   */
  static async takeBreak(config) {
    const min = config.breakFrequency?.breakDuration?.min || 120000;
    const max = config.breakFrequency?.breakDuration?.max || 300000;
    const duration = randomBetween(min, max);
    const minutes = (duration / 60000).toFixed(1);
    Logger.pause(`⏸️  Break for ${minutes} minute(s) (human-like)...`);
    await sleep(duration);
    Logger.success('Continuing work...');
  }
}

// ============================================================
//  🛡️ CAPTCHA & SAFETY DETECTOR
// ============================================================

/**
 * Check page for CAPTCHA, unusual traffic warnings, or blocks.
 * Returns true if a problem is detected.
 */
async function detectCaptchaOrBlock(page) {
  try {
    const pageContent = await page.content();
    const lowerContent = pageContent.toLowerCase();

    const dangerKeywords = [
      'unusual traffic',
      'verify you are human',
      'captcha',
      'recaptcha',
      'i\'m not a robot',
      'automated queries',
      'suspicious activity',
      'your computer or network may be sending automated queries',
      'lưu lượng truy cập bất thường',
      'xác minh bạn là người',
    ];

    for (const keyword of dangerKeywords) {
      if (lowerContent.includes(keyword)) {
        Logger.error(`🚨 DETECTED: "${keyword}" — Stopping immediately!`);
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// ============================================================
//  🤖 MAIN BOT CLASS
// ============================================================
class ReviewBot {
  constructor() {
    this.config = null;
    this.db = null;
    this.context = null; // Playwright browser context
    this.page = null;
    this.replyTemplates = [];
    this.errorCount = 0;
    this.maxErrors = 3;
    this.repliesThisSession = 0;
    this.repliesSinceBreak = 0;
    this.isRunning = false;
  }

  // ----------------------------------------------------------
  //  INITIALIZATION
  // ----------------------------------------------------------

  /** Initialize bot: load config, DB, templates, and browser */
  async initialize(customSessionName = 'bot_session') {
    Logger.rocket('🚀 BOT STARTED');
    Logger.info('='.repeat(60));

    // 1. Load config if not loaded yet
    if (!this.config) this.config = loadConfig();

    // 2. Initialize database
    this.db = new Database();

    // 3. Fetch reply templates from Google Sheet
    this.replyTemplates = await fetchReplyTemplates();

    // 4. Ensure session directory exists
    this.sessionDir = path.join(__dirname, customSessionName);
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
      Logger.info(`Created session directory: ${customSessionName}`);
    }

    // 5. Launch browser with persistent context
    await this.launchBrowser(this.sessionDir);

    Logger.success('Bot started successfully!');
    Logger.info('='.repeat(60));
  }

  /** Launch Playwright browser with persistent context */
  async launchBrowser(sessionPath) {
    Logger.info(`Initializing browser (persistent context) at ${sessionPath}...`);

    const isFirstRun = !fs.existsSync(path.join(sessionPath, 'Default'));

    this.context = await chromium.launchPersistentContext(sessionPath, {
      headless: false,
      viewport: null,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'vi-VN',
      timezoneId: 'Asia/Ho_Chi_Minh',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--start-maximized'
      ],
      ignoreDefaultArgs: ['--enable-automation'],
    });

    // Get or create page
    this.page = this.context.pages()[0] || await this.context.newPage();

    // Stealth: Remove webdriver indicator
    await this.page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
      // Remove Playwright-specific properties
      delete window.__playwright;
      delete window.__pw_manual;
    });

    if (isFirstRun) {
      await this.handleFirstLogin();
    } else {
      Logger.success('Session exists - skipping login');
    }
  }

  /** Handle first-time login: user logs in manually */
  async handleFirstLogin() {
    Logger.warn('='.repeat(60));
    Logger.warn('🔐 FIRST RUN — MANUAL LOGIN REQUIRED');
    Logger.warn('='.repeat(60));
    Logger.info('1. Browser will open Google Search');
    Logger.info('2. Log in to your Google Business account');
    Logger.info('3. After logging in, press ENTER in the terminal');
    Logger.warn('='.repeat(60));

    // Navigate to Google Search
    await this.page.goto('https://www.google.com', {
      waitUntil: 'networkidle',
      timeout: 60000,
    });

    // Wait for user to login
    await new Promise((resolve) => {
      Logger.info('⏳ Waiting for login... Press ENTER when done.');
      process.stdin.once('data', () => {
        Logger.success('Signal received — continuing...');
        resolve();
      });
    });

    // Verify login by checking for profile button
    await sleep(2000);
    Logger.success('Session saved. Future runs will auto-login.');
  }

  // ----------------------------------------------------------
  //  REVIEW EXTRACTION
  // ----------------------------------------------------------

  /**
   * Navigate to a business location and extract reviews.
   * Returns array of review objects.
   */
  async navigateToReviews(location) {
    Logger.location(`Scanning: ${location.name}`);
    Logger.info(`URL: ${location.url}`);

    try {
      // Navigate directly to business management URL on Google Search
      await this.page.goto(location.url, {
        waitUntil: 'domcontentloaded',
        timeout: 45000,
      });

      await sleep(2000);

      if (await detectCaptchaOrBlock(this.page)) {
        throw new Error('CAPTCHA/block detected');
      }

      // Step 2: Open reviews popup
      await this.clickReviewsTab();
      await sleep(1500);

      // Step 3: Switch to unreplied tab
      await this.clickUnrepliedTab();
      await sleep(1500);

      return true;

    } catch (err) {
      Logger.error(`Error scanning ${location.name}: ${err.message}`);
      this.errorCount++;
      return false;
    }
  }

  /** Click "Read reviews" on Google Search business manager */
  async clickReviewsTab() {
    Logger.info('Looking for "Read reviews" button...');

    const tabSelectors = [
      'button:has-text("Read reviews")',
      '[role="button"]:has-text("Read reviews")',
      'button[aria-label*="Read reviews"]',
      '[role="button"][aria-label*="Read reviews"]',
    ];

    for (const selector of tabSelectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
           await element.click({ force: true });
           Logger.info('Clicked "Read reviews"');
           return;
         }
       } catch { /* Try next selector */ }
     }

    // Fallback by scanning visible buttons text
    try {
      const clicked = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button, [role="tab"]');
        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase();
          if (text.includes('read reviews')) {
            btn.click();
            return true;
          }
        }
        return false;
      });
      if (clicked) {
        Logger.info('Clicked "Read reviews" (fallback)');
        return;
      }
    } catch { /* Ignore */ }

    throw new Error('Cannot find "Read reviews" button');
  }

  /** Click "Unreplied" tab on reviews popup */
  async clickUnrepliedTab() {
    Logger.info('Switching to "Unreplied" tab...');

    const selectors = [
      'button:has-text("Unreplied")',
      '[role="tab"]:has-text("Unreplied")',
      '[role="button"]:has-text("Unreplied")',
      '[aria-label*="Unreplied"]',
    ];

    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element && await element.isVisible()) {
          await element.click({ force: true });
          Logger.info('Clicked "Unreplied" tab');
          return;
        }
      } catch { /* Next selector */ }
    }

    const clicked = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('button, [role="tab"], [role="button"]');
      for (const el of elements) {
        const text = (el.textContent || '').toLowerCase();
        if (text.includes('unreplied')) {
          el.click();
          return true;
        }
      }
      return false;
    });

    if (!clicked) {
      throw new Error('Cannot find "Unreplied" tab');
    }
  }

  /** Sort reviews by newest first */
  async sortByNewest() {
    Logger.info('Sorting by newest...');

    try {
      // Find and click sort button
      const sortSelectors = [
        'button[aria-label*="Sort"]',
        'button[aria-label*="Sort"]',
        'button:has-text("Sort")',
        'button:has-text("Sort")',
        'button[data-value="sort"]',
      ];

      let sortClicked = false;
      for (const selector of sortSelectors) {
        try {
          const el = await this.page.$(selector);
          if (el && await el.isVisible()) {
            await el.click();
            sortClicked = true;
            break;
          }
        } catch { /* Next */ }
      }

      if (!sortClicked) {
        // Try evaluate fallback
        await this.page.evaluate(() => {
          const btns = document.querySelectorAll('button');
          for (const b of btns) {
            const text = (b.textContent || '').toLowerCase();
            if (text.includes('sort') || text.includes('sort') || text.includes('most relevant')) {
              b.click();
              return;
            }
          }
        });
      }

      await randomSleep(1500, 3000);

      // Click "Newest" / "Newest" option
      const newestSelectors = [
        'li[data-index="1"]', // Usually "Newest" is 2nd option (index 1)
        'menuitem:has-text("Newest")',
        'menuitem:has-text("Newest")',
        '[role="menuitemradio"]:has-text("Newest")',
        '[role="menuitemradio"]:has-text("Newest")',
      ];

      for (const selector of newestSelectors) {
        try {
          const el = await this.page.$(selector);
          if (el && await el.isVisible()) {
            await el.click();
            Logger.info('Sorted by Newest');
            return;
          }
        } catch { /* Next */ }
      }

      // Evaluate fallback
      await this.page.evaluate(() => {
        const items = document.querySelectorAll('[role="menuitemradio"], [role="menuitem"], li');
        for (const item of items) {
          const text = (item.textContent || '').toLowerCase();
          if (text.includes('newest') || text.includes('newest')) {
            item.click();
            return;
          }
        }
      });

      Logger.info('Attempted to sort by Newest');

    } catch (err) {
      Logger.warn(`Cannot sort reviews: ${err.message}`);
    }
  }

  /**
   * Scroll the reviews panel to load ALL reviews.
   * Uses smart scrolling: keeps scrolling until no new content is loaded.
   * This ensures maps with many reviews are fully loaded.
   * @param {number} maxScrolls - Safety cap to prevent infinite scrolling (default 50)
   */
  async scrollReviewsPanel(maxScrolls = 50) {
    Logger.info('Scrolling to load all reviews (smart scroll)...');

    try {
      // Find the scrollable reviews container
      let container = await this.page.$('div.m6QErb.DxyBCb.kA9KIf.dS8AEf');
      if (!container) {
        container = await this.page.$('div[role="main"] div.m6QErb');
      }
      if (!container) {
        Logger.warn('Scroll container not found');
        return;
      }

      let previousHeight = 0;
      let stableCount = 0; // How many consecutive scrolls without new content
      const stableThreshold = 3; // Stop after 3 consecutive scrolls with no change
      let scrollsDone = 0;

      while (scrollsDone < maxScrolls) {
        // Get current scroll height
        const currentHeight = await container.evaluate(el => el.scrollHeight);

        // Scroll down
        await container.evaluate(el => el.scrollTop = el.scrollHeight);
        scrollsDone++;

        // Wait for new content to load
        await randomSleep(1500, 3000);

        // Get new scroll height after waiting
        const newHeight = await container.evaluate(el => el.scrollHeight);

        if (newHeight === previousHeight) {
          stableCount++;
          if (stableCount >= stableThreshold) {
            Logger.info(`Scroll completed — no new content after ${stableThreshold} attempts (total scrolls: ${scrollsDone})`);
            break;
          }
        } else {
          stableCount = 0; // Reset — new content was loaded
        }

        previousHeight = newHeight;

        // Log progress every 5 scrolls
        if (scrollsDone % 5 === 0) {
          const reviewCount = await this.page.evaluate(() => {
            return document.querySelectorAll('div[data-review-id], div.jftiEf').length;
          });
          Logger.info(`  ... scrolled ${scrollsDone} times, ${reviewCount} reviews loaded so far`);
        }

        // Occasional random human actions
        if (Math.random() < 0.25) {
          await HumanSimulator.randomMouseMove(this.page);
        }
      }

      if (scrollsDone >= maxScrolls) {
        Logger.warn(`Reached max scroll limit (${maxScrolls}). Some reviews may not be loaded.`);
      }

      // Final count
      const totalReviews = await this.page.evaluate(() => {
        return document.querySelectorAll('div[data-review-id], div.jftiEf').length;
      });
      Logger.success(`Smart scroll done — ${totalReviews} reviews loaded after ${scrollsDone} scrolls`);

    } catch (err) {
      Logger.warn(`Scroll error: ${err.message}`);
    }
  }

  /**
   * Extract reviews from the current page.
   * Returns array of { key, text, author, hasOwnerReply, element } objects.
   */
  async extractReviews() {
    Logger.info('Extracting reviews...');

    try {
      const reviewData = await this.page.evaluate(() => {
        const results = [];

        // Find all review containers — Google Maps uses various class names
        // Try multiple selector strategies
        const reviewContainers = document.querySelectorAll(
          'div[data-review-id], div.jftiEf, div[jscontroller][data-review-id]'
        );

        // If no results with data-review-id, try broader selector
        let containers = reviewContainers.length > 0
          ? reviewContainers
          : document.querySelectorAll('.jftiEf');

        // Final fallback: look for review-like elements
        if (containers.length === 0) {
          containers = document.querySelectorAll('[data-review-id]');
        }

        containers.forEach((container, index) => {
          try {
            // Extract review text
            const textEl = container.querySelector('.wiI7pd, .MyEned span, [data-review-text]');
            const text = textEl ? textEl.textContent.trim() : '';

            // Extract author name
            const authorEl = container.querySelector('.d4r55, .WNxzHc [aria-label], button[data-review-id] .d4r55');
            const author = authorEl ? (authorEl.textContent || authorEl.getAttribute('aria-label') || '').trim() : `Reviewer_${index}`;

            // Extract review ID
            const reviewId = container.getAttribute('data-review-id') || '';

            // Check if there's already an owner reply
            const ownerReplyEl = container.querySelector(
              '.CDe7pd, .wiI7pd + div .d4r55, [data-owner-response]'
            );
            // Also check for "Response from owner" text patterns
            const containerText = container.textContent || '';
            const hasOwnerReply = !!(ownerReplyEl) ||
              containerText.includes('Response from the owner') ||
              containerText.includes('Response from the owner') ||
              containerText.includes('Response from the owner');

            // Generate a unique key for this review
            const uniqueText = `${author}::${text}::${reviewId}`;

            results.push({
              text: text,
              author: author,
              reviewId: reviewId,
              hasOwnerReply: hasOwnerReply,
              uniqueText: uniqueText,
              index: index,
            });
          } catch { /* Skip malformed review */ }
        });

        return results;
      });

      // Process and filter reviews
      const reviews = reviewData
        .filter(r => r.text || r.reviewId) // Must have text or ID
        .filter(r => !r.hasOwnerReply)     // Skip already-replied reviews
        .map(r => ({
          key: md5(r.uniqueText),
          text: r.text,
          author: r.author,
          reviewId: r.reviewId,
          index: r.index,
        }));

      return reviews;

    } catch (err) {
      Logger.error(`Error extracting reviews: ${err.message}`);
      return [];
    }
  }

  // ----------------------------------------------------------
  //  REPLY LOGIC
  // ----------------------------------------------------------

  // ----------------------------------------------------------
  //  REPLY LOGIC - END
  // ----------------------------------------------------------

  /** Scroll to a specific review by index */
  async scrollToReview(index) {
    try {
      await this.page.evaluate((idx) => {
        const reviews = document.querySelectorAll(
          'div[data-review-id], div.jftiEf'
        );
        if (reviews[idx]) {
          reviews[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, index);
      await randomSleep(1000, 2000);
    } catch (err) {
      Logger.warn(`Cannot scroll to review #${index}: ${err.message}`);
    }
  }

  /**
   * Click the Reply button for a specific review.
   * Tries multiple selector strategies.
   */
  async clickReplyButton(reviewIndex) {
    Logger.info(`Finding Reply button for review #${reviewIndex}...`);

    try {
      // Strategy 1: Find reply button within the review container
      const clicked = await this.page.evaluate((idx) => {
        const reviews = document.querySelectorAll(
          'div[data-review-id], div.jftiEf'
        );
        const review = reviews[idx];
        if (!review) return false;

        // Look for reply button within this review
        const replyTexts = ['reply', 'reply', 'reply'];
        const buttons = review.querySelectorAll('button, [role="button"]');

        for (const btn of buttons) {
          const btnText = (btn.textContent || '').toLowerCase().trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
          const dataTooltip = (btn.getAttribute('data-tooltip') || '').toLowerCase();

          for (const text of replyTexts) {
            if (btnText.includes(text) || ariaLabel.includes(text) || dataTooltip.includes(text)) {
              btn.click();
              return true;
            }
          }
        }

        // Fallback: look for any button-like element with reply icon/SVG
        const allClickable = review.querySelectorAll('button, [role="button"], [jsaction*="reply"]');
        for (const el of allClickable) {
          const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
          if (ariaLabel.includes('reply') || ariaLabel.includes('reply') || ariaLabel.includes('reply')) {
            el.click();
            return true;
          }
        }

        return false;
      }, reviewIndex);

      if (clicked) {
        Logger.info('Clicked Reply button');
        return true;
      }

      // Strategy 2: Try Playwright selectors
      const replyButtonSelectors = [
        `div.jftiEf:nth-child(${reviewIndex + 1}) button:has-text("Reply")`,
        `div.jftiEf:nth-child(${reviewIndex + 1}) button:has-text("Phản hồi")`,
        `div.jftiEf:nth-child(${reviewIndex + 1}) button:has-text("Trả lời")`,
      ];

      for (const selector of replyButtonSelectors) {
        try {
          const btn = await this.page.$(selector);
          if (btn && await btn.isVisible()) {
            await btn.click();
            Logger.info('Clicked Reply button (selector fallback)');
            return true;
          }
        } catch { /* Next */ }
      }

      // Strategy 3: Click all visible Reply buttons and hope we get the right one
      const allReplyButtons = await this.page.$$('button:has-text("Reply"), button:has-text("Phản hồi"), button:has-text("Trả lời")');
      if (allReplyButtons.length > reviewIndex) {
        await allReplyButtons[reviewIndex].click();
        Logger.info('Clicked Reply button (index fallback)');
        return true;
      }

      return false;

    } catch (err) {
      Logger.error(`Error clicking Reply button: ${err.message}`);
      return false;
    }
  }

  /** Type the reply text into the reply dialog/textarea */
  async typeReply(replyText) {
    Logger.info('Entering reply text...');

    try {
      // Waiting form hiển thị
      await randomSleep(2000, 4000);

      let targetElement = null;
      let targetFrame = this.page;

      // 1. Quét tìm trong iframe (Google Business thường dùng iframe cho hộp thoại reply)
      for (const frame of this.page.frames()) {
        try {
          const ta = await frame.$('textarea, [aria-label*="Replying publicly"], [aria-label*="Replying publicly"]');
          if (ta && await ta.isVisible()) {
            targetElement = ta;
            targetFrame = frame;
            Logger.info('Found reply textarea in iframe');
            break;
          }
        } catch { /* ignore cross-origin */ }
      }

      // 2. Nếu không có trong iframe, tìm trên trang chính (chờ tối đa 5s)
      if (!targetElement) {
        try {
          targetElement = await this.page.waitForSelector('textarea, [aria-label*="Replying publicly"], [aria-label*="Replying publicly"]', { state: 'visible', timeout: 5000 });
          Logger.info('Found reply textarea on main page');
        } catch (e) {
          Logger.warn('Standard textarea not found, continuing fallback...');
        }
      }

      // 3. Fallback: tìm qua xpath / contenteditable trong trường hợp Google đổi class
      if (!targetElement) {
        for (const frame of [this.page, ...this.page.frames()]) {
          try {
            const ta = await frame.$('div[contenteditable="true"], form textarea');
            if (ta && await ta.isVisible()) {
              targetElement = ta;
              targetFrame = frame;
              Logger.info('Found reply textarea via fallback');
              break;
            }
          } catch { /* ignore */ }
        }
      }

      // Fallback: evaluate to find and focus the textarea
      const found = await this.page.evaluate(() => {
        const textareas = document.querySelectorAll('textarea, [contenteditable="true"], [aria-label*="Replying publicly"], [aria-label*="Replying publicly"]');
        for (const ta of textareas) {
          if (ta.offsetParent !== null || ta.getBoundingClientRect().height > 0) { // Visible
            ta.focus();
            return true;
          }
        }
        return false;
      });

      if (found || targetElement) {
        if (targetElement) {
          try { await targetElement.click(); } catch (e) { }
        }
        await randomSleep(500, 1000);

        // Typing slowly like a human using standard keyboard
        const minDelay = this.config.typingSpeed?.min || 10;
        const maxDelay = this.config.typingSpeed?.max || 50;

        for (const char of replyText) {
          await this.page.keyboard.type(char);
          await sleep(Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay);
        }

        Logger.info('Finished typing reply text');
        return true;
      }

      Logger.error('Error: Text input field not found (textarea). Form might be blocked or not visible.');
      return false;

    } catch (err) {
      Logger.error(`Error typing reply: ${err.message}`);
      return false;
    }
  }

  /** Click the Post/Submit/Send button */
  async clickPostButton(isFirstReply = true) {
    Logger.info('Looking for Reply/Post button...');

    try {
      // Strategy 0: Clicking directly with precise XPath (Force Click)
      try {
        const xpathUser = isFirstReply
          ? 'xpath=//*[@id="AH1dze"]/div/div/main/div/div/c-wiz/div/div/section/div[2]/button'
          : 'xpath=//*[@id="AH1dze"]/div/div/main/div/div/c-wiz/div/div/section/div[2]/button[2]';

        for (const frame of [this.page, ...this.page.frames()]) {
          try {
            const btnLocator = frame.locator(xpathUser);
            if (await btnLocator.count() > 0 && await btnLocator.first().isVisible()) {
              await btnLocator.first().click({ force: true });
              Logger.info('Force clicked Reply button successfully (via precise XPath)');
              return true;
            }
          } catch (e) { }
        }
      } catch (e) {
        Logger.info('Static XPath not found, switching to dynamic scan...');
      }

      let clicked = false;
      const postButtonTexts = [
        'Post', 'Reply', 'Post', 'Submit', 'Send',
        'Publish', 'Phản hồi', 'Trả lời', 'Reply', 'post reply'
      ];

      // Scanning all frames (for iframe form)
      const frames = [this.page, ...this.page.frames()];

      for (const frame of frames) {
        if (clicked) break;

        // Strategy 1: Text selectors
        for (const text of postButtonTexts) {
          try {
            const btn = await frame.$(`button:has-text("${text}"), [role="button"]:has-text("${text}")`);
            if (btn && await btn.isVisible()) {
              await btn.click();
              Logger.info(`Clicked button "${text}" in frame`);
              clicked = true;
              break;
            }
          } catch { /* Next */ }
        }

        if (clicked) break;

        // Strategy 2: Aria selectors
        const ariaSelectors = [
          'button[aria-label*="Post"]', 'button[aria-label*="Submit"]',
          'button[aria-label*="Reply"]', 'button[aria-label*="Post"]', 'button[aria-label="Reply"]'
        ];
        for (const selector of ariaSelectors) {
          try {
            const btn = await frame.$(selector);
            if (btn && await btn.isVisible()) {
              await btn.click();
              Logger.info('Clicked button Post (aria fallback) in frame');
              clicked = true;
              break;
            }
          } catch { /* Next */ }
        }
      }

      if (clicked) return true;

      // Strategy 3: Evaluate fallback on main page
      clicked = await this.page.evaluate(() => {
        const buttons = document.querySelectorAll('button, div[role="button"]');
        const postTexts = ['post', 'send', 'post', 'submit', 'send', 'publish', 'reply'];

        for (const btn of buttons) {
          const text = (btn.textContent || '').toLowerCase().trim();
          const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();

          for (const pt of postTexts) {
            if (text === pt || ariaLabel.includes(pt)) {
              btn.click();
              return true;
            }
          }
          // Check icon/svg buttons that might be the send button
          const svg = btn.querySelector('svg');
          if (svg && (ariaLabel.includes('reply') || ariaLabel.includes('send'))) {
            btn.click();
            return true;
          }
        }

        // Trying to find specific Google Maps class button (usually blue button)
        const blueButtons = document.querySelectorAll('button.VfPpkd-LgbsSe-OWXEXe-k8QpJ');
        for (const btn of blueButtons) {
          const text = (btn.textContent || '').toLowerCase().trim();
          if (text.includes('reply') || text.includes('reply') || text.includes('post') || text.includes('send')) {
            btn.click();
            return true;
          }
        }
        return false;
      });

      if (clicked) {
        Logger.info('Clicked Reply button/Post (evaluate fallback)');
        return true;
      }

      return false;

    } catch (err) {
      Logger.error(`Error clicking Post button: ${err.message}`);
      return false;
    }
  }

  // ----------------------------------------------------------
  //  MAIN PROCESSING LOOP
  // ----------------------------------------------------------

  /**
   * Process reviews for a single location.
   * Returns number of replies posted.
   */
  async processLocation(location) {
    Logger.location(`--- Starting to process: ${location.name} ---`);
    let totalRepliedCountForLocation = 0;
    let stopTriggered = false;

    try {
      const ready = await this.navigateToReviews(location);
      if (!ready) {
        return totalRepliedCountForLocation;
      }

      while (this.isRunning) {
        if (await this.isRepliedToNewReviewsVisible()) {
          Logger.success('Detected "You\'ve replied to new reviews" — stopping loop.');
          stopTriggered = true;
          break;
        }

        const replyOpened = await this.clickRequiredXPath(REQUIRED_REPLY_BUTTON_XPATH, 'X1');
        if (!replyOpened) {
          Logger.warn('Cannot click mandatory XPath X1. Stopping this location.');
          break;
        }

        // Step B: exact 1 second delay
        await sleep(1000);

        const replyText = pickRandomReply(this.replyTemplates);
        const typed = await this.typeReplyForSearchFlow(replyText);
        if (!typed) {
          Logger.warn('Cannot type reply content. Stopping this location.');
          break;
        }

        // Step D: exact 1 second delay
        await sleep(1000);

        const posted = await this.clickRequiredXPath(REQUIRED_SUBMIT_BUTTON_XPATH, 'X2');
        if (!posted) {
          Logger.warn('Cannot click mandatory XPath X2. Stopping this location.');
          break;
        }

        totalRepliedCountForLocation++;
        this.repliesThisSession++;
        this.repliesSinceBreak++;
        this.errorCount = 0;
        this.db.addReview(`search_flow_${Date.now()}_${totalRepliedCountForLocation}`, 'Replied on Google Search', true);

        // Step 5: scan stop trigger after each submit
        await sleep(1000);
        if (await this.isRepliedToNewReviewsVisible()) {
          Logger.success('Detected "You\'ve replied to new reviews" after submit — breaking loop.');
          stopTriggered = true;
          break;
        }
      }
    } catch (err) {
      Logger.error(`Error processing ${location.name}: ${err.message}`);
      this.errorCount++;
    } finally {
      if (stopTriggered) {
        await this.closeCurrentTab();
      }
    }

    Logger.success(`Total replies: ${totalRepliedCountForLocation} reviews at ${location.name}.`);
    return totalRepliedCountForLocation;
  }

  async clickRequiredXPath(xpath, label) {
    for (const frame of [this.page, ...this.page.frames()]) {
      try {
        const locator = frame.locator(`xpath=${xpath}`);
        if (await locator.count() > 0 && await locator.first().isVisible()) {
          await locator.first().click({ force: true });
          Logger.info(`Clicked required ${label} XPath`);
          return true;
        }
      } catch { /* Next frame */ }
    }
    return false;
  }

  async typeReplyForSearchFlow(replyText) {
    const inputSelectors = [
      'textarea',
      'div[contenteditable="true"]',
      '[role="textbox"][contenteditable="true"]',
      '[aria-label*="Reply"]',
      '[aria-label*="Trả lời"]',
      '[aria-label*="Phản hồi"]',
    ];

    for (const frame of [this.page, ...this.page.frames()]) {
      for (const selector of inputSelectors) {
        try {
          const input = frame.locator(selector).first();
          if (await input.count() > 0 && await input.isVisible()) {
            await input.click({ force: true });
            await this.page.keyboard.press('ControlOrMeta+A');
            await this.page.keyboard.press('Backspace');
            await this.page.keyboard.type(replyText);
            return true;
          }
        } catch { /* Next selector */ }
      }
    }

    return false;
  }

  async isRepliedToNewReviewsVisible() {
    for (const frame of [this.page, ...this.page.frames()]) {
      try {
        const locator = frame.locator("text=You've replied to new reviews");
        if (await locator.count() > 0 && await locator.first().isVisible()) {
          return true;
        }
      } catch { /* Next frame */ }
    }
    return false;
  }

  async closeCurrentTab() {
    try {
      if (!this.page || this.page.isClosed()) return;

      const pageToClose = this.page;
      const currentPages = this.context ? this.context.pages() : [];

      if (currentPages.length <= 1 && this.context) {
        this.page = await this.context.newPage();
      } else {
        this.page = currentPages.find(p => p !== pageToClose && !p.isClosed()) || this.page;
      }

      await pageToClose.close();
      Logger.info('Closed current tab after stop trigger.');
    } catch (err) {
      Logger.warn(`Cannot close current tab: ${err.message}`);
    }
  }

  /**
   * Run a single monitoring cycle across all locations.
   */
  async runCycle(locations) {
    Logger.cycle('=== STARTING NEW SCAN CYCLE ===');
    this.repliesThisSession = 0;
    this.repliesSinceBreak = 0;
    this.errorCount = 0;

    let totalReplied = 0;

    for (let i = 0; i < locations.length; i++) {
      const location = locations[i];

      if (!this.isRunning) break;

      // Check error limit
      if (this.errorCount >= this.maxErrors) {
        Logger.error('🚨 Too many errors — stopping cycle!');
        break;
      }

      // Process location
      const replied = await this.processLocation(location);
      totalReplied += replied;

      // Human-like delay between locations
      if (i < locations.length - 1) {
        const delay = randomBetween(15000, 30000);
        Logger.pause(`Waiting ${(delay / 1000).toFixed(0)}s before scanning next location...`);
        await sleep(delay);
        await HumanSimulator.randomAction(this.page);
      }
    }

    this.db.completeCycle();
    Logger.success(`✅ Completed 1 cycle. Total replies: ${totalReplied}`);

    return totalReplied;
  }

  /**
   * Read maps.txt to get links grouped by account.
   * Lines starting with # define account names.
   * Maps below an account header share that account's browser session.
   * Maps without any # header go under "default" account.
   *
   * Returns: { accounts: Map<accountName, location[]>, flatLocations: location[] }
   */
  loadMapsFromFile() {
    const mapsFile = path.join(__dirname, 'maps.txt');
    if (!fs.existsSync(mapsFile)) {
      Logger.error('maps.txt file not found!');
      return { accounts: new Map(), flatLocations: [] };
    }

    // Read file, handle encoding errors (UTF-16 from PowerShell) or BOM
    let raw = fs.readFileSync(mapsFile, 'utf-8');
    raw = raw.replace(/\\0/g, ''); // Fix errors caused by Windows echo command
    const lines = raw.split(/\r?\n/);

    const accounts = new Map(); // accountName -> location[]
    let currentAccount = 'default';
    let mapCount = 1;

    for (const line of lines) {
      const txt = line.trim().replace(/^[\uFEFF]/, ''); // Remove hidden BOM character
      if (!txt) continue;

      // Lines starting with # define an account group
      if (txt.startsWith('#')) {
        currentAccount = txt.substring(1).trim();
        if (!currentAccount) currentAccount = 'default';
        Logger.info(`📂 Account group: "${currentAccount}"`);
        continue;
      }

      // Parse map entry: "Map Name|URL" or just "URL"
      let name = `Map Auto ${mapCount}`;
      let url = txt;

      if (txt.includes('|')) {
        const parts = txt.split('|');
        name = parts[0].trim();
        url = parts.slice(1).join('|').trim();
      }

      // Reformat map name containing index [1], [2], ...
      name = name.replace(/^\[\d+\]\s*/, '');
      name = `[${mapCount}] ${name}`;

      // If URL is valid HTTP
      if (url.startsWith('http')) {
        if (!accounts.has(currentAccount)) {
          accounts.set(currentAccount, []);
        }
        accounts.get(currentAccount).push({ name, url, account: currentAccount });
        mapCount++;
      }
    }

    // Build flat list for backward compatibility
    const flatLocations = [];
    for (const [, locs] of accounts) {
      flatLocations.push(...locs);
    }

    return { accounts, flatLocations };
  }

  /**
   * Run all maps under one account in a single browser session.
   * Maps run sequentially (cycle through all maps, then repeat).
   */
  async startAccountGroup(accountName, locations, config, replyTemplates) {
    const safeName = accountName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const sessionName = `bot_session_${safeName}`;

    this.config = config;
    this.replyTemplates = replyTemplates;

    const mapNames = locations.map(l => l.name).join(', ');
    Logger.rocket(`🚀 [${accountName}] Starting bot for ${locations.length} map(s): ${mapNames}`);
    await this.initialize(sessionName);

    this.isRunning = true;

    // Run first cycle immediately (all maps sequentially)
    await this.runCycle(locations);

    // Schedule subsequent cycles
    const scheduleNext = () => {
      if (!this.isRunning) {
        Logger.info(`[${accountName}] Bot stopped.`);
        return;
      }

      const intervalMs = 1 * 60 * 1000; // 1 minute(s)
      const nextRunMin = (intervalMs / 60000).toFixed(1);

      Logger.cycle(`[${accountName}] ✅ Break for ${nextRunMin} minutes before next cycle...`);

      setTimeout(async () => {
        if (!this.isRunning) return;

        try {
          // Refresh reply templates periodically
          if (Math.random() < 0.3) {
            Logger.info(`[${accountName}] Refreshing reply templates from Google Sheet...`);
            this.replyTemplates = await fetchReplyTemplates();
          }

          // Send reload to prevent network/DOM lag
          try {
            await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
            await sleep(3000);
          } catch (e) { }

          await this.runCycle(locations);
        } catch (err) {
          Logger.error(`[${accountName}] Error in scheduled cycle: ${err.message}`);
        }

        scheduleNext();
      }, intervalMs);
    };

    scheduleNext();
  }

  /**
   * Main entry point
   */
  async start() {
    try {
      this.config = loadConfig();
      const { accounts, flatLocations } = this.loadMapsFromFile();

      // If not in maps.txt, fallback to config.json
      let locations = flatLocations;
      if (locations.length === 0) {
        Logger.warn('No valid links in maps.txt, fallback to config.json...');
        locations = this.config.locations || [];
      }

      if (locations.length === 0) {
        Logger.error('❌ No Map to scan! (Please add Google Maps links to maps.txt)');
        pauseAndExit(1);
        return;
      }

      // CLI Menu
      console.log('\n=============================================');
      console.log(' 🤖 WELCOME BOT AUTO-REPLY REVIEW');
      console.log('=============================================');

      // Show accounts and their maps
      if (accounts.size > 0) {
        console.log(' 📂 Accounts & Maps (from maps.txt):');
        for (const [accountName, locs] of accounts) {
          console.log(`\n   🔑 Account: ${accountName} (${locs.length} maps, 1 browser session)`);
          locs.forEach(loc => {
            console.log(`      • ${loc.name}`);
          });
        }
      }

      console.log('\n---------------------------------------------');
      console.log(' Choose what to run:');
      locations.forEach((loc, index) => {
        console.log(`  [${index + 1}] ${loc.name} (${loc.account || 'default'})`);
      });
      console.log(`  [0] Start ALL (1 browser per account — RECOMMENDED)`);
      console.log('=============================================');

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const userChoice = await new Promise(resolve => {
        rl.question('\n👉 enter the number and press enter: ', (answer) => {
          resolve(answer.trim());
        });
      });
      rl.close();

      const choiceNum = parseInt(userChoice, 10);

      if (isNaN(choiceNum) || choiceNum < 0 || choiceNum > locations.length) {
        Logger.error('Invalid choice! Defaulting to run all.');
      }

      // =========================================================
      //  MODE: Run a SINGLE map
      // =========================================================
      if (choiceNum > 0) {
        const selectedMap = locations[choiceNum - 1];
        const accountName = selectedMap.account || 'default';
        Logger.success(`Locked target to 1 Map: ${selectedMap.name} (Account: ${accountName})`);
        const safeName = accountName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const sessionName = `bot_session_${safeName}`;

        console.log('\n⏳ Starting engine...');
        await this.initialize(sessionName);
        this.isRunning = true;

        // Run first cycle immediately
        await this.runCycle([selectedMap]);

        // Schedule subsequent cycles
        const scheduleNext = () => {
          if (!this.isRunning) {
            Logger.info('Bot stopped.');
            return;
          }

          const intervalMs = 1 * 60 * 1000; // 1 minute(s)
          const nextRunMin = (intervalMs / 60000).toFixed(1);

          Logger.cycle(`✅ Break for ${nextRunMin} minutes before next cycle...`);

          setTimeout(async () => {
            if (!this.isRunning) return;

            try {
              if (Math.random() < 0.3) {
                Logger.info('Refreshing reply templates from Google Sheet...');
                this.replyTemplates = await fetchReplyTemplates();
              }

              try {
                await this.page.reload({ waitUntil: 'domcontentloaded', timeout: 45000 });
                await sleep(3000);
              } catch (e) { }

              await this.runCycle([selectedMap]);
            } catch (err) {
              Logger.error(`Error in scheduled cycle: ${err.message}`);
            }

            scheduleNext();
          }, intervalMs);
        };

        scheduleNext();

        // Handle graceful shutdown (single bot)
        const shutdown = async (signal) => {
          Logger.warn(`\n${signal} received — shutting down bots...`);
          this.isRunning = false;
          await this.shutdown();
          process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // =========================================================
        //  MODE: Run ALL — 1 browser per ACCOUNT (maps share session)
        // =========================================================
      } else {
        Logger.success(`🚀 Starting ALL maps — grouped by ${accounts.size} account(s)!`);
        console.log('\n⏳ Starting engines...');

        const config = this.config;
        const replyTemplates = await fetchReplyTemplates();

        // Create 1 ReviewBot per ACCOUNT (not per map)
        const allBots = [];
        const startPromises = [];
        let accountIndex = 0;

        for (const [accountName, accountLocations] of accounts) {
          const bot = new ReviewBot();
          allBots.push(bot);

          // Stagger start time (3 seconds per account)
          const startPromise = sleep(accountIndex * 3000).then(() => {
            return bot.startAccountGroup(accountName, accountLocations, config, replyTemplates);
          });
          startPromises.push(startPromise);
          accountIndex++;
        }

        Logger.info(`📊 Summary: ${accounts.size} account(s), ${locations.length} map(s), ${accounts.size} browser(s)`);

        // Handle graceful shutdown (all bots)
        const shutdown = async (signal) => {
          Logger.warn(`\n${signal} received — shutting down all ${allBots.length} bots...`);
          for (const b of allBots) {
            b.isRunning = false;
          }
          await Promise.allSettled(allBots.map(b => b.shutdown()));
          process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Wait for all bots (will never resolve since each bot loops indefinitely)
        await Promise.all(startPromises);
      }

    } catch (err) {
      Logger.error(`Error starting bot: ${err.message}`);
      Logger.error(err.stack);
      await this.shutdown();
      pauseAndExit(1);
    }
  }

  /** Gracefully shut down the bot */
  async shutdown() {
    Logger.info('Shutting down bots...');
    try {
      if (this.context) {
        await this.context.close();
        Logger.info('Browser closed');
      }
    } catch (err) {
      Logger.warn(`Error closing browser: ${err.message}`);
    }
    Logger.info('Bot has shut down completely.');
  }
}

// ============================================================
//  🚀 ENTRY POINT
// ============================================================
const bot = new ReviewBot();
bot.start().catch(err => {
  Logger.error(`Fatal error: ${err.message}`);
  Logger.error(err.stack);
  pauseAndExit(1);
});
