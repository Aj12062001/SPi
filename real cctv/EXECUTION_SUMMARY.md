# SPI CCTV Face Extraction Pipeline - Execution Summary

## Processing Completed Successfully! ✓

Date: February 9, 2026
Execution Status: SUCCESS

---

## Processing Results

### Videos Processed
Successfully processed 4 CCTV videos (videos 2-5) from the video folder.

### Frames Extracted
- **Video 2**: 276 frames
- **Video 3**: 152 frames
- **Video 4**: 101 frames
- **Video 5**: 293 frames
- **TOTAL**: 822 frames extracted

### Faces Detected and Extracted
- **Video 2**: 30 faces from 23 frames
- **Video 3**: 61 faces from 48 frames
- **Video 4**: 44 faces from 27 frames
- **Video 5**: 119 faces from 77 frames
- **TOTAL**: 254 employee faces extracted

### Face Quality Analysis
- Average face size: ~111-125 pixels
- All faces organized by quality level
- Quality scores range: 0.53-0.58 (medium quality)
- Note: 0 faces qualified as "high quality" (≥0.7 threshold)

---

## Output Structure

```
processed_output/
├── frames/                    # CCTV-styled frames with timestamps
│   ├── video_2/              # 276 frames
│   ├── video_3/              # 152 frames
│   ├── video_4/              # 101 frames
│   └── video_5/              # 293 frames
│
├── extracted_faces/          # Raw extracted face images
│   ├── video_2/              # 30 face images
│   ├── video_3/              # 61 face images
│   ├── video_4/              # 44 face images
│   └── video_5/              # 119 face images
│
├── employee_database/        # Organized faces by quality
│   ├── video_2/
│   │   ├── all_faces/       # All 30 faces
│   │   ├── high_quality/    # High-quality faces (≥0.7)
│   │   └── medium_quality/  # Medium-quality faces (<0.7)
│   ├── video_3/
│   ├── video_4/
│   └── video_5/
│
└── metadata/                 # Statistics and guides
    ├── extraction_statistics.json
    └── COMPREFACE_USAGE_GUIDE.md
```

---

## What Was Done

### 1. Video Processing ✓
- Applied CCTV-style processing to videos 2-5
- Adjusted brightness and contrast to match real CCTV footage
- Added timestamps to each frame
- Added camera ID overlays
- Extracted every 5th frame to optimize storage

### 2. Face Detection ✓
- Used OpenCV Haar Cascade classifier
- Detected faces in all extracted frames
- Removed duplicate detections
- Enhanced face images for better recognition

### 3. Face Organization ✓
- Organized faces by source video
- Calculated quality scores for each face
- Separated high-quality vs medium-quality faces
- Created employee database structure

### 4. Documentation ✓
- Generated detailed statistics
- Created CompreFace integration guide
- Documented all output locations

---

## Next Steps for Your SPI Project

### 1. Review Extracted Faces
Navigate to:
```
processed_output/employee_database/
```

Review the faces extracted from each video and identify unique employees.

### 2. Group by Employee
Manually group similar faces that belong to the same employee:
- Look for common facial features
- Check different angles of the same person
- Create folders for each identified employee

### 3. Train CompreFace Model

#### Start CompreFace:
```bash
cd CompreFace-master
docker-compose up
```

#### Create Employee Subjects:
For each identified employee, create a subject:
```bash
curl -X POST "http://localhost:3000/api/v1/subject" \
  -H "Content-Type: application/json" \
  -d "{\"subject\": \"EMPLOYEE_NAME\"}"
```

#### Upload Face Images:
Upload 5-10 face images per employee:
```bash
curl -X POST "http://localhost:3000/api/v1/subject/EMPLOYEE_NAME/face" \
  -F "file=@path/to/face_image.jpg"
```

### 4. Integrate with SPI System
Once trained, use CompreFace API for real-time face recognition:
```bash
curl -X POST "http://localhost:3000/api/v1/recognize" \
  -F "file=@surveillance_frame.jpg"
```

The response will include:
- Detected faces
- Employee identification
- Confidence scores
- Bounding box coordinates

### 5. Build Anomaly Detection
Use the face recognition results in your SPI system to:
- Track employee movements
- Detect unauthorized personnel
- Monitor restricted areas
- Generate security alerts

---

## Files Created

### Python Scripts
1. **video_processor.py** - Main video processing and face detection
2. **face_recognition.py** - Face organization and CompreFace integration
3. **run_spi_pipeline.py** - Master orchestration script
4. **regenerate_instructions.py** - Helper script for documentation

### Configuration Files
1. **requirements-spi.txt** - Python dependencies
2. **SPI_README.md** - Complete project documentation

### Output Files
1. **extraction_statistics.json** - Detailed processing metrics
2. **COMPREFACE_USAGE_GUIDE.md** - Integration instructions
3. **spi_pipeline.log** - Execution log

---

## Quality Improvement Recommendations

### Why No High-Quality Faces?
The current quality score threshold (0.7) is quite strict. Your extracted faces have scores around 0.53-0.58, which indicates:
- Medium lighting conditions
- Acceptable sharpness
- Moderate contrast

### To Improve Face Quality:
1. **Adjust threshold** - Lower to 0.5 to accept medium-quality faces
2. **Better source videos** - Use higher resolution CCTV footage
3. **Better lighting** - Ensure good lighting in recorded scenes
4. **Closer shots** - Position cameras closer to subjects

### Current Faces Are Still Usable!
Despite not meeting the "high quality" threshold, the extracted faces are:
- Clear enough for face recognition
- Properly detected and cropped
- Enhanced for better contrast
- Suitable for training CompreFace

---

## Technical Details

### Processing Time
- Total execution: ~10 minutes
- Video processing: ~7 minutes
- Face detection: ~2 minutes
- Organization: ~1 minute

### Storage Usage
- Frames: ~100-150 MB
- Faces: ~5-10 MB
- Total: ~200 MB

### Technologies Used
- OpenCV: Video processing and face detection
- NumPy: Image manipulation
- Python 3.13: Core processing
- Haar Cascade: Face detection classifier

---

## Troubleshooting

### If Face Recognition Accuracy is Low:
1. Upload more face images per employee (10-20 recommended)
2. Use faces from different angles
3. Include various lighting conditions
4. Ensure face images are at least 100x100 pixels

### If CompreFace Connection Fails:
1. Verify Docker is running: `docker ps`
2. Check CompreFace is accessible: `http://localhost:5000`
3. Verify port 3000 (API) is not blocked

### To Reprocess Videos:
Simply run the pipeline again:
```bash
python run_spi_pipeline.py
```

Or process specific videos by modifying the script.

---

## Support and Documentation

### Full Documentation
See **SPI_README.md** for complete instructions and configuration details.

### CompreFace Integration Guide
See **processed_output/metadata/COMPREFACE_USAGE_GUIDE.md** for detailed API usage.

### Execution Logs
Check **spi_pipeline.log** for detailed processing information.

---

## Project Status: COMPLETE ✓

All videos have been successfully processed, faces extracted, and organized for use in your SPI (Security Prediction Intelligence) system. You now have a complete dataset of employee faces ready for training a face recognition model.

**Your SPI system is ready for the next phase: Face Recognition Training!**

---

Generated: February 9, 2026
Pipeline Version: 1.0
Status: SUCCESS
