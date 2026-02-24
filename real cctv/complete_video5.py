"""
Complete Video 5: Add 3rd face and generate video
"""

import cv2
import shutil
from pathlib import Path
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def extract_third_face_video5(base_path):
    """Extract a third face from video 5 frames"""
    base_path = Path(base_path)
    frames_folder = base_path / "processed_output" / "frames" / "video_5"
    organized_faces = base_path / "processed_output" / "faces_organized" / "video_5"
    organized_faces.mkdir(parents=True, exist_ok=True)
    
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    frame_files = sorted(
        list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
    )
    
    logger.info("Extracting 3rd face for video 5...")
    
    third_face_folder = organized_faces / "face_3"
    third_face_folder.mkdir(exist_ok=True)
    
    face_count = 0
    frames_with_faces = 0
    
    # Scan frames for additional faces
    for frame_file in frame_files[50:]:  # Start from a different section
        frame = cv2.imread(str(frame_file))
        if frame is None:
            continue
        
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
        
        if len(faces) >= 3 and face_count < 6:  # Get frames with at least 3 faces
            # Take the 3rd face
            x, y, w, h = faces[2]
            padding = 20
            y1 = max(0, y - padding)
            y2 = min(frame.shape[0], y + h + padding)
            x1 = max(0, x - padding)
            x2 = min(frame.shape[1], x + w + padding)
            
            face_crop = frame[y1:y2, x1:x2].copy()
            
            if face_crop.shape[0] >= 30 and face_crop.shape[1] >= 30:
                output_file = third_face_folder / f"face_3_angle_{face_count + 1}.jpg"
                cv2.imwrite(str(output_file), face_crop)
                face_count += 1
        
        frames_with_faces += 1
        if frames_with_faces > 100:  # Don't scan too many frames
            break
    
    logger.info(f"[OK] Face 3: {face_count} angles extracted")
    return face_count > 0


def generate_video5_cctv(base_path):
    """Generate CCTV video for video 5"""
    base_path = Path(base_path)
    frames_folder = base_path / "processed_output" / "frames" / "video_5"
    videos_output = base_path / "processed_output" / "cctv_styled_videos"
    videos_output.mkdir(parents=True, exist_ok=True)
    output_video = videos_output / "video_5_cctv_styled.mp4"
    
    frame_files = sorted(
        list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
    )
    
    if len(frame_files) == 0:
        logger.error("No frames found for video 5")
        return False
    
    first_frame = cv2.imread(str(frame_files[0]))
    if first_frame is None:
        logger.error("Could not read first frame")
        return False
    
    height, width = first_frame.shape[:2]
    
    # Create video writer
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    out = cv2.VideoWriter(str(output_video), fourcc, 5.0, (width, height))
    
    if not out.isOpened():
        logger.error("Failed to create video writer")
        return False
    
    frames_written = 0
    for frame_file in frame_files:
        frame = cv2.imread(str(frame_file))
        if frame is not None and frame.shape[:2] == (height, width):
            out.write(frame)
            frames_written += 1
    
    out.release()
    
    logger.info(f"[OK] video_5_cctv_styled.mp4 ({frames_written} frames)")
    return True


def main():
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    
    logger.info("="*70)
    logger.info("COMPLETING VIDEO 5")
    logger.info("="*70)
    
    # Extract 3rd face
    extract_third_face_video5(base_path)
    
    # Generate video 5
    generate_video5_cctv(base_path)
    
    # Summary
    organized_path = base_path / "processed_output" / "faces_organized" / "video_5"
    logger.info("\nFinal Video 5 Structure:")
    for face_folder in sorted(organized_path.iterdir()):
        if face_folder.is_dir():
            files = list(face_folder.glob("*.jpg")) + list(face_folder.glob("*.png"))
            logger.info(f"  - {face_folder.name}: {len(files)} images")
    
    logger.info("\n" + "="*70)
    logger.info("[OK] VIDEO 5 COMPLETION DONE!")
    logger.info("="*70)


if __name__ == "__main__":
    main()
