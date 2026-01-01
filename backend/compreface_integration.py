"""
CompreFace Integration Module for CCTV Anomaly Detection
Provides REST API client for CompreFace face recognition services
"""

import requests
import json
import numpy as np
import cv2
from typing import List, Dict, Tuple, Optional
from pathlib import Path
import time
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class FaceDetection:
    """Face detection result from CompreFace"""
    x: int
    y: int
    width: int
    height: int
    confidence: float
    
@dataclass
class RecognitionResult:
    """Face recognition result"""
    face_id: str
    employee_id: str
    confidence: float
    box: FaceDetection

class CompreFaceIntegration:
    """
    Integration with CompreFace API for face detection and recognition
    Handles video frame processing and anomaly detection
    """
    
    def __init__(self, compreface_url: str = "http://localhost:8000"):
        """
        Initialize CompreFace integration
        
        Args:
            compreface_url: CompreFace API server URL
        """
        self.compreface_url = compreface_url
        self.api_key = None
        self.service_ids = {}
        self.face_collection = {}
        self.session = requests.Session()
        self.timeout = 30
        
    def is_available(self) -> bool:
        """Check if CompreFace service is available"""
        try:
            response = self.session.get(
                f"{self.compreface_url}/docs",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"CompreFace not available: {e}")
            return False
    
    def detect_faces_in_frame(self, frame: np.ndarray) -> List[FaceDetection]:
        """
        Detect faces in a video frame using CompreFace
        
        Args:
            frame: Video frame as numpy array (BGR format)
            
        Returns:
            List of detected faces with coordinates
        """
        try:
            # Encode frame to JPEG
            success, image_data = cv2.imencode('.jpg', frame)
            if not success:
                return []
            
            # Send to CompreFace detection endpoint
            files = {'file': ('frame.jpg', image_data.tobytes(), 'image/jpeg')}
            response = self.session.post(
                f"{self.compreface_url}/api/v1/detection/detect",
                files=files,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                detections = []
                result = response.json()
                
                for face in result.get('result', []):
                    box = face.get('box', {})
                    detection = FaceDetection(
                        x=max(0, int(box.get('x', 0))),
                        y=max(0, int(box.get('y', 0))),
                        width=max(1, int(box.get('width', 1))),
                        height=max(1, int(box.get('height', 1))),
                        confidence=float(face.get('confidence', 0.0))
                    )
                    if detection.confidence > 0.5:  # Confidence threshold
                        detections.append(detection)
                
                return detections
                
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return []
    
    def recognize_face(
        self, 
        frame: np.ndarray, 
        face_box: FaceDetection,
        known_faces_db: Dict[str, np.ndarray]
    ) -> Optional[RecognitionResult]:
        """
        Recognize a face against known faces database
        
        Args:
            frame: Full video frame
            face_box: Detected face coordinates
            known_faces_db: Dictionary of employee_id -> face embeddings
            
        Returns:
            Recognition result with matched employee or None
        """
        try:
            # Extract face region
            x1 = max(0, face_box.x)
            y1 = max(0, face_box.y)
            x2 = min(frame.shape[1], face_box.x + face_box.width)
            y2 = min(frame.shape[0], face_box.y + face_box.height)
            
            if x2 <= x1 or y2 <= y1:
                return None
                
            face_region = frame[y1:y2, x1:x2]
            
            # Get face embedding from CompreFace
            success, image_data = cv2.imencode('.jpg', face_region)
            if not success:
                return None
            
            files = {'file': ('face.jpg', image_data.tobytes(), 'image/jpeg')}
            response = self.session.post(
                f"{self.compreface_url}/api/v1/recognition/recognize",
                files=files,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                embeddings = result.get('result', {}).get('embeddings', [])
                
                if embeddings:
                    # Compare with known faces
                    best_match = self._find_best_match(
                        embeddings[0],
                        known_faces_db
                    )
                    
                    if best_match:
                        employee_id, confidence = best_match
                        return RecognitionResult(
                            face_id=f"face_{int(time.time()*1000)}",
                            employee_id=employee_id,
                            confidence=confidence,
                            box=face_box
                        )
            
        except Exception as e:
            logger.error(f"Face recognition error: {e}")
            
        return None
    
    def _find_best_match(
        self, 
        embedding: List[float],
        known_faces_db: Dict[str, np.ndarray],
        threshold: float = 0.6
    ) -> Optional[Tuple[str, float]]:
        """
        Find best matching face in known database
        
        Args:
            embedding: Face embedding vector
            known_faces_db: Dictionary of known faces
            threshold: Similarity threshold
            
        Returns:
            Tuple of (employee_id, confidence) or None
        """
        if not known_faces_db:
            return None
            
        embedding = np.array(embedding)
        best_match_id = None
        best_confidence = 0.0
        
        for employee_id, known_embedding in known_faces_db.items():
            # Calculate cosine similarity
            similarity = self._cosine_similarity(embedding, known_embedding)
            
            if similarity > best_confidence:
                best_confidence = similarity
                best_match_id = employee_id
        
        # Return if above threshold
        if best_confidence > threshold:
            return (best_match_id, best_confidence)
            
        return None
    
    @staticmethod
    def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        try:
            if len(a) == 0 or len(b) == 0:
                return 0.0
            
            a = np.array(a).flatten()
            b = np.array(b).flatten()
            
            norm_a = np.linalg.norm(a)
            norm_b = np.linalg.norm(b)
            
            if norm_a == 0 or norm_b == 0:
                return 0.0
                
            return float(np.dot(a, b) / (norm_a * norm_b))
        except:
            return 0.0
    
    def process_video_frame_batch(
        self,
        frames: List[np.ndarray],
        known_faces_db: Dict[str, np.ndarray]
    ) -> List[Dict]:
        """
        Process batch of video frames for face detection and recognition
        
        Args:
            frames: List of video frames
            known_faces_db: Database of known employee faces
            
        Returns:
            List of detection results per frame
        """
        results = []
        
        for frame_idx, frame in enumerate(frames):
            frame_result = {
                'frame_index': frame_idx,
                'detections': [],
                'timestamp': time.time()
            }
            
            # Detect faces
            detections = self.detect_faces_in_frame(frame)
            
            for detection in detections:
                # Recognize face
                recognition = self.recognize_face(frame, detection, known_faces_db)
                
                detection_data = {
                    'box': {
                        'x': detection.x,
                        'y': detection.y,
                        'width': detection.width,
                        'height': detection.height
                    },
                    'confidence': detection.confidence,
                    'recognized': False
                }
                
                if recognition:
                    detection_data['recognized'] = True
                    detection_data['employee_id'] = recognition.employee_id
                    detection_data['match_confidence'] = recognition.confidence
                
                frame_result['detections'].append(detection_data)
            
            results.append(frame_result)
        
        return results
    
    def extract_and_store_face(
        self,
        frame: np.ndarray,
        face_box: FaceDetection,
        employee_id: str
    ) -> Optional[np.ndarray]:
        """
        Extract and store face embedding for employee
        
        Args:
            frame: Video frame
            face_box: Face detection box
            employee_id: Employee ID
            
        Returns:
            Face embedding vector or None
        """
        try:
            x1 = max(0, face_box.x)
            y1 = max(0, face_box.y)
            x2 = min(frame.shape[1], face_box.x + face_box.width)
            y2 = min(frame.shape[0], face_box.y + face_box.height)
            
            face_region = frame[y1:y2, x1:x2]
            
            success, image_data = cv2.imencode('.jpg', face_region)
            if not success:
                return None
            
            files = {'file': ('face.jpg', image_data.tobytes(), 'image/jpeg')}
            response = self.session.post(
                f"{self.compreface_url}/api/v1/recognition/recognize",
                files=files,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                embeddings = result.get('result', {}).get('embeddings', [])
                
                if embeddings:
                    embedding = np.array(embeddings[0])
                    return embedding
                    
        except Exception as e:
            logger.error(f"Face extraction error: {e}")
        
        return None
    
    def detect_anomalies(
        self,
        frame_results: List[Dict],
        authorized_zones: Dict[str, List[str]],
        risk_scores: Dict[str, float]
    ) -> Dict:
        """
        Detect anomalies based on zone access and risk profiles
        
        Args:
            frame_results: Detection results from process_video_frame_batch
            authorized_zones: Dict of zone_id -> list of authorized employee_ids
            risk_scores: Dict of employee_id -> risk_score
            
        Returns:
            Anomaly detection results
        """
        anomalies = []
        total_faces = 0
        recognized_faces = 0
        
        for frame_result in frame_results:
            for detection in frame_result['detections']:
                total_faces += 1
                
                if detection['recognized']:
                    recognized_faces += 1
                    employee_id = detection['employee_id']
                    confidence = detection['match_confidence']
                    
                    # Check risk score
                    risk = risk_scores.get(employee_id, 50)
                    
                    # Flag high-risk individuals
                    if risk > 70:
                        anomalies.append({
                            'type': 'HIGH_RISK_DETECTED',
                            'employee_id': employee_id,
                            'risk_score': risk,
                            'confidence': confidence,
                            'frame_index': frame_result['frame_index']
                        })
                    
                    # Check unauthorized access to restricted zones
                    for zone_id, authorized_users in authorized_zones.items():
                        if employee_id not in authorized_users and risk > 60:
                            anomalies.append({
                                'type': 'UNAUTHORIZED_ZONE_ACCESS',
                                'employee_id': employee_id,
                                'zone_id': zone_id,
                                'risk_score': risk,
                                'authorized_users': len(authorized_users),
                                'frame_index': frame_result['frame_index']
                            })
        
        return {
            'total_frames': len(frame_results),
            'total_faces_detected': total_faces,
            'faces_recognized': recognized_faces,
            'anomalies_found': len(anomalies),
            'anomalies': anomalies,
            'anomaly_rate': (len(anomalies) / max(recognized_faces, 1)) * 100 if recognized_faces > 0 else 0
        }

