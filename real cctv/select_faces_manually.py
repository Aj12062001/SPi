"""
Manual Face Selection and Organization Script
Selects specific frames with clear faces and organizes them by person
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


def detect_faces_in_frame(frame, min_size=(30, 30)):
    """Detect faces in a frame"""
    face_cascade = cv2.CascadeClassifier(
        cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
    )
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 5, minSize=min_size)
    return faces


def extract_clear_faces_from_frames(video_num, num_faces_needed, output_folder, base_path):
    """
    Extract clear faces from frames for a specific video
    
    Args:
        video_num: Video number (2, 3, 4, 5)
        num_faces_needed: Number of unique faces to extract
        output_folder: Folder to save organized faces
        base_path: Base project path
    """
    base_path = Path(base_path)
    frames_folder = base_path / "processed_output" / "frames" / f"video_{video_num}"
    
    if not frames_folder.exists():
        logger.warning(f"Frames folder not found: {frames_folder}")
        return
    
    # Get all frames
    frame_files = sorted(
        list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png"))
    )
    
    logger.info(f"\nProcessing Video {video_num}: Looking for {num_faces_needed} unique faces")
    logger.info(f"Scanning {len(frame_files)} frames...")
    
    # Dictionary to store detected unique faces
    unique_faces = {}
    face_detection_info = {}
    
    # Scan frames and detect faces
    for frame_idx, frame_file in enumerate(frame_files):
        frame = cv2.imread(str(frame_file))
        if frame is None:
            continue
        
        faces = detect_faces_in_frame(frame)
        
        if len(faces) > 0:
            # Store info about each face detected
            face_detection_info[frame_file] = {
                'num_faces': len(faces),
                'face_coords': faces
            }
            
            # Try to determine which faces are new individuals
            for face_idx, (x, y, w, h) in enumerate(faces):
                # Extract face region
                face_crop = frame[max(0, y-10):min(frame.shape[0], y+h+10), 
                                 max(0, x-10):min(frame.shape[1], x+w+10)].copy()
                
                if face_crop.shape[0] < 20 or face_crop.shape[1] < 20:
                    continue
                
                # Store this face with its frame and index
                face_id = len(unique_faces)
                if face_id < num_faces_needed:
                    unique_faces[face_id] = {
                        'frames': [frame_file],
                        'face_crops': [face_crop],
                        'avg_size': (w, h)
                    }
    
    logger.info(f"Detected faces in {len(face_detection_info)} frames")
    
    # Now scan again to find multiple angles of same faces
    for frame_idx, frame_file in enumerate(frame_files):
        frame = cv2.imread(str(frame_file))
        if frame is None:
            continue
        
        if frame_file not in face_detection_info:
            continue
        
        faces = face_detection_info[frame_file]['face_coords']
        
        # For each detected face
        for face_idx, (x, y, w, h) in enumerate(faces):
            face_crop = frame[max(0, y-10):min(frame.shape[0], y+h+10), 
                             max(0, x-10):min(frame.shape[1], x+w+10)].copy()
            
            if face_crop.shape[0] < 20 or face_crop.shape[1] < 20:
                continue
            
            # Try to match to existing faces
            assigned = False
            for face_id in range(min(num_faces_needed, len(unique_faces))):
                if face_id in unique_faces:
                    unique_faces[face_id]['frames'].append(frame_file)
                    unique_faces[face_id]['face_crops'].append(face_crop)
                    assigned = True
                    
                    # Only collect up to 10 angles per face
                    if len(unique_faces[face_id]['frames']) >= 10:
                        # Check if we have enough for next face
                        if len(unique_faces) < num_faces_needed:
                            break
                    break
            
            # If not assigned to existing face and we need more faces
            if not assigned and len(unique_faces) < num_faces_needed:
                unique_faces[len(unique_faces)] = {
                    'frames': [frame_file],
                    'face_crops': [face_crop],
                    'avg_size': (w, h)
                }
    
    logger.info(f"Identified {len(unique_faces)} unique faces")
    
    # Save organized faces
    output_folder = Path(output_folder)
    output_folder.mkdir(parents=True, exist_ok=True)
    
    for face_id in sorted(unique_faces.keys()):
        if face_id >= num_faces_needed:
            break
        
        face_info = unique_faces[face_id]
        face_folder = output_folder / f"face_{face_id + 1}"
        face_folder.mkdir(exist_ok=True)
        
        # Save face crops
        for crop_idx, face_crop in enumerate(face_info['face_crops'][:10]):  # Max 10 angles
            output_file = face_folder / f"face_{face_id + 1}_angle_{crop_idx + 1}.jpg"
            cv2.imwrite(str(output_file), face_crop)
        
        logger.info(f"  [OK] Face {face_id + 1}: {len(face_info['face_crops'])} angles saved")
    
    return unique_faces


def main():
    """Main execution"""
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    organized_faces_folder = base_path / "processed_output" / "faces_selected"
    
    logger.info("="*70)
    logger.info("MANUAL FACE SELECTION FROM FRAMES")
    logger.info("="*70)
    
    # Configuration per video
    videos_config = {
        2: {'num_faces': 2, 'description': '2 faces'},
        3: {'num_faces': 3, 'description': '3 faces'},
        4: {'num_faces': 2, 'description': '2 faces (1 man, 1 woman)'},
        5: {'num_faces': 3, 'description': '3 faces (2 men, 1 woman)'}
    }
    
    # Process each video
    for video_num in sorted(videos_config.keys()):
        config = videos_config[video_num]
        output_path = organized_faces_folder / f"video_{video_num}"
        
        logger.info(f"\n[VIDEO {video_num}] Extracting {config['description']}...")
        
        extract_clear_faces_from_frames(
            video_num,
            config['num_faces'],
            output_path,
            base_path
        )
    
    logger.info("\n" + "="*70)
    logger.info("[OK] Face selection complete!")
    logger.info(f"Organized faces saved to: {organized_faces_folder}")
    logger.info("="*70)
    
    # Summary
    logger.info("\nOrganz Structure Created:")
    for video_folder in sorted(organized_faces_folder.iterdir()):
        if video_folder.is_dir():
            logger.info(f"\n{video_folder.name}:")
            for face_folder in sorted(video_folder.iterdir()):
                if face_folder.is_dir():
                    files = list(face_folder.glob("*.jpg")) + list(face_folder.glob("*.png"))
                    logger.info(f"  - {face_folder.name}: {len(files)} images")


if __name__ == "__main__":
    main()
