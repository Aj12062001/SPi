# 🔍 SPi - AI-Powered Insider Threat Detection System

**Enterprise security solution combining behavioral analytics, CCTV monitoring, and AI-powered threat detection**

---

## 📋 Overview

**SPi (Security Pattern Intelligence)** is an AI-powered insider threat detection system that integrates behavioral analytics, real-time CCTV monitoring, and machine learning. The system provides comprehensive threat detection by combining digital forensics with physical access control.

### Core Capabilities

**1. Behavioral Analytics (60% Weight)**
- Isolation Forest ML Algorithm for anomaly detection
- Activity tracking: file operations, USB usage, email patterns
- OCEAN Personality Model integration
- Login frequency and pattern analysis

**2. Physical Access Monitoring (40% Weight)**
- Real-time CCTV face recognition
- Zone-based authorization control
- Off-hours detection
- Access timeline tracking

**3. Unified Threat Scoring**
```
Spy Score = (Behavioral Risk × 0.6) + (Physical Access Risk × 0.4)
```

---

## ✨ Key Features

- Real-time threat detection with 3-second refresh intervals
- Spy detection system with dual-source verification (CSV + CCTV)
- Live CCTV monitoring with face recognition
- Multi-factor risk assessment (8-component scoring)
- Behavioral pattern analysis with ML
- Zone-based access control (4 high-security zones)
- Unified risk dashboard with advanced filtering
- Activity timeline with chronological event tracking
- Automated report generation and evidence compilation
- Interactive visualizations and trend analysis

---

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Python 3.8+ (for backend/ML)
- Modern web browser

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/spi-insider-threat-detection.git
   cd SPi-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   ```
   http://localhost:3002
   ```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🔐 Authentication

| Role | Username | Password |
|------|----------|----------|
| Security Admin | `admin` | `password123` |
| Threat Analyst | `analyst` | `spy-detector-2025` |

---

## 📊 Usage Workflow

### Step 1: Data Ingestion
1. Navigate to "Data Ingestion" tab
2. Upload CSV file with employee behavioral data
   - Sample datasets available in `/data/` directory
   - System supports 38+ behavioral attributes
3. System automatically processes and calculates risk scores

### Step 2: Risk Assessment
- View unified risk dashboard
- Search employees by ID, name, or department
- Review 8 risk metric cards per employee
- Check activity logs and timelines

### Step 3: Analytics
- Analyze risk distribution across organization
- Review department-wise comparisons
- Track 7-day risk trends
- Generate statistical summaries

### Step 4: Spy Detection
1. Upload CCTV video (MP4 format recommended)
2. Define authorized employee list
3. System performs face recognition and access verification
4. Review unified threat score and verdict
5. Export detailed findings report

### Step 5: Live CCTV Monitor
- Monitor real-time face detection feed
- Track restricted zone access (CEO, Financial, Server, R&D)
- Review confidence scores and alerts
- Check chronological incident timeline

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 19.2.3 + TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| ML Engine | Isolation Forest (Scikit-learn) |
| Face Recognition | Python face_recognition library |
| Backend | Python Flask |
| Data Processing | Python + Pandas |
| Visualization | Recharts |
| State Management | React Context API |
| Icons | Lucide React |

---

## 📁 Project Structure

```
SPi-main/
├── components/          # React components
├── backend/            # Python Flask backend
├── data/               # Sample CSV datasets
├── model/              # ML models and training
├── real cctv/          # CCTV processing scripts
├── public/             # Static assets
├── App.tsx             # Main application
├── DataContext.tsx     # State management
├── package.json        # Dependencies
└── README.md           # Documentation
```

---

## 📈 Risk Scoring

**Risk Categories:**
- **Critical (80-100)**: Immediate investigation required
- **High (60-79)**: Enhanced monitoring recommended
- **Medium (40-59)**: Standard surveillance
- **Low (0-39)**: Normal activity

**Analyzed Metrics:**
- File activity, USB usage, email patterns
- Login frequency and timing
- Night access attempts
- Restricted zone entry
- Behavioral anomalies
- System access patterns

---

## 📚 Additional Documentation

- **QUICK_START_GUIDE.md** - Step-by-step setup instructions
- **SPY_DETECTION_GUIDE.md** - Comprehensive spy detection usage
- **CCTV_FACE_DETECTION_GUIDE.md** - CCTV integration details
- **DATASET_GUIDE.md** - Sample data structure and format
- **FEATURE_CHECKLIST.md** - Complete feature list

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Support

For questions, issues, or feature requests, please contact the development team or open an issue in the repository.

---

**SPi - Security Pattern Intelligence**  
*Protecting organizations from insider threats with AI-powered detection*
