# 🔄 Workflow: Behavioral Risk + CCTV Face Recognition

## Complete End-to-End Process

```
┌─────────────────────────────────────────────────────────────────┐
│                    SPi COMPLETE WORKFLOW                        │
└─────────────────────────────────────────────────────────────────┘

PHASE 1: DATA PREPARATION
═════════════════════════════════════════════════════════════════

  Step 1.1: Upload Behavioral Data
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Go to "Data Ingestion" tab                            │
  │ 2. Upload CSV file with employee behavioral metrics      │
  │ 3. Columns should include:                               │
  │    - user_id / user                                      │
  │    - employee_name                                       │
  │    - department                                          │
  │    - login_count, night_logins                           │
  │    - file_activity_count, usb_count                      │
  │    - external_mails                                      │
  │    - O, C, E, A, N (personality traits)                  │
  │    - risk_score (from model)                             │
  │ 4. System calculates comprehensive risk scores           │
  └──────────────────────────────────────────────────────────┘

  Output: Risk Assessment Dashboard
  ├─ Total Employees: XXXX
  ├─ High Risk: YYY (≥60)
  ├─ Medium Risk: ZZZ (30-59)
  └─ Low Risk: WWW (<30)


PHASE 2: AUTHORIZED EMPLOYEE SETUP
═════════════════════════════════════════════════════════════════

  Step 2.1: Upload Employee Images
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Go to "Employee Images" tab                           │
  │ 2. Extract employee IDs from CSV                         │
  │ 3. For AUTHORIZED employees:                             │
  │    a. Enter IDs: EMP001, EMP002, EMP003, ...             │
  │    b. Upload 3-5 images per employee (different angles)  │
  │    c. Images should be:                                  │
  │       - Clear, well-lit photos                           │
  │       - Front-facing and profile angles                  │
  │       - JPG/PNG format, < 5MB each                       │
  │ 4. (Optional) Add UNAUTHORIZED employees:                │
  │    a. Enter IDs: UNAUTH001, UNAUTH002, ...               │
  │    b. Upload photos of known threats                     │
  │ 5. Click "Save Employee Image Configuration"             │
  └──────────────────────────────────────────────────────────┘

  Example File Structure:
  ├─ EMP001_front.jpg    (authorized)
  ├─ EMP001_left.jpg
  ├─ EMP001_right.jpg
  ├─ EMP002_front.jpg
  ├─ UNAUTH001.jpg       (unauthorized - optional)
  └─ ...


PHASE 3: RISK ASSESSMENT & REPORTING
═════════════════════════════════════════════════════════════════

  Step 3.1: View Risk Dashboard
  ┌──────────────────────────────────────────────────────────┐
  │ Risk Assessment Tab shows:                               │
  │ • KPI Cards: Total, High, Medium, Low risk counts        │
  │ • Distribution charts (pie chart)                        │
  │ • 7-day trend analysis                                   │
  │ • Department-wise risk breakdown                         │
  │ • Employee detail table (sortable, searchable)           │
  └──────────────────────────────────────────────────────────┘

  Step 3.2: Export Risk Reports
  ┌──────────────────────────────────────────────────────────┐
  │ Export Options Available:                                │
  │ • "All Employees" - Complete dataset                     │
  │ • "High Risk" - Scores ≥ 60                              │
  │ • "Medium Risk" - Scores 30-59                           │
  │ • "Low Risk" - Scores < 30                               │
  │ • Individual Employee (via download icon in table)       │
  │                                                          │
  │ Each report contains:                                    │
  │ ├─ Employee profile (name, ID, department, title)        │
  │ ├─ Risk assessment (overall score, level, components)    │
  │ ├─ Activity metrics (logins, files, USB, emails)         │
  │ └─ Personality traits (OCEAN model)                      │
  └──────────────────────────────────────────────────────────┘

  Report Format:
  =================================================================
              SPi - INSIDER THREAT DETECTION SYSTEM
           HIGH RISK EMPLOYEES REPORT
  =================================================================
  Generated: [timestamp]
  
  1. EMPLOYEE PROFILE
  -----------------------------------------------------------------
  Employee ID:       EMP001
  Name:              John Doe
  Department:        IT
  Job Title:         Senior Developer
  
  RISK ASSESSMENT:
    Overall Risk Score:     78.5 / 100
    Risk Level:             HIGH
    File Activity Risk:     32.5
    USB Activity Risk:      22.0
    Login Pattern Risk:     18.3
    Email Activity Risk:    12.1
    Behavioral Risk:        65.2
  
  ACTIVITY METRICS:
    Login Count:       245
    Night Logins:      28
    File Operations:   1,234
    USB Connections:   15
    External Emails:   456
  
  PERSONALITY TRAITS (OCEAN):
    Openness:          72.5
    Conscientiousness: 38.2
    Extraversion:      55.1
    Agreeableness:     42.3
    Neuroticism:       68.9
  =================================================================


PHASE 4: CCTV VIDEO ANALYSIS
═════════════════════════════════════════════════════════════════

  Step 4.1: Prepare CCTV Footage
  ┌──────────────────────────────────────────────────────────┐
  │ Video Requirements:                                      │
  │ • Format: MP4, MOV, AVI (OpenCV compatible)              │
  │ • Duration: Recommended < 5 minutes (for speed)          │
  │ • Resolution: HD or higher for better face detection     │
  │ • FPS: 24+ (standard video frame rate)                   │
  │                                                          │
  │ Recording Tips:                                          │
  │ • Use high-quality cameras                               │
  │ • Ensure good lighting (no motion blur)                  │
  │ • Position cameras to capture faces clearly              │
  │ • Include multiple angles if possible                    │
  └──────────────────────────────────────────────────────────┘

  Step 4.2: Process Video with Face Recognition
  ┌──────────────────────────────────────────────────────────┐
  │ 1. Go to "CCTV Analysis" tab                             │
  │ 2. Select video file to upload                           │
  │ 3. Toggle "Restricted Zone" if applicable:               │
  │    ✓ Restricted Zone = sensitive area (extra scrutiny)   │
  │    ✗ Normal Area = regular monitoring                    │
  │ 4. Click "Process Video"                                 │
  │ 5. System performs:                                      │
  │    a. Face detection (samples ~1 frame/second)           │
  │    b. Face recognition (matches against employee DB)    │
  │    c. Risk correlation (combines with risk scores)       │
  │ 6. Processing status shows real-time progress            │
  └──────────────────────────────────────────────────────────┘

  Process Timeline:
  ├─ 🔄 Processing video and detecting faces... (2 sec)
  ├─ 🔄 Analyzing facial features... (2 sec)
  ├─ 🔄 Matching faces with employee database... (1.5 sec)
  ├─ 🔄 Combining with risk assessment data... (1 sec)
  └─ ✅ Video processing complete!


PHASE 5: CRITICAL THREAT IDENTIFICATION
═════════════════════════════════════════════════════════════════

  Step 5.1: Identify High-Risk Detections
  ┌──────────────────────────────────────────────────────────┐
  │ CRITICAL THREATS Section shows:                          │
  │ ═══════════════════════════════════════════════════════  │
  │ ⚠️ CRITICAL THREATS DETECTED: 2                           │
  │                                                          │
  │ 1. UNAUTHORIZED PERSONNEL                                │
  │    Employee ID:    UNKNOWN_001                            │
  │    Status:         UNAUTHORIZED                           │
  │    Detections:     5 frames detected                      │
  │    Time Range:     00:03:20 - 00:04:15                    │
  │    ➜ ACTION: Security investigation                       │
  │                                                          │
  │ 2. HIGH RISK AUTHORIZED                                  │
  │    Employee ID:    EMP001                                │
  │    Name:           John Doe                              │
  │    Status:         AUTHORIZED                             │
  │    Risk Score:     78.5 (HIGH)                            │
  │    Department:     IT                                    │
  │    Detections:     12 frames detected                     │
  │    Time Range:     00:00:15 - 00:08:42                    │
  │    ➜ ACTION: Behavioral investigation                     │
  └──────────────────────────────────────────────────────────┘

  Threat Scoring Logic:
  ┌─────────────────────────────────────────────────────────┐
  │ Priority 1 (Highest): UNAUTHORIZED + HIGH RISK          │
  │ Priority 2: UNAUTHORIZED (unknown person)               │
  │ Priority 3: AUTHORIZED + HIGH RISK (behavioral)         │
  │ Priority 4: AUTHORIZED + MEDIUM RISK                    │
  │ Priority 5 (Lowest): AUTHORIZED + LOW RISK              │
  └─────────────────────────────────────────────────────────┘


PHASE 6: RESULTS & REPORTING
═════════════════════════════════════════════════════════════════

  Step 6.1: View Detection Dashboard
  ┌──────────────────────────────────────────────────────────┐
  │ Summary Statistics:                                      │
  │ ├─ Total Persons Detected: 5                             │
  │ ├─ Authorized: 3 ✓                                       │
  │ ├─ Unauthorized: 1 ✗                                     │
  │ ├─ Unknown: 1 ?                                          │
  │ └─ High Risk: 2 ⚠️                                        │
  │                                                          │
  │ Detailed Results Table:                                  │
  │ ┌────┬──────────┬────────────┬──────────┬──────────┐    │
  │ │EID │  Name    │  Status    │Confidence│Risk Lvl  │    │
  │ ├────┼──────────┼────────────┼──────────┼──────────┤    │
  │ │EMP1│John Doe  │AUTHORIZED  │ 95.2%    │HIGH (78) │    │
  │ │EMP2│Jane Smit │AUTHORIZED  │ 89.7%    │MEDIUM(42)│   │
  │ │????│Unknown   │UNKNOWN     │ 67.3%    │N/A       │    │
  │ └────┴──────────┴────────────┴──────────┴──────────┘    │
  └──────────────────────────────────────────────────────────┘

  Step 6.2: Export Results
  ┌──────────────────────────────────────────────────────────┐
  │ Export CSV Report:                                       │
  │ • Filename: cctv-analysis-2026-02-13.csv                 │
  │ • Contains all detections with metadata                  │
  │ • Columns: Employee ID, Name, Status, Confidence,        │
  │            Risk Score, Risk Level, Department,           │
  │            Detection Count, Time Range                   │
  │ • Format: Standard CSV for Excel/analysis tools          │
  └──────────────────────────────────────────────────────────┘

  CSV Output Format:
  Employee ID,Name,Status,Confidence,Risk Score,Risk Level,Department,Detection Count,First Seen,Last Seen
  EMP001,John Doe,authorized,0.95,78.5,HIGH,IT,12,00:00:15,00:08:42
  EMP002,Jane Smith,authorized,0.897,42.3,MEDIUM,HR,8,00:01:20,00:07:55
  UNKNOWN_001,Unknown Person,unknown,0.673,N/A,N/A,N/A,3,00:03:20,00:04:15


PHASE 7: INCIDENT RESPONSE
═════════════════════════════════════════════════════════════════

  Response Actions (Recommended):

  FOR UNAUTHORIZED PERSONNEL:
  ├─ 🚨 IMMEDIATE: Alert security
  ├─ 📷 CAPTURE: Save video segment with timestamp
  ├─ 🔍 INVESTIGATE: Check entry/exit logs, ID verification
  ├─ 📝 DOCUMENT: Create incident report
  └─ 🔐 SECURE: Update access control lists

  FOR HIGH RISK AUTHORIZED EMPLOYEES:
  ├─ ⚠️ MONITOR: Increase surveillance attention
  ├─ 📊 CORRELATE: Check corresponding activity logs
  ├─ 🗣️ INTERVIEW: Conduct behavioral interview if necessary
  ├─ 📝 DOCUMENT: Update employee risk profile
  └─ 📋 REVIEW: Escalate if risk increases

  FOR UNKNOWN PERSONS:
  ├─ 🔍 IDENTIFY: Cross-reference with employee DB
  ├─ 👥 INTERVIEW: Check with building access logs
  ├─ 📸 ESCALATE: If identity cannot be established
  └─ 🚫 RESTRICT: Deny access until verified


═════════════════════════════════════════════════════════════════
RISK SCORE CALCULATION REFERENCE
═════════════════════════════════════════════════════════════════

BEHAVIORAL RISK (from CSV data):
────────────────────────────────
Formula: Risk Score = 
  (Model Risk × 0.25) +
  (File Risk) +
  (USB Risk) +
  (Night Login Risk) +
  (Login Volume Risk) +
  (Anomaly Boost)

Component Calculations:
• File Activity Risk = min(35, file_count × 0.05)
• USB Activity Risk = min(25, usb_count × 0.08)
• Night Login Risk = min(20, night_logins × 0.5)
• Login Volume Risk = min(10, (login_count - 150) × 0.05)
• Anomaly Boost = +10 if flagged by ML model, else 0

Total Range: 0-100
Thresholds:
  HIGH:   ≥ 60
  MEDIUM: 30-59
  LOW:    < 30

Example Calculation:
  Model Risk: 75
  File Risk: 25 (500 files × 0.05)
  USB Risk: 15 (200 connections × 0.08)
  Night Login Risk: 10 (20 night logins × 0.5)
  Login Volume Risk: 5 ((250-150) × 0.05)
  Anomaly Boost: 10
  
  Total = (75 × 0.25) + 25 + 15 + 10 + 5 + 10 = 78.75 (HIGH)


CCTV ACCESS RISK (from video analysis):
────────────────────────────────────────
Formula: CCTV Risk = 
  (Unauthorized attempts × 10) +
  (Restricted area access × 8) +
  (Off-hours access × 6)
Cap: 100

Thresholds:
  CRITICAL: > 80
  HIGH:     60-80
  MEDIUM:   30-59
  LOW:      < 30


COMBINED RISK (Behavioral + CCTV):
──────────────────────────────────
Formula: Final Risk = 
  (Behavioral Risk × 0.60) +
  (CCTV Risk × 0.40)

Priority: Behavioral (60%) > CCTV (40%)
This prioritizes long-term patterns over isolated incidents

Example:
  Behavioral Risk: 78.5 (HIGH)
  CCTV Risk: 65.0 (HIGH)
  Combined = (78.5 × 0.6) + (65.0 × 0.4) = 47.1 + 26.0 = 73.1 (HIGH)

═════════════════════════════════════════════════════════════════
```

## 🎯 Key Decision Points

### When to Use Restricted Zone Mode:
✅ **Enable** for:
- Server rooms
- Executive offices
- Secure document storage
- High-security areas
- Finance/sensitive departments

❌ **Disable** for:
- Office corridors
- Break rooms
- Conference rooms
- General work areas

### Export Strategy:
1. **Daily**: Export High Risk employees for senior review
2. **Weekly**: Full report for compliance/audit
3. **Per Incident**: Individual employee report for investigation
4. **Per Video**: Export CCTV results immediately after analysis

### Follow-up Actions:
1. Critical threats → Immediate investigation
2. High risk with CCTV correlation → Within 24 hours
3. Medium risk → Within 1 week
4. Low risk → Routine monitoring

---

**This comprehensive workflow ensures:**
- ✅ Complete behavioral profiling
- ✅ Face-based physical verification
- ✅ Risk correlation (behavioral + access)
- ✅ Thorough documentation
- ✅ Data-driven incident response
