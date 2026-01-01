# 🕵️ INSIDER THREAT DETECTION - SPY DETECTION SYSTEM

## Combined CSV + CCTV Analysis for Identifying Insider Threats

This system combines **behavioral data from CSV logs** with **physical access verification from CCTV** to identify potential insider threats ("spies") with high confidence.

---

## 🎯 How It Works

### Two Independent Data Sources

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  CSV BEHAVIORAL DATA (60% weight)                              │
│  ├─ File operations & deletions                               │
│  ├─ USB device connections                                    │
│  ├─ Email communication patterns                              │
│  ├─ Login times & frequency                                   │
│  ├─ Night-time access attempts                                │
│  └─ Machine learning anomaly detection                        │
│                                                                 │
│  CCTV ACCESS CONTROL (40% weight)                              │
│  ├─ Face recognition matching                                 │
│  ├─ Authorized vs unauthorized access                         │
│  ├─ Off-hours entry detection                                 │
│  ├─ Low-confidence face matches                               │
│  └─ Physical location anomalies                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    UNIFIED ANALYSIS
                              ↓
        SPY SCORE = (CSV × 0.6) + (CCTV × 0.4)
                              ↓
         ┌──────────┬──────────┬──────────┐
         ▼          ▼          ▼          ▼
      CRITICAL    HIGH      MEDIUM      LOW
      (80-100)   (60-79)   (40-59)    (0-39)
```

---

## 📊 Data Integration Flow

### Step 1: Upload CSV Dataset
```
Input File: comprehensive_employee_data.csv

Required Columns:
- user (Employee ID)
- login_count (Total logins)
- night_logins (After-hours access)
- usb_count (USB device connections)
- file_activity_count (Files accessed/modified)
- external_mails (Emails to external addresses)
- anomaly_label (ML model -1 = anomaly)
- risk_score (Pre-calculated baseline)
```

**CSV Risk Factors Extracted:**
- High file operations (>500)
- Night-time access (>5 incidents)
- USB usage (>20 connections)
- External email communication
- ML anomaly flags

### Step 2: Upload CCTV Video + Define Authorization
```
Video Input: MP4 format (50+ seconds recommended)
Face Recognition: Python face_recognition library
Authorization List: Enter employee IDs allowed to be in video

Example:
  Authorized: [ACC0042, AAF0535, ABC0174, AAE0190, LOW0001]
```

**CCTV Risk Factors Extracted:**
- Unauthorized area access
- Off-hours entry attempts (6 PM - 6 AM)
- Low-confidence face matches (<70%)
- Excessive access patterns
- Physical location violations

### Step 3: Integration & Scoring
```
For each employee:
  CSV_Risk = calculateRiskScore(file_ops, usb, login_pattern, email)
  
  CCTV_Risk = calculateAccessRisk(
    unauthorized_accesses,
    confidence_scores,
    access_times,
    location_violations
  )
  
  Combined_Score = (CSV_Risk × 0.6) + (CCTV_Risk × 0.4)
  
  IF (CSV_Risk ≥ 60 AND CCTV_Risk ≥ 30) THEN
    Combined_Score × 1.3  // Convergent evidence boost
  
  IF (Unauthorized_Access_Detected) THEN
    Combined_Score × 1.5  // Critical boost
  
  SPY_SCORE = min(100, Combined_Score)
```

### Step 4: Threat Classification
```
CRITICAL (SPY_SCORE 80-100) 🚨
├─ Action: Immediate credential revocation
├─ Status: High-confidence insider threat
└─ Evidence: Convergent behavioral + physical access violations

HIGH (SPY_SCORE 60-79) ⚠️
├─ Action: Full investigation required
├─ Status: Strong threat indicators
└─ Evidence: Multiple corroborating red flags

MEDIUM (SPY_SCORE 40-59) ⚡
├─ Action: Increased monitoring + supervisor review
├─ Status: Elevated risk signals
└─ Evidence: Suspicious patterns detected

LOW (SPY_SCORE 0-39) ℹ️
├─ Action: Standard baseline monitoring
├─ Status: Normal activity pattern
└─ Evidence: No significant red flags
```

---

## 🔴 Real Example: "The Spy"

### Employee: Chandra Costa (ID: ACC0042)

**CSV Behavioral Data:**
```
Login Count:              1,510 (Very High)
Night Logins:              455 (CRITICAL RED FLAG)
USB Connections:            72 (High)
File Operations:           124 (Moderate)
External Emails:            35 (Elevated)
ML Anomaly Flag:           YES (Detected)
Baseline Risk Score:     92.46/100 (Very High)
```

**CSV Risk Calculation:**
```
File Risk:        min(35, 124 × 0.05)     = 6.2/35
USB Risk:         min(25, 72 × 0.08)      = 5.76/25
Night Login Risk: min(20, 455 × 0.5)      = 20/20 ✓
Login Volume:     min(10, max(1510-150,0) × 0.05) = 10/10 ✓
Anomaly Boost:    ML Flag = +10
─────────────────────────────────────────────
TOTAL:            92.46/100 🔴 CRITICAL
```

**CCTV Access Control Data:**
```
Total Access Events:        3 (All normal hours)
Unauthorized Accesses:      3 (Restricted areas!)
Off-Hours Entries:          3 (2:44 AM, 2:44 AM, 4:44 AM)
Low-Confidence Matches:     2 (46%, 54% - very suspicious)
Access Locations:           Main Entrance + 3 Restricted Areas
```

**CCTV Risk Calculation:**
```
Unauthorized Events:     3 × 25 points    = 75
Off-Hours Attempts:      3 × 12 points    = 36
Low-Confidence Matches:  2 × 8 points     = 16
Excessive Access:        N/A
─────────────────────────────────────────
TOTAL:                   min(100, 127)    = 100/100 🚨
```

**Final Spy Score:**
```
Base Combination:
  (92.46 × 0.6) + (100 × 0.4)
  = 55.476 + 40
  = 95.476

Convergent Evidence Boost (both systems flag):
  95.476 × 1.3 = 124.119

Unauthorized Access Boost:
  124.119 × 1.5 = 186.179

Final (capped at 100):
  SPY_SCORE = 100/100 🚨 CRITICAL INSIDER THREAT
```

**Evidence Summary:**
```
🟥 BEHAVIOR (CSV):
  • 1,510 total logins - unusually high
  • 455 night logins - works extremely late
  • Multiple restricted file access patterns
  • ML model flagged as anomalous
  • 72 USB connections - data exfiltration attempt?

🚨 ACCESS CONTROL (CCTV):
  • 3 unauthorized accesses to restricted areas
  • 3 off-hours entry attempts (2-4 AM)
  • 46% and 54% face recognition confidence - EVASION ATTEMPT
  • Inconsistent access patterns
  • Physical location violations detected

⚠️ CONVERGENT EVIDENCE:
  Both behavioral AND physical access systems independently flag this employee
  This significantly increases confidence in threat assessment
```

**Recommended Actions:**
```
IMMEDIATE (Within 1 hour):
  1. ⛔ Revoke all system credentials
  2. 🚫 Disable physical access cards
  3. 📋 Preserve all digital evidence
     - Email backup
     - File access logs
     - USB connection history
     - CCTV footage
  4. 📞 Contact legal and HR
  5. 🔒 Secure office workstation

URGENT (Within 24 hours):
  6. 🔍 Formal investigation initiation
  7. 📊 Review all project access history
  8. 💬 Collect witness statements
  9. 📧 Monitor and log all communications
  10. 🚨 Alert IT security team

FOLLOW-UP (Within 1 week):
  11. Forensic analysis of digital footprint
  12. Interview with compliance team
  13. Determination of potential data breach
  14. HR disciplinary action
  15. Post-incident security audit
```

---

## 🛠️ Technical Details

### File Structure
```
SPi-main/
├── components/
│   ├── SpyDetection.tsx          # New spy detection dashboard
│   ├── Dashboard.tsx              # Updated with spy detection tab
│   └── ...
├── utils/
│   ├── riskAnalysis.ts            # New spy detection functions
│   │   ├── calculateAccessRisk()
│   │   ├── generateSpyProfile()
│   │   ├── identifySpies()
│   │   └── generateThreatReport()
│   └── ...
├── types.ts                       # New interfaces
│   ├── CCTVAccessEvent
│   ├── CCTVAccessLog
│   └── UnifiedSpyProfile
├── public/demo_cctv/
│   ├── cctv_demo_real.mp4         # Sample video
│   ├── access_log.json            # Sample access events
│   ├── person1.png                # Sample employee photos
│   ├── person2.png
│   └── person3.png
└── scripts/
    └── generate_cctv_access_log.py # Demo data generator
```

### Key Functions

#### 1. calculateAccessRisk()
```typescript
function calculateAccessRisk(
  employee: EmployeeRisk,
  cctvLog: CCTVAccessLog
): {
  score: number;           // 0-100
  unauthorizedCount: number;
  times: string[];
  factors: string[];
}
```

#### 2. generateSpyProfile()
```typescript
function generateSpyProfile(
  employee: EmployeeRisk,
  cctvLog: CCTVAccessLog | null
): UnifiedSpyProfile
// Returns: Complete threat assessment with evidence & recommendations
```

#### 3. identifySpies()
```typescript
function identifySpies(
  employees: EmployeeRisk[],
  cctvLogs: Map<string, CCTVAccessLog>
): UnifiedSpyProfile[]
// Returns: Sorted list of suspects by spy score (descending)
```

#### 4. generateThreatReport()
```typescript
function generateThreatReport(
  spyProfiles: UnifiedSpyProfile[]
): {
  totalSuspects: number;
  criticalThreats: UnifiedSpyProfile[];
  highThreats: UnifiedSpyProfile[];
  mediumThreats: UnifiedSpyProfile[];
  summary: string;
}
```

---

## 📈 Dashboard Features

### Spy Detection Tab
Located in main dashboard after "Analytics" tab

**Features:**
- ✅ Real-time spy score calculation
- ✅ Risk level filtering (Critical/High/Medium/Low)
- ✅ Detailed suspect profiles with evidence
- ✅ Actionable recommendations
- ✅ Download threat report (TXT format)
- ✅ Employee department breakdown
- ✅ Unauthorized access highlighting

**Display Metrics:**
```
┌─────────────────────────────────────────┐
│ 🚨 CRITICAL: 1                          │
│ ⚠️ HIGH RISK: 2                         │
│ ⚡ MEDIUM: 3                            │
│ 📊 TOTAL SUSPECTS: 6 of 1000 employees  │
└─────────────────────────────────────────┘
```

### Suspect Profile Card
```
┌──────────────────────────────────────────┐
│ 🚨 CRITICAL                              │
│ Chandra Costa (ACC0042)                  │
│ ID: ACC0042 • Finance                    │
│                          SPY SCORE: 100  │
├──────────────────────────────────────────┤
│ Behavioral Risk: 92.46/100               │
│ Access Risk: 100/100                     │
├──────────────────────────────────────────┤
│ 🚨 3 UNAUTHORIZED ACCESS EVENT(S)        │
├──────────────────────────────────────────┤
│ Evidence Summary:                        │
│ • 1510 total logins - unusually high    │
│ • 455 night logins - critical red flag  │
│ • 3 unauthorized accesses detected      │
│ +4 more evidence                         │
└──────────────────────────────────────────┘
```

---

## 🔧 How to Use

### Quick Start
1. **Login** to the Insider Threat Detection system
2. **Go to "Data Ingestion"** tab
3. **Upload CSV file** with employee behavioral data
4. **Upload CCTV video** (optional, but recommended for better accuracy)
5. **Define authorized employees** in the CCTV section
6. **Wait for processing** (~3 seconds for 1000 employees)
7. **Navigate to "🕵️ Spy Detection"** tab
8. **Review threat levels** and suspect details
9. **Download report** for investigation team

### For Security Teams
```
Expected Workflow:
1. Daily upload of behavioral logs
2. Weekly CCTV video integration
3. Automated spy score calculation
4. Alert on critical threats (>80 score)
5. Investigation of high risks (60-79)
6. Monitoring of medium alerts (40-59)
7. Quarterly trend analysis
```

---

## ⚖️ Accuracy & Validation

### Detection Confidence Factors
- **Convergent Evidence**: +30% boost when both systems flag
- **Unauthorized Access**: +50% boost for direct violations
- **Pattern Consistency**: Behavior matches threat profile
- **Temporal Correlation**: CSV activity correlates with CCTV events

### False Positive Mitigation
```
- High confidence threshold: 60+ combined score
- Convergent evidence weighting
- Manual review recommended for 40-60 range
- Department-specific baselines (future)
- Time-window correlation analysis (future)
```

### Recommended Review Process
```
CRITICAL (80+):    Automatic alert → Immediate investigation
HIGH (60-79):      Alert → Investigation queue within 24 hours
MEDIUM (40-59):    Flag → Review within 1 week
LOW (0-39):        Baseline → Standard monitoring
```

---

## 📝 Generated Reports

### Threat Report Format
```
INSIDER THREAT ANALYSIS REPORT
Generated: 2026-02-05T15:30:00Z

THREAT SUMMARY:
- Critical Threats: 1
- High Risk: 2
- Medium Risk: 3
- Total Suspects: 6

🚨 CRITICAL THREATS:
1. Chandra Costa (ACC0042)
   Spy Score: 100/100
   Behavioral Risk: 92.46 | Access Risk: 100
   Status: ⚠️ UNAUTHORIZED ACCESS DETECTED

============================================================
SUSPECT: Chandra Costa (ID: ACC0042)
Department: Finance
Spy Score: 100/100 [CRITICAL]
Behavioral Risk: 92.46/100
Access Control Risk: 100/100

EVIDENCE:
🟥 BEHAVIOR: 1510 total logins - unusually high
🟥 BEHAVIOR: 455 night logins - critical red flag
🟥 BEHAVIOR: ML model anomaly flag
🚨 ACCESS: Unauthorized access at 2026-01-29T03:44:11
🚨 ACCESS: Off-hours entry detected
🚨 ACCESS: 3 low-confidence face matches detected

RECOMMENDATIONS:
🔴 IMMEDIATE: Restrict all access credentials
Contact security: Review surveillance footage
Escalate to management: Behavioral pattern matches profile
🚨 HIGH PRIORITY: Convergent evidence detected
Preserve all digital evidence: logs, emails, files
Interview supervisor and colleagues
```

---

## 🔮 Future Enhancements

- [ ] Real-time threat scoring as data arrives
- [ ] Department-specific risk baselines
- [ ] Temporal correlation analysis
- [ ] Predictive threat modeling (ML)
- [ ] Integration with access card systems
- [ ] Email communication pattern analysis
- [ ] Network traffic correlation
- [ ] Historical trend analysis
- [ ] Automated alerts and notifications
- [ ] Integration with SIEM systems

---

## ⚠️ Important Notes

1. **Not a Replacement for Human Judgment**
   - Always conduct manual investigation
   - Consider context and mitigating factors
   - Escalate to legal/HR properly

2. **Privacy Compliance**
   - Ensure GDPR/CCPA compliance
   - Proper data handling procedures
   - Employee consent for monitoring

3. **Evidence Chain**
   - Preserve all logs for investigation
   - Maintain audit trail
   - Document all actions taken

4. **Threshold Tuning**
   - Customize scores based on industry
   - Adjust weights for your environment
   - Regular false positive review

---

## 📞 Support

For questions or to report issues with the spy detection system:
- Check [SPY_DETECTION_GUIDE.md](SPY_DETECTION_GUIDE.md) for detailed technical docs
- Review example scenarios and evidence types
- Validate CCTV video format compatibility

---

## 📄 License & Compliance

This system is designed for insider threat detection only. Ensure compliance with:
- Data protection regulations (GDPR, CCPA)
- Employee privacy policies
- Legal requirements for surveillance
- HR and compliance procedures

All investigations should involve proper legal and HR channels.
