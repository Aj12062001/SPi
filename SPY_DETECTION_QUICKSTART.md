# 🕵️ SPY DETECTION - QUICK START GUIDE

## System is Ready! Here's How to Access & Use

---

## ✅ What's New

Your Insider Threat Detection system now has a **complete spy detection feature** that combines:

1. **CSV Behavioral Data** - Employee activity logs
2. **CCTV Access Control** - Face recognition + physical access
3. **Unified Threat Assessment** - Combined spy score (0-100)

---

## 🚀 Accessing the System

### 1. Start the Application
```bash
npm run dev
# Server starts at: http://localhost:3002
```

### 2. Login
```
Any username (demo system)
System automatically opens to Overview tab
```

### 3. Navigate to Spy Detection
```
Data Ingestion Tab
├─ Upload CSV file (employee data)
├─ Upload CCTV video (optional)
└─ Click "Analyze & Scan"
         ↓
Risk Assessment Tab
└─ View initial risk scores
         ↓
🕵️ SPY DETECTION TAB ← NEW!
└─ See combined threat analysis
```

---

## 📊 Demo Data

### Pre-built Example
The system includes sample data:

**CSV File**: `data/comprehensive_employee_data_1000.csv`
- 1000 employees with behavioral data
- Pre-calculated risk scores
- Anomaly labels from ML model

**CCTV Access Log**: `public/demo_cctv/access_log.json`
- 19 access events
- 7 unauthorized accesses
- 1 critical threat identified

**CCTV Video**: `public/demo_cctv/cctv_demo_real.mp4`
- 50-second sample footage
- Three "employees" entering at different times
- Ready for face recognition analysis

### Try This Right Now:

1. **Upload the CSV**:
   - Go to "Data Ingestion"
   - Select: `data/comprehensive_employee_data_1000.csv`
   - Click "Start Scan"

2. **Skip CCTV** (optional):
   - Can test with CSV data alone
   - CCTV adds access control dimension

3. **View Results**:
   - Go to "Risk Assessment" tab
   - See all employees with risk scores

4. **See Spy Detection**:
   - Go to "🕵️ Spy Detection" tab
   - **See identified suspects!**

---

## 🎯 Key Features

### Spy Detection Dashboard
```
┌─────────────────────────────────────────┐
│ Insider Threat Detection System         │
│ Combined CSV behavioral + CCTV analysis │
├─────────────────────────────────────────┤
│ 🚨 CRITICAL: 1                          │
│ ⚠️  HIGH RISK: 2                        │
│ ⚡ MEDIUM: 3                            │
│ 📊 TOTAL SUSPECTS: 6 of 1000            │
├─────────────────────────────────────────┤
│ [ALL] [CRITICAL] [HIGH] [MEDIUM]        │
│ [Download Report]                       │
└─────────────────────────────────────────┘

SUSPECT CARDS:
┌──────────────────────────────┐
│ 🚨 CRITICAL                  │
│ Chandra Costa (ACC0042)       │
│ Finance Dept                  │
│                  SPY: 100/100 │
├──────────────────────────────┤
│ Behavioral: 92.46 | Access: 100│
│ 🚨 3 UNAUTHORIZED ACCESSES    │
│ Evidence: Excessive logins... │
│ +4 more red flags             │
└──────────────────────────────┘
```

### Detailed Suspect View
Click any suspect card to see:
- All evidence & red flags
- Detailed behavioral risk factors
- CCTV access violations
- Specific timestamps
- Actionable recommendations

### Export Report
```bash
# Click "Download Report" button
# Generates: spy-detection-report-YYYY-MM-DD.txt

Content includes:
- Threat summary
- All suspects with scores
- Evidence listing
- Recommended actions
```

---

## 📈 Understanding the Spy Score

### Formula
```
SPY_SCORE = (Behavioral_Risk × 0.6) + (Access_Risk × 0.4)

Modifiers:
- Both systems flag → ×1.3 multiplier
- Unauthorized access → ×1.5 multiplier
- Final score capped at 100
```

### What Each Level Means

| Score | Level | Meaning | Action |
|-------|-------|---------|--------|
| 80-100 | 🚨 CRITICAL | High-confidence threat | Immediate investigation |
| 60-79 | ⚠️ HIGH | Strong indicators | Formal investigation |
| 40-59 | ⚡ MEDIUM | Elevated risk | Monitoring + review |
| 0-39 | ℹ️ LOW | Normal pattern | Standard monitoring |

---

## 📋 Example: "Finding the Spy"

### Scenario
You upload:
- CSV with 1000 employees
- CCTV video showing building access

### System Analysis
1. Calculates behavioral risk for each employee
2. Extracts access events from CCTV
3. Correlates with authorized employee list
4. Identifies unauthorized entries
5. Cross-references with behavioral data
6. Scores each employee

### Results
```
🚨 CRITICAL: Chandra Costa (ACC0042)
   - CSV: 1510 logins, 455 night accesses, 92.46 risk
   - CCTV: 3 unauthorized entries, 46-54% confidence
   - Action: IMMEDIATE credential revocation

⚠️ HIGH: Two others with moderate indicators
   - Action: Schedule investigation meeting

⚡ MEDIUM: Three with elevated patterns
   - Action: Increase monitoring

ℹ️ LOW: Remaining employees
   - Action: Normal baseline
```

---

## 🔧 Technical Integration

### Files Modified
```
types.ts
├─ Added CCTVAccessEvent interface
├─ Added CCTVAccessLog interface
└─ Added UnifiedSpyProfile interface

utils/riskAnalysis.ts
├─ calculateAccessRisk() - CCTV scoring
├─ generateSpyProfile() - Unified assessment
├─ identifySpies() - Threat detection
└─ generateThreatReport() - Report generation

components/Dashboard.tsx
└─ Added "🕵️ Spy Detection" tab

components/SpyDetection.tsx (NEW)
├─ Risk level filtering
├─ Suspect profile cards
├─ Evidence display
├─ Recommendation system
└─ Report export
```

### How Data Flows
```
CSV Upload
    ↓
Parse employee data
    ↓
Calculate behavioral risk
         ↓
    ┌────────────────────┐
    │ CCTV Video Upload? │
    └────────────────────┘
    YES ↓         NO ↓
    Extract faces    Use behavioral
    Verify access    only
         ↓            ↓
    Calculate    Spy Score = 
    access risk   Behavioral × 0.6
         ↓            ↓
         └────┬───────┘
              ↓
       Generate Spy Profile
              ↓
       Identify Spies
              ↓
    🕵️ SPY DETECTION TAB
```

---

## 💾 Data Storage

### Local Storage
- Employee data cached in browser
- Activity logs stored locally
- Spy profiles calculated dynamically

### Demo Files
- `public/demo_cctv/access_log.json` - Sample access events
- `public/demo_cctv/cctv_demo_real.mp4` - Sample video
- `scripts/generate_cctv_access_log.py` - Generate sample data

### CSV Files
- `data/comprehensive_employee_data_*.csv` - 1000-5000 employees
- Can be mixed/matched for testing

---

## 🎓 What You Can Do Now

### 1. Demo Mode
```
Upload sample CSV → See risk scores → View spy detection
Expected: ~6 suspects from 1000 employees
```

### 2. Real Data
```
Replace CSV with your actual employee data
System automatically calculates spy scores
Results appear in dashboard
```

### 3. CCTV Integration
```
Add video for access control dimension
Face recognition verified against employee DB
Unauthorized access automatically flagged
```

### 4. Export Analysis
```
Download threat report for security team
Share with HR and legal
Use for investigations
```

---

## ⚙️ Customization

### Modify Risk Weights
File: `utils/riskAnalysis.ts` → `calculateAccessRisk()`

```typescript
// Change weights (currently 60/40):
const combinedScore = (csvRiskScore * 0.6 + accessRisk.score * 0.4);

// Adjust to your preference:
const combinedScore = (csvRiskScore * 0.7 + accessRisk.score * 0.3);
```

### Adjust Thresholds
File: `utils/riskAnalysis.ts` → `generateSpyProfile()`

```typescript
// Current thresholds:
// CRITICAL: 80+, HIGH: 60+, MEDIUM: 40+

// Customize:
if (combinedScore >= 70) suspiciousness = 'critical';
if (combinedScore >= 50) suspiciousness = 'high';
if (combinedScore >= 30) suspiciousness = 'medium';
```

### Add Risk Factors
File: `utils/riskAnalysis.ts` → `calculateAccessRisk()`

```typescript
// Add new factors:
if (accessEvent.locationViolation) {
  score += 20;
  factors.push('Unusual location access pattern');
}
```

---

## 🐛 Troubleshooting

### "No suspects found"
- CSV data may not have enough risk indicators
- Try: `data/comprehensive_employee_data_1000.csv`
- Expected: 6 suspects from sample data

### "Can't upload CCTV"
- Check video format: Must be MP4
- Check file size: Should be <100MB
- Server may not have face_recognition library

### "Face recognition not working"
- System falls back to demo mode
- Still shows behavioral risk
- Install: `pip install face_recognition` on backend

### Spy score too low/high
- Verify CSV file has required columns
- Check anomaly labels are present (-1 for anomaly)
- Adjust weights in `riskAnalysis.ts`

---

## 📞 Next Steps

1. **Test with Sample Data** ✓
   - Upload comprehensive_employee_data_1000.csv
   - Navigate to Spy Detection tab
   - See identified suspects

2. **Try CCTV Integration**
   - Upload cctv_demo_real.mp4
   - Set authorized employees
   - See combined threat assessment

3. **Export Report**
   - Click "Download Report"
   - Share with security team
   - Use for investigation

4. **Customize for Your Data**
   - Replace CSV with real employee data
   - Adjust risk weights as needed
   - Set department-specific thresholds

5. **Integrate with Workflows**
   - Alert on critical threats (>80)
   - Queue high risks (60-79) for investigation
   - Monitor medium alerts (40-59)
   - Baseline review low scores (0-39)

---

## 📚 Additional Resources

- **Technical Docs**: [SPY_DETECTION_GUIDE.md](SPY_DETECTION_GUIDE.md)
- **Full README**: [SPY_DETECTION_README.md](SPY_DETECTION_README.md)
- **System Architecture**: Check types.ts and utils/riskAnalysis.ts
- **UI Component**: Check components/SpyDetection.tsx

---

## ✨ You're All Set!

The insider threat detection system with spy detection is ready to use.

**Start with**: Upload → Scan → View 🕵️ Spy Detection Tab

Good luck with your insider threat investigations! 🚀
