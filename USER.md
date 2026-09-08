# Rudvay Tech Certificate Platform — Testing & Credentials Guide

This document contains all test credentials, sample data, and step-by-step testing instructions for evaluating the platform.

---

## 1. Test Login Accounts & Credentials

| Role | Email / Login ID | Password | Access / Permissions |
| :--- | :--- | :--- | :--- |
| **👑 ADMIN** | `admin@rudvaytech.com` | `RudvayAdmin@2026!` | Full platform access, coordinator management, global certificate revocation, SMTP configuration, and immutable audit logs. |
| **👨‍💼 COORDINATOR A** | `coordinator.alpha@rudvaytech.com` | `RudvayCoord@2026!` | Workshop creation, visual template designer, Excel upload, single/bulk certificate issuance, and job monitoring. |
| **👨‍💼 COORDINATOR B** | `coordinator.beta@rudvaytech.com` | `RudvayCoord@2026!` | Dedicated coordinator workspace with isolated private events, jobs, and templates. |
| **🌐 PUBLIC USER** | *(No Account / No Login)* | *(None)* | Public verification portal: verify certificates by entering ID or scanning QR code (`/verify`). |

> **Note**: For local development testing, you can sign in directly via `/login`. If using Firebase Auth locally without emulators, you can create these users in the Firebase Auth console or via the Admin Coordinator Management page.

---

## 2. Sample Certificate IDs for Verification Testing

You can use these sample certificate IDs on the **Public Verification Portal** (`/` or `/verify`):

| Certificate ID | Status | Recipient Name | Course / Program | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **`RT-2026-7K9P4X`** | `VALID` | Alice Smith | Advanced Python & Cloud Security | Official valid certificate with on-demand PDF download. |
| **`RT-2026-9A8B7C`** | `VALID` | Johnathan Doe | Enterprise DevSecOps Architecture | Full metadata and verification badge display. |
| **`RT-2026-REVOKED`** | `REVOKED` | Malicious / Incomplete Entry | Python Cybersecurity Workshop | Revoked certificate test case showing `✕ CERTIFICATE REVOKED`. |
| **`RT-2026-INVALID`** | `NOT_FOUND` | — | — | Non-existent ID test case showing `Certificate Not Verified`. |

### Public Verification URLs:
- `http://localhost:3000/verify/RT-2026-7K9P4X`
- `http://localhost:3000/verify/RT-2026-REVOKED`

---

## 3. Sample CSV / Excel Participant Dataset for Bulk Testing

Save the following table as a `.csv` or `.xlsx` file to test the **Bulk Certificate Generator** at `/coordinator/generate/bulk`:

```csv
Full Name,Email Address,Course Name,Completion Date,Duration
Alice Smith,alice.smith@example.com,Advanced Python Security,2026-09-08,24 Hours
Bob Johnson,bob.johnson@example.com,Cloud Architecture 101,2026-09-08,18 Hours
Charlie Davis,charlie.davis@example.com,Enterprise DevSecOps,2026-09-08,30 Hours
Diana Prince,diana.prince@example.com,Advanced Python Security,2026-09-08,24 Hours
Evan Wright,evan.wright@example.com,Full-Stack Engineering,2026-09-08,40 Hours
```

### Invalid Rows Test (To test Pre-flight Validation Report):
```csv
Full Name,Email Address,Course Name,Completion Date,Duration
Valid User,valid.user@example.com,Python Security,2026-09-08,20 Hours
,missing.name@example.com,Python Security,2026-09-08,20 Hours
Bad Email User,bad-email-format,Python Security,2026-09-08,20 Hours
Duplicate User,valid.user@example.com,Python Security,2026-09-08,20 Hours
```
*Expected result*: Valid: 1, Invalid: 3 (Missing name, Bad email syntax, Duplicate email in dataset).

---

## 4. Testing Walkthrough & Scenarios

### Scenario A: Public Verification Flow
1. Navigate to `http://localhost:3000/verify`.
2. Enter Certificate ID: `RT-2026-7K9P4X`.
3. Click **Verify ID**.
4. Verify that:
   - Green **"Certificate Verified Authentic"** badge is displayed.
   - Recipient Name, Course, Issue Date, and Issuing Authority ("Rudvay Tech") are shown.
   - Recipient email and internal IDs are **not leaked**.
   - Clicking **"Download Official PDF"** regenerates the certificate PDF on-the-fly.

### Scenario B: Single Certificate Issuance Flow
1. Navigate to `http://localhost:3000/login`.
2. Login with `coordinator.alpha@rudvaytech.com` / `RudvayCoord@2026!`.
3. Go to **Single Cert** (`/coordinator/generate/single`).
4. Fill in:
   - Recipient Name: `Alex Rivera`
   - Email: `alex.rivera@example.com`
   - Course: `Python Cybersecurity Workshop`
5. Click **Live In-Memory Preview** to inspect the rendered ReportLab canvas PDF in a new tab.
6. Click **Issue & Send Certificate**.
7. Click the generated **View Public Verification** link to confirm instant availability.

### Scenario C: Bulk Certificate Generation & Resumable Worker
1. Go to **Bulk Excel** (`/coordinator/generate/bulk`).
2. Select or create an Event (e.g. `Python Cybersecurity Workshop 2026`).
3. Upload the sample CSV file created in Section 3.
4. Confirm column mappings:
   - `Full Name` $\to$ `{{name}}`
   - `Email Address` $\to$ `{{email}}`
   - `Course Name` $\to$ `{{course}}`
   - `Completion Date` $\to$ `{{date}}`
5. Click **Validate Spreadsheet Data** and check the pre-flight summary.
6. Click **Generate Certificates**.
7. In the Job Monitor page (`/coordinator/jobs/[id]`), click **Process Next Batch** to stream through items and monitor the real-time progress bar.

### Scenario D: Administrator Certificate Revocation
1. Login as `admin@rudvaytech.com` / `RudvayAdmin@2026!`.
2. Navigate to **Admin Panel** (`/admin`).
3. In the **Revoke Certificate** card, enter:
   - Certificate ID: `RT-2026-7K9P4X`
   - Revocation Reason: `Disciplinary requirement violation`
4. Click **Confirm Revocation**.
5. Open `http://localhost:3000/verify/RT-2026-7K9P4X` in an incognito window.
6. Verify that it immediately displays **"Certificate Revoked"** with red status indicators and disables download options.

---

## 5. Local Services & Ports Reference

| Service | Address | Description |
| :--- | :--- | :--- |
| **Next.js Web Portal** | `http://localhost:3000` | Public, Admin & Coordinator UI. |
| **FastAPI Backend Functions** | `http://localhost:8000` | In-memory ReportLab PDF generator, QR engine, and API routes. |
| **Firebase Auth Emulator** | `http://localhost:9099` | Local authentication emulator (optional). |
| **Firebase Firestore Emulator** | `http://localhost:8080` | Local database emulator (optional). |
| **Firebase Emulator UI** | `http://localhost:4000` | Visual Firestore and Auth browser. |
