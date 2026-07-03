# 🧠 NeuroMind — ADHD Assessment Platform

A full-stack ADHD cognitive assessment platform built with React, Node.js, Express, and MySQL.

---

## 📁 Project Structure

```
neuromind/
├── backend/                    # Express.js API server
│   ├── config/
│   │   ├── database.js         # MySQL connection pool
│   │   └── schema.sql          # All database tables + sample data
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, OTP logic
│   │   ├── profileController.js
│   │   └── assessmentController.js  # All 9 tests + reports
│   ├── middleware/
│   │   └── auth.js             # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── profile.js
│   │   └── assessments.js
│   ├── utils/
│   │   └── email.js            # OTP email via Nodemailer
│   ├── server.js               # Main Express server
│   ├── package.json
│   └── .env.example            # Copy to .env and fill in values
│
└── frontend/                   # React.js app
    ├── public/
    │   └── index.html
    └── src/
        ├── components/
        │   ├── auth/
        │   │   ├── OTPInput.js      # 6-digit OTP input with auto-focus
        │   │   └── OTPVerify.js     # OTP verification page (shared)
        │   ├── common/
        │   │   └── ProtectedRoute.js
        │   └── layout/
        │       ├── Sidebar.js       # Left navigation sidebar
        │       └── AppLayout.js     # Authenticated page wrapper
        ├── context/
        │   └── AuthContext.js       # Global auth state (JWT + user)
        ├── pages/
        │   ├── LandingPage.js       # Public homepage
        │   ├── LoginPage.js         # Login with 2FA OTP
        │   ├── RegisterPage.js      # Registration with DOB picker
        │   ├── DashboardPage.js     # Main dashboard + charts
        │   ├── AssessmentsPage.js   # Assessment overview
        │   ├── ProfilePage.js       # Edit profile + delete account
        │   └── assessments/
        │       ├── StoryTest.js     # Reading comprehension
        │       ├── MemoryGame.js    # Card matching game
        │       ├── PatternTest.js   # Pattern recognition
        │       ├── ReactionTest.js  # Reaction time
        │       ├── GoNoGoTest.js    # Impulse control
        │       ├── StroopTest.js    # Color-word interference
        │       ├── SequenceTest.js  # Simon Says style
        │       ├── VisualSearchTest.js # Find target in grid
        │       └── CPTTest.js       # Continuous performance
        ├── utils/
        │   └── api.js              # Axios instance with JWT
        ├── App.js                  # Router setup
        ├── index.js
        └── index.css               # Global styles + color system
```

---

## ⚡ Quick Setup (Step by Step)

### Prerequisites
- Node.js v16+ installed
- MySQL 8.0+ installed and running
- Gmail account (for OTP emails)

---

### Step 1 — Database Setup

Open MySQL and run the schema:

```bash
mysql -u root -p
```

Then inside MySQL shell:

```sql
source /path/to/neuromind/backend/config/schema.sql
```

Or using MySQL Workbench: File → Open SQL Script → Run.

---

### Step 2 — Backend Setup

```bash
cd neuromind/backend

# Copy environment file
cp .env.example .env
```

Now edit `.env` with your values:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=neuromind_db
JWT_SECRET=any_long_random_string_here
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> **Gmail App Password:** Go to Google Account → Security → 2-Step Verification → App Passwords. Generate one for "Mail".

Install and run:

```bash
npm install
npm run dev       # Development (with nodemon)
# or
npm start         # Production
```

Backend runs at: **http://localhost:5000**

Test it: http://localhost:5000/api/health

---

### Step 3 — Frontend Setup

```bash
cd neuromind/frontend
npm install
npm start
```

Frontend runs at: **http://localhost:3000**

The `"proxy": "http://localhost:5000"` in package.json routes API calls automatically.

---

## 🔐 Authentication Flow

```
REGISTRATION:
  Enter details → POST /api/auth/register → OTP sent to email
  Enter OTP     → POST /api/auth/verify-registration-otp → Account created

LOGIN:
  Email + Password → POST /api/auth/login → OTP sent to email
  Enter OTP        → POST /api/auth/verify-login-otp → JWT token returned
  JWT stored in localStorage → All protected routes use it
```

---

## 🧪 Assessment Tests

| Test | What it Measures | Score Basis |
|------|-----------------|-------------|
| 📖 Story | Reading comprehension | 2pts/question, max 10 |
| 🧩 Memory Game | Working memory | Points per match, 5 levels |
| 🔷 Pattern | Visual reasoning | 10pts/correct, 10 questions |
| ⚡ Reaction Time | Processing speed | Based on avg ms, 7 rounds |
| 🚦 Go/No-Go | Impulse control | Accuracy - false alarms |
| 🌈 Stroop | Cognitive flexibility | Accuracy + response time |
| 🔢 Sequence | Short-term memory | Level reached × 10 |
| 🔍 Visual Search | Selective attention | Finds + speed |
| ⏱️ CPT | Sustained attention | Hit rate - false alarms |

---

## 📊 ADHD Risk Levels

| Score | Category | Action |
|-------|----------|--------|
| 80–100 | ✅ Stable | Normal range |
| 50–79 | ⚠️ Average | Some markers detected |
| 0–49 | 🚨 High Risk | Psychiatrist contact shown |

---

## 🎨 Color System

| Name | Hex | Usage |
|------|-----|-------|
| Indigo | #4F46E5 | Primary actions, links |
| Teal | #14B8A6 | Secondary, accents |
| Sky Blue | #38BDF8 | Highlights |
| Stable Green | #22C55E | Success states |
| Average Amber | #F59E0B | Warning states |
| High Risk Red | #EF4444 | Danger states |

---

## 🌐 API Endpoints

### Auth
```
POST /api/auth/register
POST /api/auth/verify-registration-otp
POST /api/auth/login
POST /api/auth/verify-login-otp
POST /api/auth/resend-otp
```

### Profile (JWT required)
```
GET  /api/profile
PUT  /api/profile
DELETE /api/profile
```

### Assessments (JWT required)
```
POST /api/assessments/story-test
POST /api/assessments/memory-test
POST /api/assessments/pattern-test
POST /api/assessments/reaction-test
POST /api/assessments/go-no-go-test
POST /api/assessments/stroop-test
POST /api/assessments/sequence-recall-test
POST /api/assessments/visual-search-test
POST /api/assessments/continuous-performance-test
GET  /api/assessments/dashboard
GET  /api/assessments/history
POST /api/assessments/generate-report
```

---

## 🔧 Common Issues

**MySQL connection error:**
- Check `DB_PASSWORD` in `.env`
- Ensure MySQL service is running: `sudo service mysql start`

**Email not sending:**
- Use Gmail App Password, not your regular password
- Enable 2-Step Verification first
- Check spam folder during testing

**OTP not arriving:**
- Check EMAIL_USER and EMAIL_PASS in `.env`
- For development, you can add `console.log(otp)` in `utils/email.js` temporarily

**CORS error:**
- Make sure backend is running on port 5000
- The proxy setting in frontend package.json handles this in development

---

## 📱 Pages Overview

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Landing page |
| `/register` | Public | Create account |
| `/login` | Public | Sign in |
| `/dashboard` | Auth | Main hub + ADHD score |
| `/assessments` | Auth | All tests overview |
| `/assessments/story` | Auth | Story test |
| `/assessments/memory` | Auth | Memory game |
| `/assessments/pattern` | Auth | Pattern test |
| `/assessments/reaction` | Auth | Reaction test |
| `/assessments/gonogo` | Auth | Go/No-Go |
| `/assessments/stroop` | Auth | Stroop test |
| `/assessments/sequence` | Auth | Sequence recall |
| `/assessments/visual-search` | Auth | Visual search |
| `/assessments/cpt` | Auth | CPT test |
| `/profile` | Auth | Edit profile |
