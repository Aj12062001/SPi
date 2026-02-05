"""
CCTV Video Processing Pipeline
Processes video footage to extract frames and detect employee faces for SPI (Security Prediction Intelligence)
"""

import cv2
import os
import sys
import numpy as np
from pathlib import Path
from datetime import datetime
import logging
import mediapipe as mp
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class CCTVVideoProcessor:
    """Process CCTV videos, extract frames, and detect faces"""
    
    def __init__(self, base_path):
        """
        Initialize the video processor
        
        Args:
            base_path: Base directory containing video and output folders
        """
        self.base_path = Path(base_path)
        self.video_folder = self.base_path / "video"
        self.output_base = self.base_path / "processed_output"
        self.frames_folder = self.output_base / "frames"
        self.faces_folder = self.output_base / "extracted_faces"
        self.cctv_styled_folder = self.output_base / "cctv_styled_videos"
        
        # Create output directories
        self._create_output_directories()
        
        # Initialize MediaPipe Face Detector with high confidence threshold
        model_path = self.base_path / "blaze_face_short_range.tflite"
        if not model_path.exists():
            logger.error(f"MediaPipe model not found: {model_path}")
            raise FileNotFoundError(f"Please download the face detection model to {model_path}")
        
        base_options = python.BaseOptions(model_asset_path=str(model_path))
        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=0.9,
            min_suppression_threshold=0.3
        )
        self.face_detector = vision.FaceDetector.create_from_options(options)
        
        logger.info("MediaPipe Face Detection initialized with confidence threshold: 0.9")
    
    def _create_output_directories(self):
        """Create all necessary output directories"""
        self.frames_folder.mkdir(parents=True, exist_ok=True)
        self.faces_folder.mkdir(parents=True, exist_ok=True)
        self.cctv_styled_folder.mkdir(parents=True, exist_ok=True)
        logger.info(f"Output directories created at {self.output_base}")
    
    def analyze_reference_video(self, video_num=1):
        """
        Analyze the reference CCTV video (video 1) to understand its characteristics
        
        Args:
            video_num: Video number to analyze (default 1)
        
        Returns:
            Dictionary with video characteristics
        """
        video_path = self.video_folder / f"{video_num}.mp4"
        
        if not video_path.exists():
            logger.error(f"Reference video not found: {video_path}")
            return None
        
        cap = cv2.VideoCapture(str(video_path))
        
        properties = {
            'fps': cap.get(cv2.CAP_PROP_FPS),
            'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
            'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
            'total_frames': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
            'duration_seconds': int(cap.get(cv2.CAP_PROP_FRAME_COUNT) / cap.get(cv2.CAP_PROP_FPS))
        }
        
        cap.release()
        
        logger.info(f"Reference Video (video {video_num}) Properties:")
        logger.info(f"  Resolution: {properties['width']}x{properties['height']}")
        logger.info(f"  FPS: {properties['fps']}")
        logger.info(f"  Total Frames: {properties['total_frames']}")
        logger.info(f"  Duration: {properties['duration_seconds']} seconds")
        
        return properties
    
    def apply_cctv_style(self, frame, brightness_adjustment=1.1, contrast_adjustment=1.2):
        """
        Apply CCTV footage styling to a frame
        - Add timestamp
        - Adjust brightness and contrast
        - Add slight blur/noise for realism
        - Add CCTV information overlay
        
        Args:
            frame: Input frame
            brightness_adjustment: Brightness multiplier
            contrast_adjustment: Contrast multiplier
        
        Returns:
            Styled frame
        """
        # Convert to float for processing
        frame_float = frame.astype(np.float32) / 255.0
        
        # Apply contrast
        frame_float = frame_float * contrast_adjustment
        frame_float = np.clip(frame_float, 0, 1)
        
        # Apply brightness
        frame_float = frame_float * brightness_adjustment
        frame_float = np.clip(frame_float, 0, 1)
        
        # Convert back to uint8
        frame = (frame_float * 255).astype(np.uint8)
        
        # Add slight Gaussian blur for CCTV-like quality
        frame = cv2.GaussianBlur(frame, (3, 3), 0)
        
        # Add noise (optional, for realism)
        noise = np.random.normal(0, 2, frame.shape)
        frame = np.clip(frame.astype(np.float32) + noise, 0, 255).astype(np.uint8)
        
        return frame
    
    def add_timestamp_overlay(self, frame, timestamp_text=None):
        """
        Add timestamp overlay to frame
        
        Args:
            frame: Input frame
            timestamp_text: Timestamp string
        
        Returns:
            Frame with timestamp
        """
        if timestamp_text is None:
            timestamp_text = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Add white background for timestamp
        cv2.rectangle(frame, (10, 10), (350, 50), (0, 0, 0), -1)
        cv2.putText(frame, timestamp_text, (20, 35),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Add camera ID
        cv2.rectangle(frame, (10, 60), (150, 100), (0, 0, 0), -1)
        cv2.putText(frame, "CAMERA 1", (20, 85),
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
        
        return frame
    
    def extract_frames_from_video(self, video_num, frame_interval=5, add_overlay=True):
        """
        Extract frames from a video and apply CCTV styling
        
        Args:
            video_num: Video number to process
            frame_interval: Extract every nth frame (to reduce storage)
            add_overlay: Whether to add timestamp overlay
        
        Returns:
            List of extracted frame paths
        """
        video_path = self.video_folder / f"{video_num}.mp4"
        
        if not video_path.exists():
            logger.error(f"Video not found: {video_path}")
            return []
        
        logger.info(f"Processing video {video_num}...")
        
        cap = cv2.VideoCapture(str(video_path))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        video_frames_folder = self.frames_folder / f"video_{video_num}"
        video_frames_folder.mkdir(parents=True, exist_ok=True)
        
        frame_count = 0
        extracted_frames = 0
        frame_paths = []
        
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Extract every nth frame
            if frame_count % frame_interval == 0:
                # Apply CCTV styling
                styled_frame = self.apply_cctv_style(frame)
                
                # Add timestamp overlay
                if add_overlay:
                    frame_time = frame_count / fps
                    minutes = int(frame_time // 60)
                    seconds = int(frame_time % 60)
                    timestamp = f"{minutes:02d}:{seconds:02d} - Video {video_num}"
                    styled_frame = self.add_timestamp_overlay(styled_frame, timestamp)
                
                # Save frame
                frame_filename = f"frame_{extracted_frames:06d}.jpg"
                frame_path = video_frames_folder / frame_filename
                cv2.imwrite(str(frame_path), styled_frame)
                frame_paths.append(frame_path)
                extracted_frames += 1
                
                if extracted_frames % 100 == 0:
                    logger.info(f"  Extracted {extracted_frames} frames from video {video_num}")
            
            frame_count += 1
        
        cap.release()
        logger.info(f"[OK] Video {video_num}: Extracted {extracted_frames} frames -> {video_frames_folder}")
        
        return frame_paths
    
    def preprocess_frame(self, frame):
        """
        Preprocess frame to reduce false positives
        - Convert to grayscale
        - Apply Gaussian blur
        - Normalize contrast
        
        Args:
            frame: Input frame (BGR)
        
        Returns:
            Preprocessed frame (BGR)
        """
        # Convert to LAB color space for better lighting normalization
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        
        # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        lab[:, :, 0] = clahe.apply(lab[:, :, 0])
        
        # Convert back to BGR
        normalized = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # Apply mild Gaussian blur to reduce reflections
        blurred = cv2.GaussianBlur(normalized, (5, 5), 0)
        
        return blurred
    
    def validate_face_geometry(self, x, y, w, h, frame_shape):
        """
        Validate face bounding box geometry
        
        Args:
            x, y, w, h: Bounding box coordinates
            frame_shape: Shape of the frame (height, width, channels)
        
        Returns:
            True if valid face geometry, False otherwise
        """
        frame_height, frame_width = frame_shape[:2]
        
        # Rule 1: Minimum size (reject small detections)
        if w < 60 or h < 60:
            return False
        
        # Rule 2: Aspect ratio check (faces are roughly square)
        aspect_ratio = w / h
        if aspect_ratio < 0.8 or aspect_ratio > 1.3:
            return False
        
        # Rule 3: Minimum area (reject tiny detections)
        face_area = w * h
        frame_area = frame_width * frame_height
        if face_area < 0.01 * frame_area:  # Face must be at least 1% of frame
            return False
        
        return True
    
    def verify_facial_landmarks(self, keypoints, bbox_width, bbox_height):
        """
        Verify that detection has proper facial landmarks
        MediaPipe provides 6 key points: right eye, left eye, nose tip, mouth center, right ear, left ear
        
        Args:
            keypoints: List of keypoints from MediaPipe detection
            bbox_width: Bounding box width
            bbox_height: Bounding box height
        
        Returns:
            True if landmarks are valid, False otherwise
        """
        # MediaPipe face detection provides 6 key points
        if not keypoints or len(keypoints) < 4:
            return False
        
        # Extract landmark positions (normalized to bbox)
        landmarks = [(kp.x, kp.y) for kp in keypoints]
        
        # Verify landmarks are within reasonable positions
        # (eyes above nose, nose above mouth, etc.)
        if len(landmarks) >= 4:
            right_eye = landmarks[0]
            left_eye = landmarks[1]
            nose = landmarks[2]
            mouth = landmarks[3]
            
            # Nose should be below eyes
            if nose[1] <= min(right_eye[1], left_eye[1]):
                return False
            
            # Mouth should be below nose
            if mouth[1] <= nose[1]:
                return False
            
            # Eye height difference should not be too large (tilted faces)
            eye_distance = abs(right_eye[0] - left_eye[0])
            eye_height_diff = abs(right_eye[1] - left_eye[1])
            if eye_distance > 0.01 and eye_height_diff / eye_distance > 0.3:
                return False
        
        return True
    
    def detect_faces_in_frame(self, frame):
        """
        Detect faces in a frame using MediaPipe with strict validation
        
        Args:
            frame: Input frame (BGR)
        
        Returns:
            List of face detections [(x, y, w, h), ...]
        """
        faces = []
        
        # Step 1: Preprocess frame
        preprocessed = self.preprocess_frame(frame)
        
        # Step 2: Convert to RGB (MediaPipe requires RGB)
        frame_rgb = cv2.cvtColor(preprocessed, cv2.COLOR_BGR2RGB)
        
        # Step 3: Create MediaPipe Image object
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
        
        # Step 4: Detect faces with MediaPipe
        detection_result = self.face_detector.detect(mp_image)
        
        if not detection_result.detections:
            return faces
        
        frame_height, frame_width = frame.shape[:2]
        
        # Step 5: Process each detection with validation
        for detection in detection_result.detections:
            # Get confidence score
            confidence = detection.categories[0].score
            
            # Confidence threshold already applied in detector (0.9)
            # Get bounding box
            bbox = detection.bounding_box
            x = int(bbox.origin_x)
            y = int(bbox.origin_y)
            w = int(bbox.width)
            h = int(bbox.height)
            
            # Ensure coordinates are within frame
            x = max(0, x)
            y = max(0, y)
            w = min(w, frame_width - x)
            h = min(h, frame_height - y)
            
            # Step 6: Validate geometry
            if not self.validate_face_geometry(x, y, w, h, frame.shape):
                continue
            
            # Step 7: Verify facial landmarks if available
            if hasattr(detection, 'keypoints') and detection.keypoints:
                if not self.verify_facial_landmarks(detection.keypoints, w, h):
                    continue
            
            # All validations passed - add to faces list
            faces.append([x, y, w, h])
            logger.debug(f"Valid face detected: confidence={confidence:.2f}, bbox=({x},{y},{w},{h})")
        
        return faces
    
    def _remove_duplicate_faces(self, faces, threshold=30):
        """
        Remove duplicate/overlapping face detections
        
        Args:
            faces: List of face bounding boxes
            threshold: Overlap threshold in pixels
        
        Returns:
            Filtered list of faces
        """
        if len(faces) == 0:
            return faces
        
        # Sort by area (largest first)
        faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
        
        filtered_faces = []
        for face in faces:
            x1, y1, w1, h1 = face
            is_duplicate = False
            
            for fx, fy, fw, fh in filtered_faces:
                # Calculate overlap
                x_overlap = max(0, min(x1 + w1, fx + fw) - max(x1, fx))
                y_overlap = max(0, min(y1 + h1, fy + fh) - max(y1, fy))
                overlap_area = x_overlap * y_overlap
                
                if overlap_area > threshold * threshold:
                    is_duplicate = True
                    break
            
            if not is_duplicate:
                filtered_faces.append(face)
        
        return filtered_faces
    
    def extract_face_images(self, frame, faces, video_num, frame_num, padding=20):
        """
        Extract individual face images from frame
        
        Args:
            frame: Input frame
            faces: List of face detections
            video_num: Source video number
            frame_num: Frame number
            padding: Padding around face
        
        Returns:
            List of extracted face images
        """
        extracted_faces = []
        
        for face_idx, (x, y, w, h) in enumerate(faces):
            # Add padding
            x = max(0, x - padding)
            y = max(0, y - padding)
            w = min(frame.shape[1] - x, w + 2 * padding)
            h = min(frame.shape[0] - y, h + 2 * padding)
            
            # Extract face region
            face_img = frame[y:y+h, x:x+w].copy()
            
            # Ensure minimum size
            if face_img.shape[0] > 10 and face_img.shape[1] > 10:
                extracted_faces.append(face_img)
        
        return extracted_faces
    
    def save_face_images(self, faces, video_num, frame_num, min_face_size=20):
        """
        Save extracted face images to disk
        
        Args:
            faces: List of face images
            video_num: Source video number
            frame_num: Frame number
            min_face_size: Minimum face size in pixels
        
        Returns:
            Number of saved faces
        """
        saved_count = 0
        
        # Create video-specific folder
        video_faces_folder = self.faces_folder / f"video_{video_num}"
        video_faces_folder.mkdir(parents=True, exist_ok=True)
        
        for face_idx, face_img in enumerate(faces):
            # Filter by size
            if face_img.shape[0] < min_face_size or face_img.shape[1] < min_face_size:
                continue
            
            # Save face image
            face_filename = f"face_v{video_num}_f{frame_num:06d}_{face_idx}.jpg"
            face_path = video_faces_folder / face_filename
            
            # Enhance face image for better face recognition
            enhanced_face = self._enhance_face_image(face_img)
            cv2.imwrite(str(face_path), enhanced_face)
            saved_count += 1
        
        return saved_count
    
    def _enhance_face_image(self, face_img):
        """
        Enhance face image for better face recognition
        
        Args:
            face_img: Face image
        
        Returns:
            Enhanced face image
        """
        # Equalize histogram for better contrast
        if len(face_img.shape) == 3:
            # Convert BGR to LAB
            lab = cv2.cvtColor(face_img, cv2.COLOR_BGR2LAB)
            # Equalize only the L channel
            lab[:,:,0] = cv2.equalizeHist(lab[:,:,0])
            # Convert back to BGR
            face_img = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        else:
            face_img = cv2.equalizeHist(face_img)
        
        return face_img
    
    def process_all_videos(self, frame_interval=30, start_video=2, end_video=5):
        """
        Process all videos (2-5) to extract frames and faces
        
        Args:
            frame_interval: Extract every nth frame (30=1 FPS for 30fps video)
            start_video: Starting video number
            end_video: Ending video number
        """
        # First analyze reference video
        ref_properties = self.analyze_reference_video(video_num=1)
        
        total_frames_processed = 0
        total_faces_extracted = 0
        
        # Process videos 2-5
        for video_num in range(start_video, end_video + 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"Processing Video {video_num}")
            logger.info(f"{'='*60}")
            
            # Extract frames
            frame_paths = self.extract_frames_from_video(video_num, frame_interval, add_overlay=True)
            total_frames_processed += len(frame_paths)
            
            logger.info(f"Detecting and extracting faces from video {video_num}...")
            
            video_faces_count = 0
            frames_with_faces = 0
            
            # Detect faces in extracted frames
            for frame_idx, frame_path in enumerate(frame_paths):
                frame = cv2.imread(str(frame_path))
                if frame is None:
                    continue
                
                faces = self.detect_faces_in_frame(frame)
                
                if len(faces) > 0:
                    # Extract and save faces
                    face_images = self.extract_face_images(frame, faces, video_num, frame_idx)
                    saved_count = self.save_face_images(face_images, video_num, frame_idx)
                    video_faces_count += saved_count
                    frames_with_faces += 1
                
                if (frame_idx + 1) % 50 == 0:
                    logger.info(f"  Processed {frame_idx + 1}/{len(frame_paths)} frames")
            
            total_faces_extracted += video_faces_count
            logger.info(f"[OK] Video {video_num}: Detected {video_faces_count} faces in {frames_with_faces} frames")
        
        # Print summary
        logger.info(f"\n{'='*60}")
        logger.info(f"PROCESSING COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"Total frames processed: {total_frames_processed}")
        logger.info(f"Total faces extracted: {total_faces_extracted}")
        logger.info(f"Output location: {self.output_base}")
        logger.info(f"  - Frames: {self.frames_folder}")
        logger.info(f"  - Faces: {self.faces_folder}")


def main():
    """Main execution function"""
    base_path = r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv"
    
    processor = CCTVVideoProcessor(base_path)
    # Extract 1 frame per second (30 frames interval for 30fps video)
    processor.process_all_videos(frame_interval=30, start_video=2, end_video=5)


if __name__ == "__main__":
    main()
