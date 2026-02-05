# 🕵️ SPY DETECTION SYSTEM - COMBINED CSV + CCTV ANALYSIS

## Overview
The Insider Threat Detection System combines two independent data sources to identify potential spies/insider threats:

1. **CSV Behavioral Data** (60% weight) - Employee activities from logs
2. **CCTV Access Control Data** (40% weight) - Physical access verification

## Key Risk Management Factors

### 1. CSV-Based Behavioral Risk (Behavioral Profile)
Analyzes employee activity logs for suspicious patterns:

- **File Operations Risk**: Excessive file access, deletions, downloads
- **USB Activity Risk**: Unusual USB device connections and transfers
- **Email Risk**: Excessive external email communication
- **Login Pattern Risk**: Unusual hours, frequency anomalies
- **Night Login Risk**: After-hours access attempts
- **Anomaly Score**: ML model-based anomaly detection

### 2. CCTV-Based Access Control Risk (Physical Verification)
Analyzes face recognition and access control logs:

- **Unauthorized Access**: Person detected in restricted areas without authorization
- **Low Confidence Matches**: Face recognition with <70% confidence
- **Off-Hours Access**: Entry/exit during abnormal hours (6 PM - 6 AM)
- **Excessive Access Attempts**: Unusual frequency of CCTV appearances
- **Access Evasion**: Patterns suggesting bypass attempts

### 3. Unified Spy Profile (SPY SCORE)
**Spy Score = (CSV Risk × 0.6) + (Access Risk × 0.4)**

**Modifiers:**
- +30% boost if BOTH systems flag the employee
- +50% boost if unauthorized access detected
- = Final score out of 100

## Threat Classification

| Suspiciousness | Spy Score | Description | Action |
|---|---|---|---|
| 🚨 CRITICAL | 80-100 | Confirmed insider threat pattern | Immediate investigation + credential revocation |
| ⚠️ HIGH | 60-79 | Strong indicators of threat | Full investigation + monitoring |
| ⚡ MEDIUM | 40-59 | Elevated risk signals | Increased monitoring + supervisor review |
| ⚠️ LOW | 0-39 | Normal activity pattern | Standard monitoring |

## Evidence Types

### Red Flags That Trigger Investigation

**BEHAVIORAL (CSV):**
```
🟥 File operations exceed baseline (>500 files)
🟥 Unusual night-time access (>5 night logins)
🟥 Excessive USB usage (>20 devices)
🟥 ML model anomaly flag
🟥 External email overuse
```

**ACCESS CONTROL (CCTV):**
```
🚨 Unauthorized area access
🚨 Off-hours entry/exit attempts
🚨 Low-confidence face matches
🚨 Multiple CCTV appearances
🚨 Access pattern inconsistencies
```

## How It Works: Step-by-Step

### Step 1: Upload CSV Dataset
```
Import employee behavioral data with fields:
- login_count, night_logins
- file_activity_count, file_operations
- usb_count, external_mails
- risk_score, anomaly_label
```

### Step 2: Upload CCTV Video
```
Process video for face detection:
- Extract faces from each frame
- Build confidence scores
- Match against employee database
- Mark authorized vs unauthorized access
```

### Step 3: Integrate Data
```
For each employee:
1. Calculate CSV behavioral risk score
2. Calculate CCTV access risk score
3. Combine scores with weighted average
4. Apply convergent evidence boost
5. Generate spy profile + recommendations
```

### Step 4: Identify Spies
```
Filter results:
- Critical threats: Immediate action
- High risk: Investigation queue
- Medium risk: Monitoring
- Low risk: Baseline
```

## Example Scenario

### Employee: Alice (ID: ACC0042)

**CSV Data:**
- 1510 logins (very high)
- 455 night logins (critical red flag)
- 72 USB connections (high)
- Risk Score: 92.46/100
- ML Anomaly: Flagged

**CCTV Data:**
- 3 unauthorized access events (no face match)
- 2 off-hours entries (2:30 AM, 4:15 AM)
- Access confidence: 45% (low confidence = suspicious)
- Expected location mismatch

**Analysis:**
```
Behavioral Risk:  92.46/100 🔴
Access Risk:      65.00/100 🟠
Combined Score:  (92.46 × 0.6) + (65.00 × 0.4) = 81.08/100

CONVERGENT EVIDENCE BOOST: +30% = 105.4 → 100 (capped)
UNAUTHORIZED ACCESS BOOST: +50% applied

FINAL SPY SCORE: 100/100 🚨 CRITICAL

VERDICT: HIGH-CONFIDENCE INSIDER THREAT
- Strong behavioral red flags
- Multiple unauthorized accesses
- Off-hours activity pattern
- Machine learning flagged

ACTIONS:
1. IMMEDIATE: Suspend credentials and access
2. Contact security for investigation
3. Preserve all logs and evidence
4. Interview supervisor
5. Review department for other compromises
```

## Integration with UI

### New "Spy Detection" Tab
Located in main dashboard after "Analytics":

**Features:**
- Real-time spy score calculation
- Risk level filters (Critical/High/Medium/Low)
- Detailed suspect profiles
- Evidence listing with sources
- Actionable recommendations
- Download report functionality

**Metrics Displayed:**
- Total suspects count
- Critical threat count
- High/Medium risk breakdown
- Employee details
- Convergent evidence indicators

## API Integration

### CCTV Access Log Format
```typescript
interface CCTVAccessEvent {
  detectedPersonId: string;
  detectedPersonName: string;
  timestamp: string;
  confidence: number; // 0-1
  authorized: boolean;
  location: string;
  duration: number; // seconds
}

interface CCTVAccessLog {
  videoId: string;
  totalFrames: number;
  duration: number; // seconds
  accessEvents: CCTVAccessEvent[];
  authorizedEmployees: string[];
  unauthorizedAccesses: CCTVAccessEvent[];
}
```

## Detection Accuracy

### Factors Increasing Detection Confidence
1. **Convergent evidence** - Both systems flag same employee
2. **Unauthorized access** - Direct physical access violation
3. **Pattern consistency** - Behavior matches threat profile
4. **Temporal correlation** - CSV activity correlates with CCTV events

### False Positive Mitigation
- High confidence threshold (60+ combined score)
- Convergent evidence weighting (30% boost)
- Manual review recommended for 40-60 range
- Department-specific baselines

## Recommendations for Findings

### Critical Threats (SPY SCORE 80-100)
```
IMMEDIATE ACTIONS:
1. Revoke all credentials and physical access
2. Preserve all digital evidence
3. Contact legal and HR
4. Initiate formal investigation
5. Interview and potential termination
```

### High Risk (SPY SCORE 60-79)
```
URGENT ACTIONS:
1. Increase monitoring on all systems
2. Restrict sensitive data access
3. Schedule supervisor meeting
4. Review recent project access
5. Monitor communication channels
```

### Medium Risk (SPY SCORE 40-59)
```
PREVENTIVE ACTIONS:
1. Schedule review meeting
2. Increase activity monitoring
3. Enhance access controls
4. User awareness training
5. Quarterly reassessment
```

## File Structure

**New/Modified Files:**
- `types.ts` - Added CCTVAccessEvent, CCTVAccessLog, UnifiedSpyProfile interfaces
- `utils/riskAnalysis.ts` - Added spy detection functions
- `components/SpyDetection.tsx` - New UI component for spy detection dashboard
- `components/Dashboard.tsx` - Added Spy Detection tab

## How to Use

1. **Go to Data Ingestion** tab
2. **Upload CSV file** with employee behavioral data
3. **Upload CCTV video** (optional, for access risk)
4. **Define authorized employees** in CCTV section
5. **Click Results tab** to see initial risk assessment
6. **Click Spy Detection tab** to see combined analysis
7. **Download threat report** for security team review

## Future Enhancements

- Real-time threat scoring as data arrives
- Department-specific risk baselines
- Temporal correlation analysis
- Predictive threat modeling
- Integration with access card systems
- Email communication pattern analysis
- Network traffic correlation
