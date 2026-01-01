"""
Face Clustering Module
Groups similar faces together to identify unique individuals
"""

import cv2
import numpy as np
import os
from pathlib import Path
from sklearn.cluster import DBSCAN
import logging

logger = logging.getLogger(__name__)


class FaceClustering:
    """Cluster faces to group same person from different angles"""
    
    def __init__(self):
        """Initialize face clustering with feature extractor"""
        # Load pre-trained face detection and embedding model
        try:
            # Use OpenCV's DNN module for face detection
            self.net = cv2.dnn.readNetFromTensorflow(
                cv2.data.samples + 'opencv_face_detector_uint8.pb',
                cv2.data.samples + 'opencv_face_detector.pbtxt'
            )
            logger.info("[OK] Face detection model loaded")
        except:
            logger.warning("Could not load face detection model, using fallback")
            self.net = None
    
    def extract_face_features(self, face_image, use_histogram=True):
        """
        Extract features from face image for clustering
        
        Args:
            face_image: Face image
            use_histogram: Use histogram comparison or pixel features
        
        Returns:
            Feature vector
        """
        if face_image.shape[0] < 10 or face_image.shape[1] < 10:
            return None
        
        try:
            # Resize to standard size for feature extraction
            face_resized = cv2.resize(face_image, (100, 100))
            
            # Convert to grayscale
            gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
            
            if use_histogram:
                # Use histogram of gradients for face comparison
                # Calculate histogram of different regions
                features = []
                
                # Divide into 4x4 grid and calculate histogram for each cell
                cell_size = 25
                for i in range(0, 100, cell_size):
                    for j in range(0, 100, cell_size):
                        cell = gray[i:i+cell_size, j:j+cell_size]
                        hist = cv2.calcHist([cell], [0], None, [16], [0, 256])
                        features.extend(hist.flatten())
                
                return np.array(features).flatten()
            else:
                # Use simple flattened image features
                return gray.flatten()
        except Exception as e:
            logger.debug(f"Error extracting features: {e}")
            return None
    
    def compute_face_distance(self, features1, features2):
        """
        Compute distance between two face feature vectors
        
        Args:
            features1: First face features
            features2: Second face features
        
        Returns:
            Distance score (0-1, lower = more similar)
        """
        if features1 is None or features2 is None:
            return float('inf')
        
        # Normalize features
        f1 = features1 / (np.linalg.norm(features1) + 1e-8)
        f2 = features2 / (np.linalg.norm(features2) + 1e-8)
        
        # Compute cosine distance
        distance = 1 - np.dot(f1, f2)
        return distance
    
    def cluster_faces(self, face_images, eps=0.15, min_samples=1):
        """
        Cluster faces using DBSCAN based on feature similarity
        
        Args:
            face_images: List of face images (BGR)
            eps: Distance threshold for clustering
            min_samples: Minimum samples in cluster
        
        Returns:
            Cluster labels for each face
        """
        if len(face_images) == 0:
            return np.array([])
        
        # Extract features from all faces
        features_list = []
        valid_indices = []
        
        for idx, face_img in enumerate(face_images):
            features = self.extract_face_features(face_img)
            if features is not None:
                features_list.append(features)
                valid_indices.append(idx)
        
        if len(features_list) == 0:
            return np.zeros(len(face_images), dtype=int)
        
        # Stack features into matrix
        features_matrix = np.array(features_list)
        
        # Compute pairwise distances
        distances = np.zeros((len(features_list), len(features_list)))
        for i in range(len(features_list)):
            for j in range(i+1, len(features_list)):
                dist = self.compute_face_distance(features_list[i], features_list[j])
                distances[i, j] = dist
                distances[j, i] = dist
        
        # Cluster using DBSCAN
        try:
            clustering = DBSCAN(eps=eps, min_samples=min_samples, metric='precomputed')
            labels = clustering.fit_predict(distances)
        except Exception as e:
            logger.warning(f"DBSCAN clustering failed: {e}, using single cluster")
            labels = np.zeros(len(features_list), dtype=int)
        
        # Map back to original indices
        final_labels = -np.ones(len(face_images), dtype=int)
        for orig_idx, label in zip(valid_indices, labels):
            final_labels[orig_idx] = label
        
        return final_labels
    
    def cluster_faces_by_folder(self, video_folder_path, eps=0.15):
        """
        Load faces from folder, cluster them, and reorganize
        
        Args:
            video_folder_path: Path to folder with extracted faces
            eps: Distance threshold for clustering
        
        Returns:
            Dictionary mapping cluster IDs to face image paths
        """
        face_folder = Path(video_folder_path)
        if not face_folder.exists():
            logger.warning(f"Folder not found: {face_folder}")
            return {}
        
        # Load all face images
        face_files = list(face_folder.glob("*.jpg")) + list(face_folder.glob("*.png"))
        face_images = []
        valid_files = []
        
        for face_file in sorted(face_files):
            img = cv2.imread(str(face_file))
            if img is not None:
                face_images.append(img)
                valid_files.append(face_file)
        
        if len(face_images) == 0:
            logger.warning(f"No face images found in {face_folder}")
            return {}
        
        # Cluster faces
        labels = self.cluster_faces(face_images, eps=eps)
        
        # Group by cluster
        clusters = {}
        for face_file, label in zip(valid_files, labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(face_file)
        
        logger.info(f"Clustered {len(face_images)} faces into {len(set(labels))} groups")
        
        return clusters


class CCTVVideoGenerator:
    """Generate CCTV-styled video files from frames"""
    
    @staticmethod
    def generate_video_from_frames(frames_folder, output_video_path, fps=5.0):
        """
        Generate video from extracted frames
        
        Args:
            frames_folder: Folder containing frame images
            output_video_path: Output video file path
            fps: Frame rate for output video
        
        Returns:
            True if successful
        """
        frames_folder = Path(frames_folder)
        
        # Get all frames
        frame_files = sorted(
            list(frames_folder.glob("*.jpg")) + list(frames_folder.glob("*.png")),
            key=lambda x: int(x.stem.split('_')[-1]) if x.stem.split('_')[-1].isdigit() else 0
        )
        
        if len(frame_files) == 0:
            logger.warning(f"No frames found in {frames_folder}")
            return False
        
        # Read first frame to get dimensions
        first_frame = cv2.imread(str(frame_files[0]))
        if first_frame is None:
            logger.error("Could not read first frame")
            return False
        
        height, width = first_frame.shape[:2]
        
        # Create video writer
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(str(output_video_path), fourcc, fps, (width, height))
        
        if not out.isOpened():
            logger.error("Failed to create video writer")
            return False
        
        # Write frames
        frames_written = 0
        for frame_file in frame_files:
            frame = cv2.imread(str(frame_file))
            if frame is not None:
                out.write(frame)
                frames_written += 1
        
        out.release()
        
        logger.info(f"[OK] Generated video: {output_video_path} ({frames_written} frames)")
        return True


def reorganize_faces_by_cluster(base_path):
    """
    Reorganize extracted faces by clustering similar faces together
    
    Args:
        base_path: Base project path
    """
    base_path = Path(base_path)
    extracted_faces_folder = base_path / "processed_output" / "extracted_faces"
    organized_folder = base_path / "processed_output" / "faces_organized_by_person"
    
    organized_folder.mkdir(parents=True, exist_ok=True)
    
    clustering = FaceClustering()
    
    # Process each video folder
    for video_folder in sorted(extracted_faces_folder.iterdir()):
        if not video_folder.is_dir():
            continue
        
        video_name = video_folder.name
        logger.info(f"\nProcessing {video_name}...")
        
        # Cluster faces in this video
        clusters = clustering.cluster_faces_by_folder(video_folder, eps=0.15)
        
        # Create organized structure
        video_output = organized_folder / video_name
        video_output.mkdir(exist_ok=True)
        
        # Copy faces to person-specific folders
        import shutil
        for cluster_id, face_files in sorted(clusters.items()):
            # Determine if cluster ID is noise (-1) or valid cluster
            if cluster_id == -1:
                cluster_name = f"face_unknown"
            else:
                cluster_name = f"face_{cluster_id + 1}"
            
            face_folder = video_output / cluster_name
            face_folder.mkdir(exist_ok=True)
            
            # Copy all faces in this cluster
            for face_file in face_files:
                dest_file = face_folder / face_file.name
                shutil.copy(str(face_file), str(dest_file))
            
            logger.info(f"  [OK] {cluster_name}: {len(face_files)} face images")
        
        logger.info(f"[OK] {video_name}: Organized into {len(clusters)} unique faces")


def generate_all_cctv_videos(base_path):
    """
    Generate CCTV-styled videos from extracted frames
    
    Args:
        base_path: Base project path
    """
    base_path = Path(base_path)
    frames_folder = base_path / "processed_output" / "frames"
    videos_folder = base_path / "processed_output" / "cctv_styled_videos"
    
    videos_folder.mkdir(parents=True, exist_ok=True)
    
    logger.info("\nGenerating CCTV-styled videos from frames...")
    
    # Generate video for each video source
    for video_source_folder in sorted(frames_folder.iterdir()):
        if not video_source_folder.is_dir():
            continue
        
        video_name = video_source_folder.name  # e.g., "video_2"
        output_video = videos_folder / f"{video_name}_cctv_styled.mp4"
        
        logger.info(f"Generating {video_name} video...")
        success = CCTVVideoGenerator.generate_video_from_frames(
            video_source_folder,
            output_video,
            fps=5.0
        )
        
        if success:
            logger.info(f"[OK] {output_video}")
        else:
            logger.error(f"[FAILED] Could not generate {output_video}")


if __name__ == "__main__":
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    import sys
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    
    logger.info("="*70)
    logger.info("STEP 1: Reorganize faces by clustering unique individuals")
    logger.info("="*70)
    reorganize_faces_by_cluster(base_path)
    
    logger.info("\n" + "="*70)
    logger.info("STEP 2: Generate CCTV-styled videos")
    logger.info("="*70)
    generate_all_cctv_videos(base_path)
    
    logger.info("\n" + "="*70)
    logger.info("[OK] Face clustering and video generation complete!")
    logger.info("="*70)
