# CCTV Face Detection System - Implementation Guide

## 🎯 Overview

Your system now includes an advanced CCTV face detection system with the following capabilities:

- **emp1** (Female, Risk: 95.42%): Female employee marked as CRITICAL RISK when NOT authorized
- **emp2** (Male, Risk: 86.32%): Male employee marked as CRITICAL RISK when NOT authorized
- **Conditional Logic**: Only ONE can be critical at a time based on authorized faces
- **Activity Tracking**: See what employees were doing when detected in CCTV
- **Risk Management**: Dynamic risk scoring updates based on face detection

---

## 📊 Dataset Details

### File Location
```
data/cctv_employee_data.csv (11.2 MB)
```

### Dataset Composition (1,001 employees)
- **emp1**: Sophia Anderson, Female, IT Security, Risk: 95.42%
- **emp2**: Marcus Reid, Male, Operations, Risk: 86.32%
- **10 High Risk Employees** (70-92% risk)
- **50 Medium Risk Employees** (40-69% risk)
- **939 Low Risk Employees** (10-39% risk)

### Key Attributes per Employee
```
- Basic Info: user_id, name, department, job_title, gender
- Risk Score: risk_score (10-100), risk_profile (critical/high/medium/low)
- CCTV Fields: cctv_face_id (emp1/emp2), cctv_anomalies
- File Operations: file_operations_detail (JSON with 40-80 operations)
- Database Activity: session_duration, query_count, read/write ops
- Email Activity: emails_sent, external_mails, attachments
- Network Activity: USB, HTTP requests, unique URLs
- Behavioral Score: personality traits (O, C, E, A, N)
```

---

## 🚀 Quick Start

### Step 1: Load CCTV Dataset
1. Click **Data Ingestion** tab
2. Click button: **🚀 Quick Load: CCTV Dataset (emp1/emp2)**
3. Wait for confirmation: ✅ "Loaded CCTV dataset: 1001 employees"

### Step 2: Configure Authorized Faces
1. Click **🔐 CCTV Faces** tab (new!)
2. You'll see two employee cards:
   - **emp1** (Female, Sophia Anderson) - Currently NOT authorized
   - **emp2** (Male, Marcus Reid) - Currently NOT authorized

### Step 3: Add Employee to Authorized Database
- Click **"Add to Authorized"** on the emp1 OR emp2 card
- This immediately updates the system:
  - If emp1 is authorized → emp2 becomes **CRITICAL RISK** (red badge, 🚨)
  - If emp2 is authorized → emp1 becomes **CRITICAL RISK** (red badge, 🚨)
  - If both authorized → Neither is critical (green badges)

### Step 4: Monitor CCTV Detections
1. Click **👁️ CCTV Detection** tab (new!)
2. You'll see:
   - **Red Alert Box**: Shows which employee is flagged as CRITICAL
   - **Simulation Button**: Click to see mock CCTV detection events
3. Click **"Simulate Detection"** to generate sample detections
4. Each detection shows:
   - Employee name and ID
   - Confidence score (92-100%)
   - Location in facility
   - **Activities they were doing**: Database queries, file downloads, USB transfers, etc.

### Step 5: View Risk Assessment
1. Click **Risk Assessment** tab
2. See updated risk scores reflecting:
   - emp1 and emp2 have distinct risk profiles
   - CRITICAL employee shows risk > 93%
   - Other employees show normal distribution

---

## 📁 Using Local Face Images

### Directory Structure
```
F:\main project\SPi-main\
  ├── real cctv/
  │   └── processed_output/
  │       └── employee_database/
  │           └── video_2/
  │               └── all_faces/
  │                   ├── emp1/
  │                   │   ├── face1.jpg
  │                   │   ├── face2.jpg
  │                   │   └── ...
  │                   └── emp2/
  │                       ├── face1.jpg
  │                       ├── face2.jpg
  │                       └── ...
```

### Adding Real Faces
1. Create folder: `real cctv/processed_output/employee_database/video_2/all_faces/emp1/`
2. Add female employee face images to `emp1/` folder
3. Create folder: `...all_faces/emp2/`
4. Add male employee face images to `emp2/` folder
5. In **CCTV Faces** tab, click buttons to load them

---

## 🔄 Conditional Logic Explained

### Scenario A: emp1 NOT authorized, emp2 NOT authorized
```
emp1 Status: ⚠️ Not Authorized
emp2 Status: ⚠️ Not Authorized
Critical Employee: BOTH could be critical (high risk)
```

### Scenario B: emp1 IS authorized, emp2 NOT authorized
```
emp1 Status: ✅ Authorized (GREEN)
emp2 Status: 🚨 CRITICAL RISK (RED) - Risk becomes primary concern
emp2 Risk Score: 95%+
emp2 Detection: Any CCTV sighting triggers alert
```

### Scenario C: emp1 NOT authorized, emp2 IS authorized
```
emp1 Status: 🚨 CRITICAL RISK (RED) - Risk becomes primary concern
emp1 Status: ✅ Authorized (GREEN)
emp1 Risk Score: 95%+
emp1 Detection: Any CCTV sighting triggers alert
```

### Scenario D: emp1 IS authorized, emp2 IS authorized
```
emp1 Status: ✅ Authorized (GREEN)
emp2 Status: ✅ Authorized (GREEN)
Critical Employee: NONE - All safe
```

---

## 📊 Risk Management Factors

### For emp1/emp2 Critical Risk
When flagged as CRITICAL RISK, the following factors are displayed:

```
Database Activity:
  - Session Duration: 450-600 minutes
  - Query Count: 500-2000
  - Read Operations: 300-1200
  - Write Operations: 150-500

File Operations Detail (JSON):
  - 40-80 operations tracked
  - Operations: open, copy, delete, download, upload, edit
  - Sensitive files: 20-40 accessed
  - Systems: Database, FileServer, SharePoint, ERP

Email Activity:
  - Emails Sent: 30-60
  - External Emails: 30-60 (HIGH)
  - Attachments: 20-40

Night Logins: 8-20 (HIGH)
USB Connections: 15-40 (VERY HIGH)
Unique Files: 20-50

Behavioral Indicators:
  - Behavioral Score: 80-90 (HIGH)
  - Neuroticism: 40-100 (suspicious)
  - Conscientiousness: 1-50 (low)
  - Agreeableness: 1-40 (low)
```

---

##  🎯 CCTV Detection Output

When simulating detection, you'll see:

```
Detection Alert:
├── Employee: [Name]
├── ID: emp1 or emp2
├── Risk Score: 95%
├── Confidence: 92-100%
├── Location: Server Room / Data Center / Executive Office
└── Activities at Detection Time:
    ├── Accessed sensitive database (FINANCE_DB)
    ├── Downloaded 45 files
    ├── Executed 812 database queries
    ├── Connected USB device (38GB)
    ├── Sent 18 emails (7 external)
    ├── Copied confidential documents
    ├── Modified system configuration
    └── Accessed security audit logs
```

---

## 🔧 Component Architecture

### New Components Created

1. **AuthorizedFaceDatabase.tsx**
   - Manages authorized employee face database
   - Shows emp1/emp2 cards with upload buttons
   - Implements conditional critical risk logic
   - Displays authorization status with color coding
   - Stores data in localStorage

2. **CCTVDetectionMonitor.tsx**
   - Shows real-time CCTV detections
   - Displays critical employee alerts
   - Shows detailed activity breakdown
   - Simulates face detection events
   - Shows confidence scores and locations

### Updated Components

1. **Dashboard.tsx**
   - Added 2 new tabs: "🔐 CCTV Faces" and "👁️ CCTV Detection"
   - New tabs unlock after data ingestion
   - Integrated new CCTV components

2. **DataInput.tsx**
   - Added "Quick Load: CCTV Dataset" button
   - Loads cctv_employee_data.csv directly
   - 1,001 employees with full attributes

3. **types.ts**
   - Added CCTV face detection interfaces:
     - `AuthorizedFace`: Managed authorized employees
     - `CCTVFaceDetection`: Detection events
     - `FaceDatabase`: Authorized faces collection
     - `UnauthorizedFaceAlert`: Alert structure
   - Extended `EmployeeRisk`:
     - `cctv_face_id`: emp1, emp2, etc.
     - `gender`: M, F
     - `is_authorized`: boolean for authorization status

---

## 📝 Key Features

### ✅ Implemented
- ✅ CCTV dataset with emp1 (F, critical) and emp2 (M, high)
- ✅ Conditional critical risk logic (only one critical at a time)
- ✅ Authorized face database management
- ✅ Face detection simulation with mock events
- ✅ Activity tracking (what employee was doing when detected)
- ✅ Risk score updates based on authorization
- ✅ Multi-factor analysis (behavioral + CCTV)
- ✅ Professional UI with color coding
- ✅ localStorage persistence for authorized faces
- ✅ Natural activity descriptions from file operations

### 🎨 UI Enhancements
- Red/Green status indicators for authorization
- Critical risk alert banner
- Activity timeline with operation details
- Confidence score visualization
- Department and gender information displayed
- Recommendation system for critical cases

---

## 📋 Testing Steps

1. **Load Dataset**
   - ✅ Click "Quick Load: CCTV Dataset"
   - ✅ Verify 1,001 employees loaded
   - ✅ Check emp1 (Sophia, 95.42%) and emp2 (Marcus, 86.32%) appear

2. **Test Conditional Logic**
   - ✅ Go to "CCTV Faces"
   - ✅ Click "Add to Authorized" on emp1
   - ✅ Verify emp1 shows Green ✅, emp2 shows Red 🚨
   - ✅ Remove emp1, add emp2
   - ✅ Verify emp2 shows Green ✅, emp1 shows Red 🚨

3. **Test Detection**
   - ✅ Go to "CCTV Detection"
   - ✅ See critical risk alert
   - ✅ Click "Simulate Detection" button
   - ✅ See mock detection events with activities

4. **Check Risk Assessment**
   - ✅ Go to "Risk Assessment"
   - ✅ Find emp1/emp2 in employee list
   - ✅ Verify risk scores reflect authorization status
   - ✅ View detailed activity timelines

---

## 🚨 Critical Risk Alerts

When an employee is flagged as CRITICAL, the system shows:

```
🚨 CRITICAL EMPLOYEE FLAGGED
[Name] is NOT authorized and poses CRITICAL RISK
Risk Score: 95%

Details:
├── ID: emp1 or emp2
├── Gender: M or F
├── Department: IT Security / Operations
└── Status: UNAUTHORIZED

⚠️ Recommendation:
Immediate action required. [Name] is an unauthorized critical risk
employee with detected CCTV presence. Alert security team immediately.
```

---

## 💾 Data Persistence

- **Authorized Faces**: Stored in `localStorage` under key `authorizedFaces`
- **Detection Status**: Dynamically calculated based on authorized list
- **Risk Scores**: Updated in real-time based on authorization status
- **Survives Page Reload**: All settings persist across sessions

---

## 🔐 Security Features

1. **Isolation**: emp1/emp2 are isolated test cases
2. **Conditional Logic**: Only one can be critical (prevents both being dismissed)
3. **Activity Detail**: Complete task logging when detected
4. **Confidence Scoring**: Face matching accuracy (92-100%)
5. **Audit Trail**: Detection history with timestamps
6. **Risk Recalculation**: Dynamic updates when auth status changes

---

## 📞 Support & Next Steps

### Potential Enhancements
- [ ] Real face detection (integrate with CompreFace or similar)
- [ ] Video frame analysis instead of simulation
- [ ] Email/SMS alerts for critical detections
- [ ] Advanced activity correlation
- [ ] Multi-camera tracking
- [ ] Timeline integration with security logs

### Files Generated
- `data/cctv_employee_data.csv` - 11.2 MB CCTV dataset
- `components/AuthorizedFaceDatabase.tsx` - Authorized face management
- `components/CCTVDetectionMonitor.tsx` - Detection monitoring
- `scripts/generate_cctv_dataset.py` - Dataset generator

---

## ✨ That's it!

Your CCTV face detection system is ready. Click **"Quick Load: CCTV Dataset"** to begin!
