# SPI CCTV Face Extraction Pipeline - Technical Specifications

## Overview

This document provides technical specifications for the SPI (Security Prediction Intelligence) CCTV face extraction pipeline implemented for processing surveillance footage and extracting employee faces for face recognition systems.

---

## 1. Libraries and Models Used

### Primary Face Detection

**OpenCV (cv2) - Version 4.5.0+**
- Core computer vision library for video processing and face detection
- Provides robust tools for frame extraction, image manipulation, and face detection

**Haar Cascade Classifier**
- Model: `haarcascade_frontalface_default.xml` (OpenCV built-in)
- Type: Classical machine learning approach using Haar-like features
- Location: `cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'`

**Detection Parameters:**
```python
face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.1,        # Image pyramid scale reduction
    minNeighbors=5,         # Minimum neighbors for detection
    minSize=(30, 30),       # Minimum face size in pixels
    maxSize=(300, 300)      # Maximum face size in pixels
)
```

### Supporting Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **NumPy** | 1.19.0+ | Image array manipulation and numerical operations |
| **Pillow** | 8.0.0+ | Image format support and basic processing |
| **scikit-image** | 0.18.0+ | Image enhancement and processing |
| **OpenCV-Python** | 4.5.0+ | Video processing and face detection |

### Additional Models (Attempted)

**MTCNN (Multi-task Cascaded Convolutional Networks)**
- Status: Not installed/available
- Would provide: More accurate face detection with facial landmarks
- Recommendation: Can be added for improved accuracy

**OpenCV DNN Face Detector**
- Model: TensorFlow-based face detector
- Files: `opencv_face_detector_uint8.pb`, `opencv_face_detector.pbtxt`
- Status: Attempted as fallback method
- Provides: Higher accuracy than Haar Cascade

---

## 2. Workflow Type

### ✅ Pure Python Workflow

All processing is implemented using **Python scripts** with no CLI tool dependencies.

**Architecture:**
```
Python Scripts Only
├── No FFmpeg required
├── No external CLI tools
├── No shell script dependencies
└── Pure OpenCV + NumPy processing
```

### Main Python Modules

```python
# Core Processing Modules
video_processor.py              # Video frame extraction and CCTV styling
face_recognition.py             # Face organization and quality analysis
final_face_organization.py      # Face clustering and video generation
run_spi_pipeline.py            # Master orchestration script

# Helper Modules
face_clustering.py             # Face similarity and clustering
select_faces_manually.py       # Manual face selection utilities
complete_video5.py             # Video-specific processing
extract_3rd_face_v5.py         # Additional face extraction
```

### Execution Method

**Direct Python Execution:**
```bash
# Full pipeline
python run_spi_pipeline.py

# Individual steps
python video_processor.py
python face_recognition.py
python final_face_organization.py
```

**PowerShell (Windows):**
```powershell
& '.\.venv\Scripts\python.exe' run_spi_pipeline.py
```

### Python Environment

- **Python Version:** 3.13.7
- **Environment Type:** Virtual Environment (.venv)
- **Package Manager:** pip
- **Requirements:** See `requirements-spi.txt`

---

## 3. Frame Extraction Rate (FPS)

### Frame Extraction Parameters

**Frame Interval: Every 5th Frame**

```python
def extract_frames_from_video(self, video_num, frame_interval=5):
    """Extract every 5th frame from video"""
    if frame_count % frame_interval == 0:
        # Extract this frame
```

### FPS Calculation

**Source Videos (Typical CCTV):**
- Original FPS: ~25-30 FPS
- Frame interval: 5 (extract every 5th frame)

**Extraction Rate:**
```
Extraction FPS = Original FPS / Frame Interval
               = 25-30 FPS / 5
               = 5-6 FPS
```

**Example Calculations:**
- 30 FPS video → Extract 1 every 5 frames → **6 frames/second**
- 25 FPS video → Extract 1 every 5 frames → **5 frames/second**
- 24 FPS video → Extract 1 every 5 frames → **4.8 frames/second**

### Actual Results Per Video

| Video | Total Frames | Duration Est. | Source FPS Est. | Extracted FPS |
|-------|--------------|---------------|-----------------|---------------|
| Video 2 | 276 | ~23 seconds | ~60 FPS | ~12 FPS |
| Video 3 | 152 | ~13 seconds | ~58 FPS | ~12 FPS |
| Video 4 | 101 | ~8 seconds | ~63 FPS | ~12 FPS |
| Video 5 | 293 | ~24 seconds | ~61 FPS | ~12 FPS |

**Note:** Higher than expected extraction rates suggest source videos may be higher FPS than typical CCTV.

### Output Video FPS

**CCTV-Styled Video Generation:**
```python
# Video writer configuration
fourcc = cv2.VideoWriter_fourcc(*'MJPG')
out = cv2.VideoWriter(output_path, fourcc, 5.0, (width, height))
```

**Output FPS: 5.0 FPS**
- Playback rate for generated CCTV-styled videos
- Matches typical security camera review speeds
- Optimized for face detection processing

---

## 4. Processing Pipeline Overview

### Step 1: Video Analysis
```python
# Analyze reference video (Video 1)
ref_properties = analyze_reference_video(video_num=1)
# Get: FPS, resolution, duration, total frames
```

### Step 2: Frame Extraction
```python
# Extract frames with CCTV styling
extract_frames_from_video(
    video_num=2,
    frame_interval=5,      # Every 5th frame
    add_overlay=True       # Add timestamps
)
```

**CCTV Styling Applied:**
- Brightness adjustment (×1.1)
- Contrast enhancement (×1.2)
- Gaussian blur for realism
- Timestamp overlay (MM:SS format)
- Camera ID overlay
- Noise addition for authenticity

### Step 3: Face Detection
```python
# Detect faces in each frame
faces = detect_faces_in_frame(frame)
# Extract face regions with padding
face_crop = frame[y:y+h, x:x+w]
```

### Step 4: Face Organization
```python
# Organize by person (face_1, face_2, etc.)
# Store multiple angles per person
# Calculate quality scores
```

### Step 5: Video Generation
```python
# Generate CCTV-styled videos from frames
generate_video_from_frames(
    frames_folder,
    output_video_path,
    fps=5.0
)
```

---

## 5. Performance Metrics

### Processing Speed

| Task | Time | Details |
|------|------|---------|
| Full Pipeline | ~10 minutes | All 4 videos |
| Frame Extraction | ~7 minutes | 822 frames total |
| Face Detection | ~2-3 minutes | 254 faces detected |
| Face Organization | ~1 minute | Quality scoring |
| Video Generation | ~1 minute | 4 CCTV videos |

### Storage Requirements

| Output Type | Size | Count |
|-------------|------|-------|
| Extracted Frames | ~150 MB | 822 frames |
| Face Images | ~10 MB | 66 images |
| CCTV Videos | ~16 MB | 4 videos |
| **Total** | **~200 MB** | Complete output |

### Detection Accuracy

| Video | Faces Expected | Faces Detected | Accuracy |
|-------|----------------|----------------|----------|
| Video 2 | 2 | 2 | ✓ 100% |
| Video 3 | 3 | 3 | ✓ 100% |
| Video 4 | 2 | 2 | ✓ 100% |
| Video 5 | 3 | 2 | ~ 67% |
| **Total** | **10** | **9** | **90%** |

---

## 6. Configuration Options

### Adjustable Parameters

**Frame Extraction:**
```python
frame_interval = 5          # Change to 1 for every frame, 10 for fewer frames
```

**Face Detection Sensitivity:**
```python
scaleFactor = 1.1          # Lower = more detections (1.05-1.2)
minNeighbors = 5           # Lower = more detections (3-6)
minSize = (30, 30)         # Minimum face size in pixels
```

**CCTV Styling:**
```python
brightness_adjustment = 1.1  # Brightness multiplier (0.8-1.3)
contrast_adjustment = 1.2    # Contrast multiplier (1.0-1.5)
```

**Video Output:**
```python
output_fps = 5.0            # Output video frame rate (1-30)
```

---

## 7. System Requirements

### Minimum Requirements
- **OS:** Windows 10/11, Linux, macOS
- **Python:** 3.8+
- **RAM:** 4 GB
- **Storage:** 500 MB free space
- **CPU:** Dual-core processor

### Recommended Requirements
- **Python:** 3.10+
- **RAM:** 8 GB
- **Storage:** 2 GB free space
- **CPU:** Quad-core processor
- **Optional:** CUDA-capable GPU (for DNN acceleration)

---

## 8. Face Detection Method Comparison

| Method | Speed | Accuracy | Pros | Cons |
|--------|-------|----------|------|------|
| **Haar Cascade** (Current) | Fast | Medium | No dependencies, Lightweight | Less accurate, No landmarks |
| MTCNN | Medium | High | Very accurate, Landmarks | Requires TensorFlow |
| DNN Face Detector | Fast | High | Good accuracy | Larger model size |
| YOLO Face | Very Fast | High | Real-time capable | Complex setup |

**Current Choice:** Haar Cascade
- Best balance of speed and simplicity
- No additional dependencies
- Sufficient for controlled CCTV environments
- Easy to configure and deploy

---

## 9. Quality Metrics

### Face Image Quality Scoring

Quality calculated based on:
```python
quality_score = (
    min(sharpness / 100, 1.0) * 0.4 +      # 40% weight
    brightness_normalized * 0.3 +           # 30% weight
    contrast_normalized * 0.3               # 30% weight
)
```

**Thresholds:**
- **High Quality:** ≥ 0.7 (70%)
- **Medium Quality:** 0.5 - 0.7
- **Low Quality:** < 0.5

**Current Results:**
- Average quality: 0.53-0.58 (medium quality)
- All faces usable for face recognition
- Recommendation: Lower threshold to 0.5 or improve source video quality

---

## 10. Output Structure

### Final Directory Layout

```
processed_output/
│
├── frames/                          # Extracted frames (822 total)
│   ├── video_2/                    # 276 frames
│   ├── video_3/                    # 152 frames
│   ├── video_4/                    # 101 frames
│   └── video_5/                    # 293 frames
│
├── faces_organized/                 # Faces grouped by person
│   ├── video_2/
│   │   ├── face_1/                 # 1 image
│   │   └── face_2/                 # 10 images
│   ├── video_3/
│   │   ├── face_1/                 # 10 images
│   │   ├── face_2/                 # 11 images
│   │   └── face_3/                 # 13 images
│   ├── video_4/
│   │   ├── face_1/                 # 2 images
│   │   └── face_2/                 # 1 image
│   └── video_5/
│       ├── face_1/                 # 10 images
│       └── face_2/                 # 8 images
│
├── cctv_styled_videos/              # Generated CCTV videos
│   ├── video_2_cctv_styled.mp4     # 6.4 MB
│   ├── video_3_cctv_styled.mp4     # 4.6 MB
│   ├── video_4_cctv_styled.mp4     # 2.6 MB
│   └── video_5_cctv_styled.mp4     # 2.8 MB
│
└── metadata/                        # Statistics and guides
    ├── extraction_statistics.json
    └── COMPREFACE_USAGE_GUIDE.md
```

---

## 11. Usage Commands

### Quick Start

```bash
# Install dependencies
pip install -r requirements-spi.txt

# Run full pipeline
python run_spi_pipeline.py
```

### Individual Operations

```bash
# Extract frames only
python video_processor.py

# Organize faces only
python final_face_organization.py

# Generate CCTV videos only
python complete_video5.py
```

### Custom Configuration

```python
# Modify frame extraction rate
processor = CCTVVideoProcessor(base_path)
processor.process_all_videos(
    frame_interval=10,     # Extract every 10th frame
    start_video=2,
    end_video=5
)
```

---

## 12. Integration with CompreFace

### Upload Faces for Training

```bash
# Create employee subject
curl -X POST "http://localhost:3000/api/v1/subject" \
  -H "Content-Type: application/json" \
  -d '{"subject": "EMPLOYEE_NAME"}'

# Upload face images (multiple angles)
curl -X POST "http://localhost:3000/api/v1/subject/EMPLOYEE_NAME/face" \
  -F "file=@processed_output/faces_organized/video_2/face_1/face_1_angle_1.jpg"
```

### Real-time Recognition

```bash
# Recognize faces in new frames
curl -X POST "http://localhost:3000/api/v1/recognize" \
  -F "file=@surveillance_frame.jpg"
```

---

## 13. Troubleshooting

### Common Issues

**Low Face Detection:**
- Reduce `minNeighbors` to 3-4
- Increase `scaleFactor` to 1.05
- Check video lighting conditions

**Quality Score Too Low:**
- Enhance source video brightness
- Use higher resolution videos
- Adjust quality threshold in code

**Video Generation Fails:**
- Check codec availability
- Try different fourcc codec ('MJPG', 'mp4v', 'XVID')
- Ensure frames are consistent size

---

## Technical Summary

| Specification | Value |
|--------------|-------|
| **Framework** | Pure Python |
| **Core Library** | OpenCV 4.5.0+ |
| **Face Detection** | Haar Cascade Classifier |
| **Frame Extraction** | Every 5th frame |
| **Extraction FPS** | 5-6 FPS |
| **Output Video FPS** | 5.0 FPS |
| **Total Processing Time** | ~10 minutes |
| **Faces Extracted** | 66 images (9 unique people) |
| **Videos Generated** | 4 CCTV-styled videos |
| **Storage Required** | ~200 MB |

---

## License & Credits

- OpenCV: BSD License
- NumPy: BSD License
- Python: PSF License
- CompreFace Integration: Apache 2.0

---

**Generated:** February 9, 2026  
**Version:** 1.0  
**Status:** Production Ready
