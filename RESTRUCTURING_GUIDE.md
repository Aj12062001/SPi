# 🎯 SPi Project Restructuring - Complete

## 📋 Summary of Changes

This document outlines all the major changes made to restructure the SPi (Security Pattern Intelligence) project according to your requirements.

---

## ✅ Completed Changes

### 1. **Removed Components**
- ❌ **Live CCTV Monitor** (`CCTVMonitoring.tsx`) - Removed from navigation
- ❌ **Spy Detection** (`SpyDetection.tsx`) - Removed from navigation
- ✅ These components still exist in the codebase but are not accessible from the UI

### 2. **New Components Created**

#### 📸 **EmployeeImageUpload.tsx**
Located at: `components/EmployeeImageUpload.tsx`

**Features:**
- Upload employee images from multiple angles
- Separate sections for authorized and unauthorized employees
- Real-time image preview grid
- Employee ID management (comma-separated input)
- Local storage integration
- Validation and error handling

**How to Use:**
1. Navigate to "Employee Images" tab
2. Enter employee IDs (comma-separated, matching CSV data)
3. Upload multiple images per employee for better recognition
4. Optionally add unauthorized employee images
5. Save configuration

#### 📹 **CCTVFaceRecognition.tsx**
Located at: `components/CCTVFaceRecognition.tsx`

**Features:**
- Video upload interface
- Restricted zone toggle
- Face detection and recognition
- Risk score integration from CSV data
- Real-time processing status
- Critical threat alerts
- Detection statistics dashboard
- Individual employee tracking
- CSV export functionality

**How to Use:**
1. Upload employee images first (Employee Images tab)
2. Navigate to "CCTV Analysis" tab
3. Upload CCTV video file
4. Toggle "Restricted Zone" if needed
5. Click "Process Video"
6. View detection results with risk scores
7. Export results as CSV

### 3. **Enhanced Risk Assessment - PDF Export**

#### 📄 **UnifiedRiskDashboard.tsx** (Updated)
Added comprehensive PDF/Text export functionality:

**Export Options:**
- ✅ **All Employees** - Complete dataset with risk assessments
- ✅ **High Risk** - Employees with risk score ≥ 60
- ✅ **Medium Risk** - Employees with risk score 30-59
- ✅ **Low Risk** - Employees with risk score < 30
- ✅ **Individual Employee** - Detailed single employee report

**Exported Data Includes:**
- Employee profile (ID, name, department, job title)
- Complete risk assessment breakdown
- Activity metrics (logins, file ops, USB, emails)
- OCEAN personality traits
- Risk component scores

**How to Use:**
1. Navigate to "Risk Assessment" tab
2. Use export buttons in the "Export Risk Reports" section
3. Or click download icon next to any employee in the table
4. Reports are saved as `.txt` files (formatted for readability)

### 4. **Backend Enhancements**

#### 🔧 **app.py** (Updated)
Located at: `backend/app.py`

**New Endpoints:**

##### `/analyze_with_risk` (POST)
Combines face recognition with behavioral risk scores
- **Parameters:**
  - `video`: CCTV video file
  - `images`: Employee face images
  - `authorized_ids`: Comma-separated authorized employee IDs
  - `risk_data`: JSON containing risk scores from CSV

- **Returns:**
  ```json
  {
    "mode": "live",
    "results": [
      {
        "employeeId": "EMP001",
        "name": "John Doe",
        "status": "authorized|unauthorized|unknown",
        "confidence": 0.95,
        "riskScore": 75.5,
        "riskLevel": "HIGH",
        "department": "IT",
        "detectionCount": 12
      }
    ],
    "totalDetections": 5,
    "criticalThreats": 2
  }
  ```

##### `/upload_employee_images` (POST)
Store employee images for face recognition
- **Parameters:**
  - `images`: Multiple image files
  - `employee_ids`: Comma-separated employee IDs

##### `/employee_images` (GET)
Retrieve list of stored employee images

---

## 🗂️ Updated Navigation Structure

**Previous:**
```
1. Overview
2. Data Ingestion
3. Risk Assessment
4. Analytics
5. 🕵️ Spy Detection
6. 📹 Live CCTV Monitor
```

**New:**
```
1. Overview
2. Data Ingestion
3. 📸 Employee Images ← NEW
4. Risk Assessment (with PDF export)
5. Analytics
6. 📹 CCTV Analysis ← NEW (replaces old CCTV)
```

---

## 🔄 Workflow

### Complete Usage Flow:

#### Step 1: Data Preparation
1. Go to **Data Ingestion** tab
2. Upload your behavioral data CSV file (with risk scores)
3. System processes and generates risk assessments

#### Step 2: Employee Image Setup
1. Go to **Employee Images** tab
2. Enter authorized employee IDs (matching CSV file)
3. Upload multiple images per employee (different angles)
4. Optionally add unauthorized employee images
5. Save configuration

#### Step 3: Risk Assessment Review
1. Go to **Risk Assessment** tab
2. Review risk distribution and employee details
3. Export reports:
   - Click "All Employees" for complete dataset
   - Click "High Risk" / "Medium Risk" / "Low Risk" for filtered reports
   - Click download icon next to specific employee for individual report

#### Step 4: CCTV Analysis
1. Go to **CCTV Analysis** tab
2. Upload CCTV video footage
3. Toggle "Restricted Zone" if this is a sensitive area
4. Click "Process Video"
5. System will:
   - Detect faces in video
   - Match against authorized employees
   - Combine with behavioral risk scores
   - Flag critical threats (unauthorized + high risk)
6. Review results in the dashboard
7. Export results as CSV

---

## 📊 Risk Score Calculation

The system combines **two independent risk sources**:

### 1. Behavioral Risk (from CSV Data)
```
Risk Score = (Model Risk × 0.25) + File Risk + USB Risk + 
             Night Login Risk + Login Volume Risk + Anomaly Boost

Components:
- File Activity Risk: min(35, file_count × 0.05)
- USB Activity Risk: min(25, usb_count × 0.08)
- Night Login Risk: min(20, night_logins × 0.5)
- Login Volume Risk: min(10, (excess_logins) × 0.05)
- Anomaly Boost: +10 if flagged by ML model
```

### 2. CCTV Access Risk (from Face Detection)
```
CCTV Risk = (unauthorized_attempts × 10) + 
            (restricted_area_access × 8) + 
            (off-hours_access × 6)
Capped at 100
```

### 3. Combined Risk (when using CCTV Analysis)
```
Combined Risk = (Behavioral Risk × 0.6) + (CCTV Risk × 0.4)

Risk Levels:
- HIGH: ≥ 60
- MEDIUM: 30-59
- LOW: < 30
```

---

## 🔧 Technical Implementation Details

### Frontend Components:
- **React** with **TypeScript**
- **Lucide React** icons
- **Recharts** for visualizations
- **Tailwind CSS** for styling
- Local Storage for image metadata

### Backend:
- **FastAPI** Python framework
- **face_recognition** library (optional, falls back to demo mode)
- **OpenCV** for video processing
- **pandas** for CSV handling
- CORS enabled for localhost development

### File Structure:
```
SPi-main/
├── components/
│   ├── EmployeeImageUpload.tsx     ← NEW
│   ├── CCTVFaceRecognition.tsx     ← NEW
│   ├── UnifiedRiskDashboard.tsx    ← UPDATED (PDF export)
│   ├── Dashboard.tsx               ← UPDATED (navigation)
│   └── ... (other components)
├── backend/
│   ├── app.py                      ← UPDATED (new endpoints)
│   └── uploads/                    ← NEW (auto-created)
│       └── employee_images/
└── CompreFace-master/              (optional, for advanced face recognition)
```

---

## 🚀 Setup Instructions

### Prerequisites:
```bash
# Python 3.8+
# Node.js 16+
```

### Backend Setup:
```bash
cd backend
pip install fastapi uvicorn python-multipart opencv-python face_recognition pandas

# Optional: If face_recognition has issues, it will fall back to demo mode
# On Windows, you may need: pip install cmake dlib

# Run backend
uvicorn app:app --reload --port 8000
```

### Frontend Setup:
```bash
# From project root
npm install

# Run development server
npm run dev
```

### CompreFace Setup (Optional, for production):
```bash
cd CompreFace-master
docker-compose up -d
# Access at http://localhost:8000
```

---

## 📝 Notes

### Important Considerations:
1. **Employee IDs Must Match**: Employee IDs in images must match those in your CSV file
2. **Image Quality**: Use clear, front-facing photos for best recognition results
3. **Multiple Angles**: Upload 3-5 images per employee from different angles
4. **Restricted Zones**: Enable "Restricted Zone" mode for sensitive areas
5. **Export Formats**: Currently exports as formatted text files (.txt) for compatibility

### Future Enhancements (Optional):
- [ ] True PDF generation with charts/images
- [ ] Real-time video streaming analysis
- [ ] Integration with actual CompreFace API
- [ ] Advanced face tracking with timestamps
- [ ] Automated alert notifications
- [ ] Historical video analysis dashboard

---

## 🐛 Troubleshooting

### Face Recognition Not Working:
- **Issue**: "Face recognition backend not available"
- **Solution**: Install face_recognition library or use demo mode
- **Alternative**: System falls back to mock data automatically

### Images Not Uploading:
- **Issue**: Upload fails or images not showing
- **Solution**: Check browser console, ensure files are JPG/PNG
- **Check**: File size limits (adjust if needed)

### Risk Scores Not Showing in CCTV:
- **Issue**: Risk scores show as N/A
- **Solution**: Ensure CSV data is uploaded first in Data Ingestion tab
- **Check**: Employee IDs match between CSV and uploaded images

### Video Processing Slow:
- **Issue**: Processing takes too long
- **Solution**: Use shorter video clips or reduce video resolution
- **Alternative**: System samples frames (not every frame) for efficiency

---

## ✨ Key Features Summary

### What's New:
✅ Employee image management system  
✅ CCTV video face recognition  
✅ Risk score integration (behavioral + access)  
✅ PDF/Text report export (all risk levels)  
✅ Individual employee report export  
✅ Critical threat alerting  
✅ Detection statistics dashboard  
✅ CSV export for CCTV results  

### What's Removed:
❌ Live CCTV Monitor (replaced with analysis)  
❌ Spy Detection (integrated into CCTV analysis)  

---

## 📞 Support

For issues or questions:
1. Check this documentation
2. Review the Troubleshooting section
3. Check browser console for errors
4. Review backend logs (terminal where uvicorn is running)

---

**Last Updated:** February 13, 2026  
**Version:** 2.0 - Major Restructuring Complete
