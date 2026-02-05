# CompreFace Integration Guide

## Extracted Faces Location
- **High Quality Faces**: d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\processed_output\employee_database/*/high_quality/
- **All Faces**: d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\processed_output\employee_database/*/all_faces/
- **Employee Database**: d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\processed_output\employee_database/

## Using with CompreFace

### 1. Start CompreFace Server
```bash
cd d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\CompreFace-master
docker-compose up
```

### 2. Create Subject (Employee)
For each employee, create a subject in CompreFace:
```bash
curl -X POST "http://localhost:8000/api/v1/subject" \
  -H "Content-Type: application/json" \
  -d {"subject": "EMPLOYEE_NAME"}
```

### 3. Upload Face Images
Upload high-quality faces from the extracted folders:
```bash
curl -X POST "http://localhost:8000/api/v1/subject/EMPLOYEE_NAME/face" \
  -F "file=@/path/to/face.jpg" \
  -F "subject=EMPLOYEE_NAME"
```

### 4. Use for Face Recognition
Once trained, use the embedding service for real-time face recognition in CCTV frames.

### 5. Output Format
The extracted faces are organized as:
- Video Name: d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\processed_output\employee_database/video_X/
  - high_quality/: Best faces for recognition (quality >= 0.7)
  - medium_quality/: Medium quality faces (quality < 0.7)
  - all_faces/: All detected faces


## Recommended Workflow

1. Review high_quality faces for each video
2. Group similar-looking faces (potential same employee)
3. Upload grouped faces to CompreFace under employee names
4. Use the trained model for real-time SPI monitoring

## Face Quality Metrics

Quality scores calculated based on:
- **Sharpness**: Clarity of facial features (40% weight)
- **Brightness**: Proper lighting exposure (30% weight)
- **Contrast**: Distinction between features (30% weight)

Recommended minimum quality: 0.7 (70%)

## Output Statistics
See `d:\Main File store\Ajin\Project\cctv footage for spi\real cctv\processed_output\metadata/extraction_statistics.json` for detailed metrics.
