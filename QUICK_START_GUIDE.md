# Quick Start Guide - Enhanced SPi System

## 1. Generate the Comprehensive Dataset

Run the dataset generator:
```bash
cd "f:/main project/SPi-main"
python scripts/generate_enhanced_dataset.py
```

This will create `comprehensive_employee_data.csv` in the `public/` folder with:
- 100 employees
- 30 days of activity
- 2,556 records
- Comprehensive attributes (file operations, session tracking, etc.)

## 2. Start the Application

```bash
npm run dev
```

The app will start at `http://localhost:3001/` (or another port if 3001 is in use)

## 3. Login

Default credentials:
- Username: `admin`
- Password: `admin123`

## 4. Upload the Dataset

1. Click on **"Data Ingestion"** tab
2. Click **"Choose File"**
3. Select `public/comprehensive_employee_data.csv`
4. Click **"Start Risk Scan"**
5. Wait for the scan to complete (~8 seconds)

## 5. Explore the Features

### A. Overview (Introduction Tab)
- View system metrics
- See contamination rate
- Check critical risks
- Quick action cards

### B. Risk Assessment Tab
**Overview Mode:**
- KPI cards with risk counts
- Risk distribution pie chart
- 7-day risk trend
- Department risk analysis

**Details Mode with Search:**
1. Click on any risk level card (Critical, High, Medium, Low)
2. Use the search bar to find employees:
   - Search by ID: `UDA4332`
   - Search by Name: `Lisa`
   - Search by Department: `IT`
   - Search All: Type any text
3. Select search field filter (All Fields, Employee ID, Name, Department)
4. Click on any employee row to view details

**Employee Detail View:**
- Risk score breakdown (8 metrics)
- File operations panel:
  - Opened: Count
  - Copied: Count
  - Deleted: Count (red indicator)
  - Downloaded: Count (orange indicator)
  - Uploaded: Count
  - Edited: Count
  - Sensitive files: Count (red if > 0)
  - Unique files: Count
- Systems & Devices:
  - Unique PCs accessed
  - USB connections
  - Systems accessed (with tags)
- Communication Activity:
  - Emails sent
  - External emails (orange indicator)
  - Email attachments
  - HTTP requests
  - Unique URLs
- Login Activity:
  - Total logins
  - Night logins (yellow indicator)
  - Total session duration
  - Average session duration
- AI Recommendations

### C. Analytics Tab
**Isolation Forest Risk Curve (Top Section):**
1. View the ML model performance
2. Toggle between "Current Window" and "Previous Period"
3. See model metrics:
   - Accuracy: 94.2%
   - False Positive Rate: <2%
   - Anomalies Detected: Count

**Additional Analytics:**
- Login Activity vs Risk Score scatter plot
- File Operations Risk Analysis (top 15)
- USB vs External Email Activity
- Night Login Trends (top 10)
- Risk Distribution Summary
- Key Metrics

## 6. Testing Scenarios

### Scenario 1: Find High-Risk Employees
1. Go to Risk Assessment → Details
2. Click "High" or "Critical" card
3. Review the filtered list
4. Click "View Details" on any employee

### Scenario 2: Search for Specific Employee
1. Go to Risk Assessment → Details
2. Type employee name in search bar
3. Select "Name" from filter dropdown
4. Review the results

### Scenario 3: Check File Operations
1. Find an employee with high file operations
2. Click "View Details"
3. Scroll to "File Operations" panel
4. Check for:
   - High delete count (potential data destruction)
   - High download count (potential data exfiltration)
   - Sensitive files accessed (high risk)

### Scenario 4: Identify After-Hours Activity
1. Go to Risk Assessment → Details
2. Look for employees with high "Night Logins"
3. Click "View Details"
4. Review login activity panel
5. Check session durations

### Scenario 5: View ML Model Performance
1. Go to Analytics tab
2. View Isolation Forest Risk Curve at top
3. Toggle between current and previous period
4. Review accuracy metrics
5. Scroll down for detailed analytics

## 7. Sample High-Risk Patterns to Look For

### Data Exfiltration Risk:
- High file download count
- High sensitive files accessed
- High USB connections
- High external emails
- After-hours activity

### Data Destruction Risk:
- High file delete count
- High sensitive files accessed
- Unusual login patterns
- Low behavioral score

### Unauthorized Access:
- High unique PCs count
- Multiple systems accessed
- Night logins
- High session duration

## 8. Understanding Risk Scores

- **Critical (80+):** Immediate investigation required
- **High (60-79):** Enhanced monitoring needed
- **Medium (30-59):** Standard monitoring
- **Low (<30):** Normal baseline

## 9. Color Indicators

- 🔴 **Red:** Critical risk, sensitive files, deletions
- 🟠 **Orange:** High risk, downloads, external emails
- 🟡 **Yellow:** Medium risk, night logins
- 🟢 **Green:** Low risk, normal activity
- 🔵 **Blue/Purple:** Information, metrics

## 10. Tips for Best Results

1. **Upload Fresh Data:** Generate new dataset periodically
2. **Use Search:** Leverage search for quick employee lookup
3. **Check Details:** Always review full employee details before action
4. **Monitor Trends:** Use Analytics tab to spot patterns
5. **Export Findings:** Take screenshots of high-risk employees

## Troubleshooting

### Dataset not loading?
- Check file format (CSV)
- Verify headers match expected schema
- Check console for errors

### Search not working?
- Clear search and try again
- Select correct search field
- Check spelling

### Graphics not showing?
- Refresh the page
- Check browser console
- Verify data is loaded

## Support

For issues or questions:
1. Check console logs (F12)
2. Verify dataset structure
3. Review ENHANCEMENT_SUMMARY.md
4. Check types.ts for expected data format

---

**Note:** This is a demo system. Always verify findings with actual investigation before taking action against employees.
