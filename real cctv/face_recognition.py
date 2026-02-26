"""
CompreFace Integration Module
Uses CompreFace for advanced face detection and embedding generation
"""

import numpy as np
import cv2
import logging
from pathlib import Path
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class CompreFaceIntegration:
    """Integrate with CompreFace for face detection and embeddings"""
    
    def __init__(self, compreface_path):
        """
        Initialize CompreFace integration
        
        Args:
            compreface_path: Path to CompreFace master directory
        """
        self.compreface_path = Path(compreface_path)
        self.embedding_calculator_path = self.compreface_path / "embedding-calculator"
        
        # Import CompreFace modules
        self._setup_compreface_imports()
    
    def _setup_compreface_imports(self):
        """Setup imports from CompreFace"""
        import sys
        
        # Add CompreFace embedding-calculator to path
        if str(self.embedding_calculator_path) not in sys.path:
            sys.path.insert(0, str(self.embedding_calculator_path))
        
        try:
            from srcext.mtcnn.mtcnn import MTCNN
            self.mtcnn = MTCNN()
            logger.info("[OK] MTCNN face detector loaded successfully")
        except Exception as e:
            logger.warning(f"Could not load MTCNN: {e}")
            self.mtcnn = None
    
    def detect_faces(self, image):
        """
        Detect faces using MTCNN
        
        Args:
            image: Input image (BGR format)
        
        Returns:
            List of detected faces [(x, y, w, h), ...]
        """
        if self.mtcnn is None:
            logger.warning("MTCNN not available, using fallback")
            return []
        
        try:
            # Convert BGR to RGB for MTCNN
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Detect faces
            detections = self.mtcnn.detect_faces(rgb_image)
            
            faces = []
            for detection in detections:
                if 'box' in detection:
                    x, y, w, h = detection['box']
                    faces.append([x, y, w, h])
            
            return faces
        except Exception as e:
            logger.error(f"Error in MTCNN detection: {e}")
            return []
    
    def get_face_confidence(self, detection):
        """
        Extract confidence score from detection
        
        Args:
            detection: Detection object
        
        Returns:
            Confidence score
        """
        if isinstance(detection, dict) and 'confidence' in detection:
            return detection['confidence']
        return 0.5


class EmployeeFaceDatabase:
    """Organize and manage employee face database for recognition"""
    
    def __init__(self, base_path, compreface_path=None):
        """
        Initialize employee face database
        
        Args:
            base_path: Base directory for the project
            compreface_path: Path to CompreFace installation
        """
        self.base_path = Path(base_path)
        self.compreface_path = Path(compreface_path) if compreface_path else self.base_path / "CompreFace-master"
        self.output_base = self.base_path / "processed_output"
        self.faces_folder = self.output_base / "extracted_faces"
        self.employee_db = self.output_base / "employee_database"
        self.metadata_folder = self.output_base / "metadata"
        
        self._create_directories()
    
    def _create_directories(self):
        """Create necessary directories"""
        self.employee_db.mkdir(parents=True, exist_ok=True)
        self.metadata_folder.mkdir(parents=True, exist_ok=True)
    
    def organize_extracted_faces(self):
        """
        Organize extracted faces for employee identification
        Groups faces by video and provides quality metrics
        """
        if not self.faces_folder.exists():
            logger.warning(f"Faces folder not found: {self.faces_folder}")
            return
        
        logger.info("Organizing extracted faces...")
        
        video_face_stats = {}
        
        # Iterate through each video's faces
        for video_folder in self.faces_folder.iterdir():
            if not video_folder.is_dir():
                continue
            
            video_name = video_folder.name
            face_files = list(video_folder.glob("*.jpg")) + list(video_folder.glob("*.png"))
            
            # Calculate statistics
            total_faces = len(face_files)
            avg_size = self._calculate_average_face_size(face_files)
            quality_scores = self._calculate_face_quality(face_files)
            
            video_face_stats[video_name] = {
                'total_faces': total_faces,
                'average_size': avg_size,
                'quality_scores': quality_scores,
                'high_quality_count': sum(1 for q in quality_scores.values() if q >= 0.7)
            }
            
            logger.info(f"[OK] {video_name}: {total_faces} faces extracted")
            logger.info(f"  - Average size: {avg_size[0]:.0f}x{avg_size[1]:.0f}")
            logger.info(f"  - High quality faces: {video_face_stats[video_name]['high_quality_count']}")
            
            # Create employee-ready folder for this video
            self._create_employee_folder_structure(video_folder)
        
        # Save statistics
        self._save_statistics(video_face_stats)
    
    def _calculate_average_face_size(self, face_files):
        """Calculate average face image size"""
        sizes = []
        
        for face_file in face_files[:min(100, len(face_files))]:  # Sample first 100
            try:
                img = cv2.imread(str(face_file))
                if img is not None:
                    sizes.append(img.shape[:2])
            except:
                pass
        
        if sizes:
            avg_h = np.mean([s[0] for s in sizes])
            avg_w = np.mean([s[1] for s in sizes])
            return (avg_w, avg_h)
        return (0, 0)
    
    def _calculate_face_quality(self, face_files):
        """
        Calculate quality score for each face
        Based on: sharpness, brightness, contrast
        """
        quality_scores = {}
        
        for face_file in face_files[:min(200, len(face_files))]:  # Sample
            try:
                img = cv2.imread(str(face_file))
                if img is None:
                    continue
                
                # Convert to grayscale
                gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                
                # Calculate sharpness (using Laplacian variance)
                sharpness = cv2.Laplacian(gray, cv2.CV_64F).var()
                
                # Calculate brightness
                brightness = np.mean(gray) / 255.0
                
                # Calculate contrast
                contrast = np.std(gray) / 255.0
                
                # Combined quality score
                quality = (
                    min(sharpness / 100, 1.0) * 0.4 +  # Sharpness weight
                    min(max(brightness - 0.2, 0), 0.8) * 0.3 +  # Brightness weight
                    min(contrast, 1.0) * 0.3  # Contrast weight
                )
                
                quality_scores[face_file.name] = min(quality, 1.0)
            except:
                pass
        
        return quality_scores
    
    def _create_employee_folder_structure(self, video_folder):
        """
        Create folder structure for employee identification
        Separates high-quality and medium-quality faces
        """
        video_name = video_folder.name
        video_employee_db = self.employee_db / video_name
        video_employee_db.mkdir(parents=True, exist_ok=True)
        
        # Create subfolders for quality levels
        (video_employee_db / "high_quality").mkdir(exist_ok=True)
        (video_employee_db / "medium_quality").mkdir(exist_ok=True)
        (video_employee_db / "all_faces").mkdir(exist_ok=True)
        
        # Copy and organize faces
        face_files = list(video_folder.glob("*.jpg")) + list(video_folder.glob("*.png"))
        quality_scores = self._calculate_face_quality(face_files)
        
        for face_file in face_files:
            try:
                # Copy to all_faces
                import shutil
                shutil.copy(str(face_file), str(video_employee_db / "all_faces" / face_file.name))
                
                # Copy to quality-specific folder
                quality = quality_scores.get(face_file.name, 0.5)
                if quality >= 0.7:
                    shutil.copy(str(face_file), str(video_employee_db / "high_quality" / face_file.name))
                else:
                    shutil.copy(str(face_file), str(video_employee_db / "medium_quality" / face_file.name))
            except Exception as e:
                logger.debug(f"Could not organize face {face_file.name}: {e}")
    
    def _save_statistics(self, stats):
        """Save statistics to JSON file"""
        stats_file = self.metadata_folder / "extraction_statistics.json"
        
        stats['timestamp'] = datetime.now().isoformat()
        stats['output_paths'] = {
            'extracted_faces': str(self.faces_folder),
            'employee_database': str(self.employee_db),
            'metadata': str(self.metadata_folder)
        }
        
        with open(stats_file, 'w') as f:
            json.dump(stats, f, indent=2)
        
        logger.info(f"[OK] Statistics saved to {stats_file}")
    
    def generate_compreface_instructions(self):
        """
        Generate instructions for using extracted faces with CompreFace
        """
        instructions_file = self.metadata_folder / "COMPREFACE_USAGE_GUIDE.md"
        
        guide = f"""# CompreFace Integration Guide

## Extracted Faces Location
- **High Quality Faces**: {self.employee_db}/*/high_quality/
- **All Faces**: {self.employee_db}/*/all_faces/
- **Employee Database**: {self.employee_db}/

## Using with CompreFace

### 1. Start CompreFace Server
```bash
cd {self.compreface_path}
docker-compose up
```

### 2. Create Subject (Employee)
For each employee, create a subject in CompreFace:
```bash
curl -X POST "http://localhost:8000/api/v1/subject" \\
  -H "Content-Type: application/json" \\
  -d {{"subject": "EMPLOYEE_NAME"}}
```

### 3. Upload Face Images
Upload high-quality faces from the extracted folders:
```bash
curl -X POST "http://localhost:8000/api/v1/subject/EMPLOYEE_NAME/face" \\
  -F "file=@/path/to/face.jpg" \\
  -F "subject=EMPLOYEE_NAME"
```

### 4. Use for Face Recognition
Once trained, use the embedding service for real-time face recognition in CCTV frames.

### 5. Output Format
The extracted faces are organized as:
- Video Name: {self.employee_db}/video_X/
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
See `{self.metadata_folder}/extraction_statistics.json` for detailed metrics.
"""
        
        with open(instructions_file, 'w') as f:
            f.write(guide)
        
        logger.info(f"[OK] CompreFace usage guide generated at {instructions_file}")


def setup_face_recognition_pipeline(base_path, compreface_path):
    """
    Setup complete face recognition pipeline
    
    Args:
        base_path: Base project directory
        compreface_path: CompreFace installation path
    """
    logger.info("Setting up face recognition pipeline...")
    
    # Initialize CompreFace integration
    compreface = CompreFaceIntegration(compreface_path)
    
    # Initialize employee database
    employee_db = EmployeeFaceDatabase(base_path, compreface_path)
    
    # Organize extracted faces
    employee_db.organize_extracted_faces()
    
    # Generate usage instructions
    employee_db.generate_compreface_instructions()
    
    logger.info("[OK] Face recognition pipeline setup complete")
    
    return employee_db


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    base_path = r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv"
    compreface_path = Path(base_path) / "CompreFace-master"
    
    setup_face_recognition_pipeline(base_path, compreface_path)
