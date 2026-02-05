# SPI (Security Prediction Intelligence) - CCTV Face Extraction Pipeline

## Overview

The SPI CCTV Face Extraction Pipeline processes video surveillance footage to extract frames and identify employee faces for use in face recognition systems like CompreFace.

### Key Features

- **Video Processing**: Analyzes CCTV footage and extracts frames
- **CCTV Styling**: Applies realistic CCTV-style processing to match video 1 as reference
- **Frame Extraction**: Converts video to individual frames with timestamps
- **Face Detection**: Identifies and extracts employee faces from frames
- **Quality Scoring**: Rates face images for recognition quality
- **Employee Database**: Organizes extracted faces by quality level
- **CompreFace Integration**: Generates structured output for face encoding

## Project Structure

```
d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\
├── video/                          # Input CCTV video files
│   ├── 1.mp4                      # Reference CCTV video (original)
│   ├── 2.mp4                      # Videos to process
│   ├── 3.mp4
│   ├── 4.mp4
│   └── 5.mp4
├── CompreFace-master/              # CompreFace installation
├── processed_output/               # Generated output files
│   ├── frames/                     # Extracted frames from videos
│   ├── extracted_faces/            # Raw extracted face images
│   ├── employee_database/          # Organized faces by quality
│   └── metadata/                   # Statistics and guides
├── video_processor.py              # Video processing module
├── face_recognition.py             # Face detection and organization
├── run_spi_pipeline.py            # Master orchestration script
├── requirements-spi.txt            # Python dependencies
└── SPI_README.md                   # This file
```

## Installation

### 1. Install Python Dependencies

```bash
pip install -r requirements-spi.txt
```

Alternatively, install manually:
```bash
pip install opencv-python numpy Pillow scikit-image
```

### 2. Verify Paths

Edit `run_spi_pipeline.py` and ensure these paths are correct:
- `base_path`: Your project root directory
- `compreface_path`: CompreFace installation directory

### 3. Prepare Video Files

Place your CCTV videos in the `video/` folder:
- `video/1.mp4` - Reference CCTV footage (used as style reference)
- `video/2.mp4` - Videos 2-5 to process

## Usage

### Option 1: Run Complete Pipeline

```bash
python run_spi_pipeline.py
```

This will:
1. Process all videos (2-5)
2. Extract frames with CCTV styling
3. Detect and extract faces
4. Organize faces by quality
5. Generate CompreFace integration guide

### Option 2: Run Individual Steps

#### Step 1: Process Videos and Extract Frames
```python
from video_processor import CCTVVideoProcessor

processor = CCTVVideoProcessor(r"d:\your\project\path")
processor.process_all_videos(frame_interval=5, start_video=2, end_video=5)
```

#### Step 2: Organize Faces and Setup Face Recognition
```python
from face_recognition import setup_face_recognition_pipeline
from pathlib import Path

base_path = Path(r"d:\your\project\path")
compreface_path = base_path / "CompreFace-master"

setup_face_recognition_pipeline(base_path, compreface_path)
```

## Output Files

### Frames Directory
```
processed_output/frames/
├── video_2/
│   ├── frame_000000.jpg
│   ├── frame_000001.jpg
│   └── ...
├── video_3/
│   ├── frame_000000.jpg
│   └── ...
└── ...
```

**Features**:
- CCTV-styled frames with timestamp overlay
- Extracted every 5 frames (configurable)
- Timestamps in format: MM:SS - Video X

### Extracted Faces Directory
```
processed_output/extracted_faces/
├── video_2/
│   ├── face_v2_f000000_0.jpg
│   ├── face_v2_f000000_1.jpg
│   └── ...
└── ...
```

### Employee Database Directory
```
processed_output/employee_database/
├── video_2/
│   ├── all_faces/              # All detected faces
│   ├── high_quality/           # Quality score >= 0.7
│   └── medium_quality/         # Quality score < 0.7
├── video_3/
└── ...
```

### Metadata
```
processed_output/metadata/
├── extraction_statistics.json  # Detailed metrics
├── COMPREFACE_USAGE_GUIDE.md  # Integration instructions
└── other metrics
```

## Configuration

### Video Processing Parameters

Edit `video_processor.py` to adjust:

```python
# Frame extraction interval (extract every nth frame)
processor.process_all_videos(frame_interval=5)

# CCTV styling parameters
brightness_adjustment=1.1  # Brightness multiplier
contrast_adjustment=1.2    # Contrast multiplier
```

### Face Detection Parameters

In `face_detection.detect_faces_in_frame()`:

```python
cascade_faces = self.face_cascade.detectMultiScale(
    gray,
    scaleFactor=1.1,         # Detection scale factor
    minNeighbors=5,          # Minimum detections needed
    minSize=(30, 30),        # Minimum face size
    maxSize=(300, 300)       # Maximum face size
)
```

## Quality Scoring

Face images are scored based on:

| Metric | Weight | Description |
|--------|--------|-------------|
| Sharpness | 40% | Clarity of facial features (higher = sharper) |
| Brightness | 30% | Proper lighting exposure (0.2-1.0 range) |
| Contrast | 30% | Distinction between features (higher = better) |

**Quality Thresholds**:
- High Quality: score >= 0.7 (recommended for face recognition)
- Medium Quality: score < 0.7

## CompreFace Integration

### 1. Start CompreFace Server

```bash
cd CompreFace-master
docker-compose up
```

CompreFace will be available at: `http://localhost:5000` (UI) and `http://localhost:3000` (API)

### 2. Create Employee Subject

```bash
curl -X POST "http://localhost:3000/api/v1/subject" \
  -H "Content-Type: application/json" \
  -d "{\"subject\": \"EMPLOYEE_NAME\"}"
```

### 3. Upload Face Images

```bash
curl -X POST "http://localhost:3000/api/v1/subject/EMPLOYEE_NAME/face" \
  -F "file=@/path/to/face.jpg"
```

Use high_quality faces from: `processed_output/employee_database/video_X/high_quality/`

### 4. Use for Face Recognition

Once trained, use for real-time face recognition during security monitoring:

```bash
curl -X POST "http://localhost:3000/api/v1/recognize" \
  -F "file=@/path/to/surveillance/frame.jpg"
```

## Monitoring and Logging

### Log File

All execution details are saved to: `spi_pipeline.log`

```bash
tail -f spi_pipeline.log
```

### Check Execution Status

Look for key messages:
- `✓` = Success
- `✗` = Error
- `⚠` = Warning

### Extract Statistics

View detailed metrics:
```bash
cat processed_output/metadata/extraction_statistics.json
```

## Troubleshooting

### Issue: "OpenCV not installed"
**Solution:**
```bash
pip install opencv-python
```

### Issue: "No faces detected"
**Solution:**
- Check video quality and lighting conditions
- Adjust `minSize` and `maxSize` in face detection
- Review `face_detection.py` parameters

### Issue: "Low quality faces"
**Solution:**
- Check source video quality and resolution
- Increase `contrast_adjustment` for better lighting
- Filter by higher quality threshold (> 0.8)

### Issue: "CompreFace connection fails"
**Solution:**
- Verify CompreFace is running: `docker ps`
- Check correct API endpoints
- Verify network connectivity

## Next Steps

1. **Review Extracted Faces**
   - Navigate to `processed_output/employee_database/`
   - Review high_quality faces for each video

2. **Group Similar Faces**
   - Group faces by suspected employee identity
   - Create folders for each employee if desired

3. **Train CompreFace Model**
   - Use high_quality images for best results
   - Upload 10-20 images per employee for training

4. **Deploy for Real-time Monitoring**
   - Configure SPI to use CompreFace API
   - Monitor live CCTV streams for employee detection
   - Set up alerts for suspicious activities

## Performance Considerations

### Memory Usage
- Processing one 5-minute video: ~500MB
- Total for all 4 videos: ~2GB

### Processing Time
- Extraction: ~2-3 minutes per video
- Face detection: ~5-10 minutes total
- Quality scoring: ~1-2 minutes

### Optimization Tips
- Increase `frame_interval` to skip more frames
- Reduce video resolution before processing
- Use GPU acceleration (if available)

## API Integration Example

```python
import cv2
import requests

# Load frame from video
frame = cv2.imread("frame.jpg")

# Prepare image for API
_, buffer = cv2.imencode('.jpg', frame)
files = {'file': buffer.tobytes()}

# Call CompreFace API
response = requests.post(
    'http://localhost:3000/api/v1/recognize',
    files=files
)

# Parse results
results = response.json()
for face in results['faces']:
    print(f"Employee: {face['subject']}, Confidence: {face['similarity']}")
```

## Support and Documentation

- **CompreFace Docs**: https://github.com/exadel-inc/CompreFace
- **OpenCV Docs**: https://docs.opencv.org/
- **Project Issues**: Check logs in `spi_pipeline.log`

## License

This SPI pipeline integrates with CompreFace (Apache 2.0 License).
See CompreFace-master/LICENSE for details.

## Author Notes

This pipeline is designed specifically for:
- CCTV surveillance video processing
- Employee face extraction and identification
- Integration with state-of-the-art face recognition systems (CompreFace)
- Security monitoring and anomaly detection

For questions or customization, refer to the detailed code documentation in each module.
