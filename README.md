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

## 🏗️ Flow Diagram

![Architecture Diagram](Role_Flow.png)

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

