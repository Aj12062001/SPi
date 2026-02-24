"""
Quick Face Organization Script
Organizes already-extracted faces directly
"""

import cv2
import shutil
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def organize_existing_extracted_faces(base_path):
    """Copy and organize existing extracted faces"""
    base_path = Path(base_path)
    extracted_faces = base_path / "processed_output" / "extracted_faces"
    organized_faces = base_path / "processed_output" / "faces_organized"
    organized_faces.mkdir(parents=True, exist_ok=True)
    
    logger.info("Organizing existing extracted faces...")
    
    # Video 2 and 3 already have organized structure
    for video_num in [2, 3]:
        video_extracted = extracted_faces / f"video_{video_num}"
        video_organized = organized_faces / f"video_{video_num}"
        video_organized.mkdir(parents=True, exist_ok=True)
        
        if not video_extracted.exists():
            continue
        
        logger.info(f"\n[VIDEO {video_num}]")
        
        # Copy existing face folders
        for item in video_extracted.iterdir():
            if item.is_dir():
                # Copy entire face folder
                dest_folder = video_organized / item.name
                if dest_folder.exists():
                    shutil.rmtree(dest_folder)
                shutil.copytree(item, dest_folder)
                
                files = list(dest_folder.glob("*.jpg")) + list(dest_folder.glob("*.png"))
                logger.info(f"  [OK] {item.name}: {len(files)} images")
            elif item.suffix.lower() in ['.jpg', '.png']:
                # Copy single file faces (like face 1.jpg)
                face_name = item.stem  # "face 1"
                dest_folder = video_organized / face_name
                dest_folder.mkdir(exist_ok=True)
                
                dest_file = dest_folder / item.name
                shutil.copy(item, dest_file)
                logger.info(f"  [OK] {face_name}: 1 image")


def extract_best_faces_from_frames(base_path):
    """Extract best faces from frames for videos 4 and 5"""
    base_path = Path(base_path)
    frames_base = base_path / "processed_output" / "frames"
    organized_faces = base_path / "processed_output" / "faces_organized"
    
    logger.info("\nExtracting faces from frames for videos 4 and 5...")
    
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    
    for video_num in [4, 5]:
        frames_folder = frames_base / f"video_{video_num}"
        video_organized = organized_faces / f"video_{video_num}"
        video_organized.mkdir(parents=True, exist_ok=True)
        
        if not frames_folder.exists():
            logger.warning(f"Frames folder not found for video {video_num}")
            continue
        
        logger.info(f"\n[VIDEO {video_num}]")
        
        # Get all frames
        frame_files = sorted(
            list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
        )
        
        unique_faces = {}  # face_id -> {frames: [], crops: []}
        
        # Scan frames and collect distinct faces
        for frame_idx, frame_file in enumerate(frame_files):
            frame = cv2.imread(str(frame_file))
            if frame is None:
                continue
            
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=(40, 40))
            
            # For each face in this frame, assign to unique person
            for face_idx, (x, y, w, h) in enumerate(faces):
                # Extract face crop
                padding = 20
                y1 = max(0, y - padding)
                y2 = min(frame.shape[0], y + h + padding)
                x1 = max(0, x - padding)
                x2 = min(frame.shape[1], x + w + padding)
                
                face_crop = frame[y1:y2, x1:x2].copy()
                
                if face_crop.shape[0] < 30 or face_crop.shape[1] < 30:
                    continue
                
                # Assign to a unique face ID based on what's available
                # Try to assign to existing face or create new
                assigned = False
                
                # For first occurrence, create face folders
                if len(unique_faces) < (3 if video_num == 5 else 2):
                    if face_idx not in unique_faces:
                        unique_faces[face_idx] = {
                            'frames': [],
                            'crops': []
                        }
                    
                    unique_faces[face_idx]['frames'].append(frame_file)
                    unique_faces[face_idx]['crops'].append(face_crop)
                    assigned = True
                
                # If assigned and we're collecting first N angles, continue
                if assigned:
                    if len(unique_faces[face_idx]['crops']) > 10:
                        unique_faces[face_idx]['crops'] = unique_faces[face_idx]['crops'][:10]
        
        # Save organized faces
        for face_id in sorted(unique_faces.keys()):
            face_info = unique_faces[face_id]
            if len(face_info['crops']) == 0:
                continue
            
            face_folder = video_organized / f"face_{face_id + 1}"
            face_folder.mkdir(exist_ok=True)
            
            for crop_idx, crop in enumerate(face_info['crops'][:10]):
                output_file = face_folder / f"face_{face_id + 1}_angle_{crop_idx + 1}.jpg"
                cv2.imwrite(str(output_file), crop)
            
            logger.info(f"  [OK] Face {face_id + 1}: {len(face_info['crops'])} angles")


def generate_cctv_videos(base_path):
    """Generate CCTV-styled videos from frames"""
    base_path = Path(base_path)
    frames_base = base_path / "processed_output" / "frames"
    videos_output = base_path / "processed_output" / "cctv_styled_videos"
    videos_output.mkdir(parents=True, exist_ok=True)
    
    logger.info("\nGenerating CCTV-styled videos...")
    
    for video_num in [2, 3, 4, 5]:
        frames_folder = frames_base / f"video_{video_num}"
        output_video = videos_output / f"video_{video_num}_cctv_styled.mp4"
        
        if not frames_folder.exists():
            logger.warning(f"Frames folder not found for video {video_num}")
            continue
        
        # Get all frames
        frame_files = sorted(
            list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
        )
        
        if len(frame_files) == 0:
            logger.warning(f"No frames found for video {video_num}")
            continue
        
        # Read first frame to get dimensions
        first_frame = cv2.imread(str(frame_files[0]))
        if first_frame is None:
            continue
        
        height, width = first_frame.shape[:2]
        
        # Create video writer (try different codecs)
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_video), fourcc, 5.0, (width, height))
        
        if not out.isOpened():
            # Try fallback codec
            fourcc = cv2.VideoWriter_fourcc(*'MJPG')
            out = cv2.VideoWriter(str(output_video), fourcc, 5.0, (width, height))
        
        frames_written = 0
        for frame_file in frame_files:
            frame = cv2.imread(str(frame_file))
            if frame is not None and frame.shape[:2] == (height, width):
                out.write(frame)
                frames_written += 1
        
        out.release()
        
        if frames_written > 0:
            logger.info(f"  [OK] video_{video_num}_cctv_styled.mp4 ({frames_written} frames)")
        else:
            logger.error(f"  [FAILED] Could not write frames for video_{video_num}")


def main():
    """Main execution"""
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    
    logger.info("="*70)
    logger.info("FINAL FACE ORGANIZATION AND CCTV VIDEO GENERATION")
    logger.info("="*70)
    
    # Step 1: Organize existing extracted faces
    organize_existing_extracted_faces(base_path)
    
    # Step 2: Extract faces from frames for videos 4 and 5
    extract_best_faces_from_frames(base_path)
    
    # Step 3: Generate CCTV videos
    generate_cctv_videos(base_path)
    
    logger.info("\n" + "="*70)
    logger.info("[OK] FACE ORGANIZATION AND VIDEO GENERATION COMPLETE!")
    logger.info("="*70)
    
    # Summary
    organized_path = base_path / "processed_output" / "faces_organized"
    logger.info("\nFinal Structure:")
    
    for video_folder in sorted(organized_path.iterdir()):
        if video_folder.is_dir():
            logger.info(f"\n{video_folder.name}:")
            for face_folder in sorted(video_folder.iterdir()):
                if face_folder.is_dir():
                    files = list(face_folder.glob("*.jpg")) + list(face_folder.glob("*.png"))
                    logger.info(f"  - {face_folder.name}: {len(files)} images")


if __name__ == "__main__":
    main()
