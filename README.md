# ENTITLED - Secure Financial Vault with Privileged Access Management

## 🔐 Overview

ENTITLED is a cybersecurity-focused full-stack application implementing a **Zero Trust** privileged access management system for financial data. The system enforces strict security controls including:

- ✅ AES-256 encryption for all sensitive vault records
- ✅ Argon2 password hashing with automatic salting
- ✅ TOTP-based Multi-Factor Authentication (Microsoft Authenticator compatible)
- ✅ Time-bound privilege sessions (exactly 3 minutes)
- ✅ Role-Based Access Control (RBAC)
- ✅ Comprehensive audit logging
- ✅ JWT-based authentication
- ✅ Server-side security enforcement (never trust the client)

---

## 🏗️ Architecture

### Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM)
- PostgreSQL (Database)
- Alembic (Migrations)
- Argon2 (Password hashing)
- AES-256/Fernet (Data encryption)
- PyOTP (TOTP MFA)
- JWT (Authentication tokens)

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TypeScript
- Axios (HTTP client)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

1. **Python 3.11+**
2. **Node.js 18+** and **npm**
3. **PostgreSQL 14+**
4. **Microsoft Authenticator** (or any TOTP-compatible authenticator app)

---

## 🚀 Setup Instructions

### Step 1: Clone/Extract the Project

```bash
cd entitled
```

### Step 2: Database Setup

1. **Install PostgreSQL** (if not already installed)

2. **Create the database:**
```bash
psql -U postgres
```

Then in the PostgreSQL shell:
```sql
CREATE DATABASE entitled_db;
CREATE USER kundhave WITH PASSWORD 'codingmaster31';
GRANT ALL PRIVILEGES ON DATABASE entitled_db TO kundhave;
\q
```

3. **Verify database connection:**
```bash
psql -U kundhave -d entitled_db
\q
```

### Step 3: Backend Setup

1. **Navigate to backend directory:**
```bash
cd backend
```

2. **Create and activate Python virtual environment:**
```bash
python -m venv venv

# On Linux/Mac:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

3. **Install Python dependencies:**
```bash
pip install -r requirements.txt
```

4. **Verify the `.env` file exists in the project root** (one level up from backend):
```bash
cd ..
cat .env
```

You should see:
```
SECRET_KEY=ShUx2SEG3DBzTu-hUyGVY-Ppxtj-FJgJ_xxOID3Lpt0
ENCRYPTION_KEY=T2gHofJPcOpRjk29Bm6pEVn/TxWv7I3kGmtf1HYAuGI=
DATABASE_URL=postgresql://kundhave:codingmaster31@localhost:5432/entitled_db
```

5. **Run Alembic migrations:**
```bash
cd backend
alembic upgrade head
```

You should see output like:
```
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial, Initial migration - create all tables
```

6. **Seed the database with initial data:**
```bash
python seed_data.py
```

This will create:
- 3 employees (employee1, employee2, employee3)
- 3 admins (admin1, admin2, admin3)
- 1 auditor (auditor)
- 5 vault items with encrypted financial records

**Important:** Note the credentials displayed after seeding!

7. **Start the backend server:**
```bash
uvicorn main:app --reload
```

The backend will run at: **http://localhost:8000**

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Step 4: Frontend Setup

**Open a new terminal** (keep the backend running)

1. **Navigate to frontend directory:**
```bash
cd frontend
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will run at: **http://localhost:3000**

You should see:
```
- Local:        http://localhost:3000
```

---

## 🔑 MFA Setup (CRITICAL)

**Every user MUST set up MFA before they can access privileged data.**

### Setting up MFA for Each User:

1. **Login** with user credentials
2. Click **"Setup MFA"** button in the dashboard
3. **Scan the QR code** with Microsoft Authenticator:
   - Open Microsoft Authenticator app
   - Tap "+" to add account
   - Select "Other (Google, Facebook, etc.)"
   - Scan the QR code displayed
4. The app will now generate 6-digit codes every 30 seconds
5. Use these codes when accessing vault data

**Alternative Manual Entry:**
If you can't scan the QR code, use the secret key shown below the QR code to manually add the account in your authenticator app.

---

## 👥 User Credentials

### Employees (password: `employee123`)
- `employee1`
- `employee2`
- `employee3`

### Admins (password: `admin123`)
- `admin1`
- `admin2`
- `admin3`

### Auditor (password: `auditor123`)
- `auditor`

---

## 🎯 User Flows

### Employee Flow:

1. **Login** at http://localhost:3000
2. **Setup MFA** (scan QR code with Microsoft Authenticator)
3. View available vault items (titles only)
4. Click **"Request Access"** for a vault item
5. Select an admin and provide a reason
6. Wait for admin approval
7. Once approved, click **"Access Sensitive Data"**
8. Enter the 6-digit MFA code from your authenticator
9. View decrypted vault records for **exactly 3 minutes**
10. Session auto-expires after 3 minutes

### Admin Flow:

1. **Login** at http://localhost:3000
2. **Setup MFA** (scan QR code with Microsoft Authenticator)
3. **Vault Access Section:**
   - View all vault items
   - Click **"Access"** to view any vault
   - Enter MFA code
   - View records for 3 minutes (no approval needed)
4. **Access Requests Section:**
   - View pending employee requests
   - See vault title and employee's reason
   - Click **"Approve"** or **"Reject"**

### Auditor Flow:

1. **Login** at http://localhost:3000
2. View comprehensive audit logs:
   - Who accessed what
   - When they accessed it
   - Who approved/rejected requests
   - All privileged actions
3. Filter and search logs
4. View action statistics

---

## 🔒 Security Features

### 1. Password Security
- All passwords hashed with **Argon2** (automatic salting)
- Never stored in plaintext
- Never reversible

### 2. Data Encryption
- All vault records encrypted with **AES-256** before database insertion
- Encryption key stored in environment variable
- Decryption only happens server-side during privileged access

### 3. MFA (TOTP)
- TOTP secrets encrypted in database
- Compatible with Microsoft Authenticator
- Required for EVERY privileged access
- Server-side verification only

### 4. Privilege Management
- **Zero Trust**: JWT ≠ privileged access
- Employees need approval + MFA
- Admins need MFA (no approval)
- Sessions expire after EXACTLY 3 minutes (server-enforced)
- No client-side trust

### 5. Audit Logging
- ALL privileged actions logged
- Login events tracked
- Access requests logged
- Approvals/rejections recorded
- Immutable audit trail

### 6. Role-Based Access Control
- Enforced server-side via FastAPI dependencies
- Frontend checks are secondary only
- No client-side security reliance

---

## 📊 Database Schema

### Users
- Stores user credentials (hashed), role, encrypted TOTP secret

### Vault Items
- Stores vault metadata (title only)

### Vault Records
- Stores **AES-256 encrypted** financial data JSON

### Access Requests
- Employee requests for vault access
- Status: pending/approved/rejected

### Privilege Sessions
- Active privileged access sessions
- Auto-expires after 3 minutes
- Server tracks expiry

### Audit Logs
- Immutable log of all security events
- Actor, action, target, timestamp, metadata

---

## 🧪 Testing the System

### Test Scenario 1: Employee Access Flow

1. Login as `employee1`
2. Setup MFA
3. Request access to "Q4 2024 Venture Capital Portfolio"
4. Select `admin1` as approver
5. Provide reason: "Need to review investment performance"
6. Logout

7. Login as `admin1`
8. Setup MFA
9. Go to "Pending Requests"
10. Approve the request from employee1
11. Logout

12. Login as `employee1`
13. Click "Access Sensitive Data" for the approved vault
14. Enter MFA code
15. View decrypted financial records
16. Wait 3 minutes and observe session expiry

### Test Scenario 2: Admin Direct Access

1. Login as `admin1`
2. In "Vault Access" section, click "Access" on any vault
3. Enter MFA code
4. View records immediately (no approval needed)
5. Observe 3-minute timer

### Test Scenario 3: Audit Trail

1. Login as `auditor`
2. View all logged actions from previous tests
3. Filter by action type
4. Review metadata for each event

---

## 🛑 Security Rules (NON-NEGOTIABLE)

1. ❌ **NO password reset** (not implemented by design)
2. ❌ **NO signup** (users pre-seeded only)
3. ❌ **NO client-side security enforcement**
4. ✅ **ALL sensitive data encrypted**
5. ✅ **MFA required for ALL privilege escalation**
6. ✅ **3-minute session limit (server-enforced)**
7. ✅ **ALL privileged actions audited**
8. ✅ **Zero Trust model**

---

## 📁 Project Structure

```
entitled/
├── .env                          # Environment variables
├── .gitignore
├── README.md
├── backend/
│   ├── alembic/                  # Database migrations
│   │   ├── versions/
│   │   │   └── 001_initial.py
│   │   ├── env.py
│   │   └── script.py.mako
│   ├── alembic.ini
│   ├── audit.py                  # Audit logging utility
│   ├── config.py                 # Settings management
│   ├── database.py               # SQLAlchemy setup
│   ├── dependencies.py           # Auth & RBAC dependencies
│   ├── main.py                   # FastAPI application
│   ├── models.py                 # Database models
│   ├── requirements.txt
│   ├── schemas.py                # Pydantic schemas
│   ├── security.py               # Encryption, hashing, JWT, MFA
│   └── seed_data.py              # Database seeding script
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.js
    └── src/
        ├── app/
        │   ├── globals.css
        │   ├── layout.tsx
        │   ├── page.tsx          # Login page
        │   ├── employee/
        │   │   └── page.tsx      # Employee dashboard
        │   ├── admin/
        │   │   └── page.tsx      # Admin dashboard
        │   └── auditor/
        │       └── page.tsx      # Auditor dashboard
        └── lib/
            └── api.ts            # API client
```

---

## 🐛 Troubleshooting

### Backend won't start
- Verify PostgreSQL is running: `pg_isready`
- Check database connection: `psql -U kundhave -d entitled_db`
- Verify `.env` file exists and has correct values
- Ensure virtual environment is activated

### Frontend won't start
- Delete `node_modules` and run `npm install` again
- Verify Node.js version: `node --version` (should be 18+)

### MFA code not working
- Ensure phone time is synchronized
- Code expires every 30 seconds - use a fresh code
- QR code is one-time use - if you need to reset, re-login and get a new QR

### Database migration errors
- Drop database and recreate: 
  ```bash
  dropdb entitled_db
  createdb entitled_db
  alembic upgrade head
  python seed_data.py
  ```

### "Session expired" too quickly
- This is by design - sessions last exactly 3 minutes
- This is server-enforced for security

---

## ⚠️ Important Notes

1. **This is a LOCAL-ONLY application** - no deployment configuration included
2. **No password recovery** - use the seeded credentials
3. **JWT stored client-side** - acceptable for MVP, not production
4. **All security enforcement happens server-side** - frontend is untrusted
5. **3-minute privilege window is non-negotiable** - server-enforced
6. **MFA is mandatory** for all privileged access - no exceptions

---

## 📞 Support

This is a demonstration/MVP cybersecurity project. For production use, additional hardening would be required:
- Separate encryption keys per tenant
- Hardware security modules (HSM) for key management
- Database-level encryption
- Advanced threat detection
- Session recording
- Anomaly detection

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3000
- [ ] Can login as employee, admin, and auditor
- [ ] QR code displays for MFA setup
- [ ] Can scan QR with Microsoft Authenticator
- [ ] Employee can request access
- [ ] Admin can approve/reject requests
- [ ] MFA verification works
- [ ] Vault data displays decrypted
- [ ] Session expires after 3 minutes
- [ ] Auditor can view logs
- [ ] All actions appear in audit logs

---

**Built with security-first principles. Zero trust. Always verify.**
