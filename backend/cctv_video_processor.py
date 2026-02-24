"""
CCTV Video Processing Module using CompreFace
Handles video frame extraction, processing, and anomaly detection
"""

import cv2
import numpy as np
from typing import List, Dict, Optional, Tuple
from pathlib import Path
import logging
from dataclasses import dataclass, asdict
import json

logger = logging.getLogger(__name__)

@dataclass
class VideoAnalysisResult:
    """Complete video analysis result"""
    video_path: str
    total_frames: int
    fps: float
    duration_seconds: float
    faces_detected: int
    faces_recognized: int
    anomalies_count: int
    anomalies: List[Dict]
    frame_results: List[Dict]
    summary: Dict

class CCTVVideoProcessor:
    """
    Process CCTV video files for face detection and anomaly detection
    Uses CompreFace for optimal recognition and CompreFace-derived analysis
    """
    
    def __init__(self, compreface_integration, max_frames: int = 500):
        """
        Initialize video processor
        
        Args:
            compreface_integration: CompreFaceIntegration instance
            max_frames: Maximum frames to process per video
        """
        self.compreface = compreface_integration
        self.max_frames = max_frames
        
    def extract_frames_from_video(
        self, 
        video_path: str,
        sample_rate: int = 5
    ) -> Tuple[List[np.ndarray], Dict]:
        """
        Extract frames from video file
        
        Args:
            video_path: Path to video file
            sample_rate: Extract every nth frame
            
        Returns:
            Tuple of (frame_list, video_info)
        """
        try:
            video_path = Path(video_path)
            if not video_path.exists():
                raise FileNotFoundError(f"Video file not found: {video_path}")
            
            cap = cv2.VideoCapture(str(video_path))
            if not cap.isOpened():
                raise IOError(f"Cannot open video: {video_path}")
            
            # Get video properties
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = int(cap.get(cv2.CAP_PROP_FPS)) or 25
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            
            frames = []
            frame_indices = []
            frame_count = 0
            extracted_count = 0
            
            while extracted_count < self.max_frames:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_count % sample_rate == 0:
                    # Resize for faster processing
                    frame = cv2.resize(frame, (640, 480))
                    frames.append(frame)
                    frame_indices.append(frame_count)
                    extracted_count += 1
                
                frame_count += 1
            
            cap.release()
            
            video_info = {
                'video_path': str(video_path),
                'total_frames': total_frames,
                'fps': fps,
                'width': width,
                'height': height,
                'duration_seconds': duration,
                'extracted_frames': len(frames),
                'sample_rate': sample_rate
            }
            
            logger.info(f"Extracted {len(frames)} frames from {video_path}")
            return frames, video_info
            
        except Exception as e:
            logger.error(f"Frame extraction error: {e}")
            raise
    
    def process_video(
        self,
        video_path: str,
        known_faces_db: Dict[str, np.ndarray],
        authorized_zones: Dict[str, List[str]],
        risk_scores: Dict[str, float],
        sample_rate: int = 5
    ) -> VideoAnalysisResult:
        """
        Process complete video for CCTV monitoring
        
        Args:
            video_path: Path to video file
            known_faces_db: Database of known employee faces
            authorized_zones: Zones and authorized users
            risk_scores: Risk scores for employees
            sample_rate: Frame sampling rate
            
        Returns:
            VideoAnalysisResult with detailed analysis
        """
        try:
            # Extract frames
            frames, video_info = self.extract_frames_from_video(
                video_path, 
                sample_rate
            )
            
            if not frames:
                raise ValueError("No frames extracted from video")
            
            # Process frames with CompreFace
            frame_results = self.compreface.process_video_frame_batch(
                frames,
                known_faces_db
            )
            
            # Detect anomalies
            anomaly_results = self.compreface.detect_anomalies(
                frame_results,
                authorized_zones,
                risk_scores
            )
            
            # Compile results
            result = VideoAnalysisResult(
                video_path=str(video_path),
                total_frames=video_info['total_frames'],
                fps=video_info['fps'],
                duration_seconds=video_info['duration_seconds'],
                faces_detected=anomaly_results['total_faces_detected'],
                faces_recognized=anomaly_results['faces_recognized'],
                anomalies_count=anomaly_results['anomalies_found'],
                anomalies=anomaly_results['anomalies'],
                frame_results=frame_results,
                summary={
                    'video_info': video_info,
                    'anomaly_rate': anomaly_results['anomaly_rate'],
                    'recognition_rate': (
                        (anomaly_results['faces_recognized'] / 
                         max(anomaly_results['total_faces_detected'], 1)) * 100
                    ),
                    'threat_level': self._calculate_threat_level(anomaly_results)
                }
            )
            
            logger.info(f"Video analysis complete: {result.anomalies_count} anomalies found")
            return result
            
        except Exception as e:
            logger.error(f"Video processing error: {e}")
            raise
    
    def _calculate_threat_level(self, anomaly_results: Dict) -> str:
        """
        Calculate overall threat level
        
        Args:
            anomaly_results: Anomaly detection results
            
        Returns:
            Threat level: 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
        """
        anomaly_count = anomaly_results['anomalies_found']
        anomaly_rate = anomaly_results['anomaly_rate']
        
        if anomaly_count >= 5 or anomaly_rate >= 50:
            return 'CRITICAL'
        elif anomaly_count >= 3 or anomaly_rate >= 30:
            return 'HIGH'
        elif anomaly_count >= 1 or anomaly_rate >= 10:
            return 'MEDIUM'
        else:
            return 'LOW'
    
    def get_anomaly_summary(
        self, 
        analysis_result: VideoAnalysisResult
    ) -> Dict:
        """
        Get summary of anomalies from analysis
        
        Args:
            analysis_result: VideoAnalysisResult object
            
        Returns:
            Dictionary with anomaly summary
        """
        anomaly_types = {}
        high_risk_employees = set()
        unauthorized_access = []
        
        for anomaly in analysis_result.anomalies:
            anomaly_type = anomaly.get('type', 'UNKNOWN')
            anomaly_types[anomaly_type] = anomaly_types.get(anomaly_type, 0) + 1
            
            if anomaly_type == 'HIGH_RISK_DETECTED':
                high_risk_employees.add(anomaly['employee_id'])
            elif anomaly_type == 'UNAUTHORIZED_ZONE_ACCESS':
                unauthorized_access.append({
                    'employee_id': anomaly['employee_id'],
                    'zone_id': anomaly['zone_id'],
                    'risk_score': anomaly['risk_score']
                })
        
        return {
            'total_duration_seconds': analysis_result.duration_seconds,
            'total_frames': analysis_result.total_frames,
            'extracted_frames': analysis_result.summary['video_info']['extracted_frames'],
            'face_detection_stats': {
                'total_detected': analysis_result.faces_detected,
                'recognized': analysis_result.faces_recognized,
                'recognition_rate': analysis_result.summary['recognition_rate']
            },
            'anomalies_summary': {
                'total_anomalies': analysis_result.anomalies_count,
                'anomaly_rate_percent': analysis_result.summary['anomaly_rate'],
                'types': anomaly_types
            },
            'threat_level': analysis_result.summary['threat_level'],
            'high_risk_employees': list(high_risk_employees),
            'unauthorized_access_attempts': unauthorized_access
        }
    
    def process_real_time_frame(
        self,
        frame: np.ndarray,
        known_faces_db: Dict[str, np.ndarray],
        risk_scores: Dict[str, float],
        current_zone: Optional[str] = None,
        authorized_zones: Optional[Dict[str, List[str]]] = None
    ) -> Dict:
        """
        Process single frame for real-time monitoring
        
        Args:
            frame: Video frame
            known_faces_db: Known faces database
            risk_scores: Employee risk scores
            current_zone: Current monitoring zone
            authorized_zones: Zone authorization
            
        Returns:
            Real-time analysis result
        """
        try:
            # Detect faces
            detections = self.compreface.detect_faces_in_frame(frame)
            
            result = {
                'timestamp': np.datetime64('now').item(),
                'frame_size': (frame.shape[1], frame.shape[0]),
                'detections': []
            }
            
            for detection in detections:
                # Recognize face
                recognition = self.compreface.recognize_face(
                    frame, 
                    detection, 
                    known_faces_db
                )
                
                detection_data = {
                    'box': {
                        'x': detection.x,
                        'y': detection.y,
                        'w': detection.width,
                        'h': detection.height
                    },
                    'confidence': detection.confidence
                }
                
                if recognition:
                    employee_id = recognition.employee_id
                    risk = risk_scores.get(employee_id, 50)
                    
                    detection_data['employee_id'] = employee_id
                    detection_data['match_confidence'] = recognition.confidence
                    detection_data['risk_score'] = risk
                    detection_data['threat_level'] = (
                        'CRITICAL' if risk > 80 else
                        'HIGH' if risk > 70 else
                        'MEDIUM' if risk > 50 else
                        'LOW'
                    )
                    
                    # Check zone authorization
                    if current_zone and authorized_zones:
                        authorized = employee_id in authorized_zones.get(current_zone, [])
                        detection_data['zone_authorized'] = authorized
                        detection_data['access_status'] = (
                            'DENIED' if not authorized and risk > 60 else
                            'GRANTED'
                        )
                
                result['detections'].append(detection_data)
            
            return result
            
        except Exception as e:
            logger.error(f"Real-time frame processing error: {e}")
            return {
                'timestamp': np.datetime64('now').item(),
                'error': str(e),
                'detections': []
            }

