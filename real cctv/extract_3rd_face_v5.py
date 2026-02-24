"""
Manually extract 3rd face from video 5
"""

import cv2
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def find_and_extract_multiple_faces(base_path):
    """Find frames with 3+ faces and extract the 3rd person"""
    base_path = Path(base_path)
    frames_folder = base_path / "processed_output" / "frames" / "video_5"
    organized_faces = base_path / "processed_output" / "faces_organized" / "video_5"
    
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    frame_files = sorted(
        list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
    )
    
    logger.info(f"Scanning {len(frame_files)} frames for 3+ face detections...")
    
    # Find frames with multiple faces
    best_frames = []
    for frame_file in frame_files:
        frame = cv2.imread(str(frame_file))
        if frame is None:
            continue
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
        
        if len(faces) >= 3:
            best_frames.append((frame_file, faces))
            if len(best_frames) >= 2:
                break
    
    logger.info(f"Found {len(best_frames)} frames with 3+ faces")
    
    if len(best_frames) == 0:
        logger.warning("Could not find frames with 3+ faces")
        # Create face_3 folder anyway
        face3_folder = organized_faces / "face_3"
        face3_folder.mkdir(exist_ok=True)
        return
    
    # Extract 3rd face from these frames
    face3_folder = organized_faces / "face_3"
    face3_folder.mkdir(exist_ok=True)
    
    extracted_count = 0
    for frame_file, faces in best_frames:
        frame = cv2.imread(str(frame_file))
        
        # Extract face 3 (index 2)
        if len(faces) > 2:
            x, y, w, h = faces[2]
            padding = 20
            y1 = max(0, y - padding)
            y2 = min(frame.shape[0], y + h + padding)
            x1 = max(0, x - padding)
            x2 = min(frame.shape[1], x + w + padding)
            
            face_crop = frame[y1:y2, x1:x2].copy()
            
            if face_crop.shape[0] >= 30 and face_crop.shape[1] >= 30:
                output_file = face3_folder / f"face_3_angle_{extracted_count + 1}.jpg"
                cv2.imwrite(str(output_file), face_crop)
                extracted_count += 1
    
    logger.info(f"[OK] Face 3: {extracted_count} images extracted")


def main():
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    
    logger.info("="*70)
    logger.info("Manual 3rd Face Extraction for Video 5")
    logger.info("="*70)
    
    find_and_extract_multiple_faces(base_path)
    
    # Show final structure
    organized_path = base_path / "processed_output" / "faces_organized" / "video_5"
    logger.info("\nFinal Video 5 Face Structure:")
    for face_folder in sorted(organized_path.iterdir()):
        if face_folder.is_dir():
            files = list(face_folder.glob("*.jpg")) + list(face_folder.glob("*.png"))
            logger.info(f"  - {face_folder.name}: {len(files)} images")
    
    logger.info("\n" + "="*70)
    logger.info("[OK] DONE!")
    logger.info("="*70)


if __name__ == "__main__":
    main()
