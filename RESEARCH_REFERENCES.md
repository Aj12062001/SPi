# Research References and Method Mapping

This document maps foundational research to the methods implemented in SPi, and explains where each method appears in the codebase and why it is used.

## 1) Isolation Forest (Behavioral Anomaly Detection)

**Paper**
- Liu, F. T., Ting, K. M., & Zhou, Z.-H. (2008). *Isolation Forest*. 2008 Eighth IEEE International Conference on Data Mining, 413-422.

**Where used in project**
- `model/model traning.py`
  - Imports IsolationForest and trains anomaly detector.
  - Generates `anomaly_label` and `risk_score` from activity features.
- `README.md`
  - Declares Isolation Forest as the ML engine.
- `utils/reportGenerator.tsx`
  - Documents Isolation Forest in generated methodology text.

**Why used**
- Insider-threat events are typically rare outliers.
- Isolation Forest is efficient for high-volume logs and works without requiring fully labeled attack data.

---

## 2) Big Five / OCEAN Personality Model (Behavioral Signal Enrichment)

**Foundational research lineage**
- McCrae, R. R., & Costa, P. T. (1987). *Validation of the Five-Factor Model of personality across instruments and observers*. Journal of Personality and Social Psychology, 52(1), 81-90.
- Goldberg, L. R. (1990). *An alternative “description of personality”: The Big-Five factor structure*. Journal of Personality and Social Psychology, 59(6), 1216-1229.

**Where used in project**
- `components/DataInput.tsx`
  - Ingests O/C/E/A/N columns from CSV.
- `utils/riskAnalysis.ts`
  - Uses O/C/E/A/N to compute behavioral anomaly score.
- `components/UnifiedRiskDashboard.tsx`
  - Displays OCEAN values in reports and dashboard output.

**Why used**
- Adds a behavioral-profile dimension to complement activity-only telemetry.
- Improves analyst context when triaging borderline risk cases.

---

## 3) Viola-Jones / Haar Cascade (Classical Face Detection Fallback)

**Paper**
- Viola, P., & Jones, M. (2001). *Rapid Object Detection using a Boosted Cascade of Simple Features*. CVPR 2001.

**Where used in project**
- `backend/app.py`
  - Loads OpenCV Haar cascade and applies it in hybrid detection fallback flow.
- `real cctv/TECHNICAL_README.md`
  - Documents Haar-based baseline and operational trade-offs.

**Why used**
- Very lightweight and CPU-friendly fallback when advanced detectors are unavailable.
- Helps keep the CCTV pipeline operational in constrained environments.

---

## 4) MTCNN (Optional Deep Face Detector via CompreFace Path)

**Paper**
- Zhang, K., Zhang, Z., Li, Z., & Qiao, Y. (2016). *Joint Face Detection and Alignment Using Multitask Cascaded Convolutional Networks*. IEEE Signal Processing Letters, 23(10), 1499-1503.

**Where used in project**
- `real cctv/face_recognition.py`
  - Attempts to load and use MTCNN through CompreFace embedding stack.
- `backend/app.py`
  - Integrates CompreFace-based detection/recognition pipeline when enabled.

**Why used**
- Better robustness than Haar in unconstrained CCTV frames.
- Provides improved localization quality for downstream face recognition.

---

## 5) Histogram of Oriented Gradients (HOG) Face Localization (face_recognition fallback path)

**Paper**
- Dalal, N., & Triggs, B. (2005). *Histograms of Oriented Gradients for Human Detection*. CVPR 2005.

**Where used in project**
- `backend/app.py`
  - Uses `face_recognition.face_locations(..., model="hog")` in fallback path.

**Why used**
- Reasonable detection quality with lower compute cost than heavy CNN-based detectors.
- Useful as a practical fallback when DNN-based face detector path does not return detections.

---

## Notes on citation scope

- Current repository documentation mainly references implementations/libraries and vendor docs.
- This file provides the corresponding foundational research papers for academic reporting.
- If you are preparing a thesis/publication, also add your dataset provenance, ethical constraints, and bias/limitations section.
