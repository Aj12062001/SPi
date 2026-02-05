from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Tuple
import tempfile
import io
import os
import cv2
import numpy as np
import json
import pandas as pd
from pathlib import Path
import importlib.util
import sys

try:
    import face_recognition  # type: ignore
    HAS_FACE_RECOGNITION = True
    print("[OK] face_recognition library loaded successfully")
except Exception as e:
    HAS_FACE_RECOGNITION = False
    print(f"[WARN] face_recognition not available: {type(e).__name__}. Using OpenCV DNN fallback for face encoding.")
    print("[INFO] To install face_recognition permanently, run: pip install cmake dlib face-recognition")

# OpenCV Face Recognizer DNN model paths
OPENCV_FACE_MODEL_DIR = Path(__file__).parent / "opencv_models"
OPENCV_FACE_DESC_PROTO = OPENCV_FACE_MODEL_DIR / "opencv_face_recognition_ssd.prototxt.txt"
OPENCV_FACE_DESC_MODEL = OPENCV_FACE_MODEL_DIR / "opencv_face_recognition_ssd.caffemodel"

def _get_or_download_opencv_face_model():
    """Get OpenCV face recognition model, download if needed"""
    if OPENCV_FACE_DESC_PROTO.exists() and OPENCV_FACE_DESC_MODEL.exists():
        return True
    # For now, we'll use simple feature extraction via OpenCV HOG
    return False

DEFAULT_USE_DNN_FACE_RECOGNITION = True  # Fallback method for face encoding

SPI_PROJECT_ROOT = Path(__file__).resolve().parents[1]
SPI_CCTV_DIR = SPI_PROJECT_ROOT / "real cctv"
SPI_COMPREFACE_DIR = SPI_PROJECT_ROOT / "CompreFace-master"

def _load_spi_compreface():
    if not SPI_CCTV_DIR.exists():
        return None
    module_path = SPI_CCTV_DIR / "face_recognition.py"
    if not module_path.exists():
        return None
    spec = importlib.util.spec_from_file_location("spi_compreface", str(module_path))
    if spec is None or spec.loader is None:
        return None
    module = importlib.util.module_from_spec(spec)
    sys.modules["spi_compreface"] = module
    spec.loader.exec_module(module)
    return module

_spi_compreface = _load_spi_compreface()
_compreface_integration = None
if _spi_compreface is not None and hasattr(_spi_compreface, "CompreFaceIntegration"):
    try:
        _compreface_integration = _spi_compreface.CompreFaceIntegration(SPI_COMPREFACE_DIR)
    except Exception as exc:
        print(f"CompreFace integration init failed: {exc}")
        _compreface_integration = None

# DNN face detector (more robust for CCTV)
def load_dnn_face_detector():
    """Load OpenCV's DNN face detector - designed for real-world video"""
    try:
        protoPath = os.path.join(os.path.dirname(__file__), "deploy.prototxt.txt")
        modelPath = os.path.join(os.path.dirname(__file__), "res10_300x300_ssd_iter_140000.caffemodel")

        if not os.path.exists(protoPath) or not os.path.exists(modelPath):
            return None

        net = cv2.dnn.readNetFromCaffe(protoPath, modelPath)
        return net
    except Exception as e:
        print(f"DNN detector load warning: {e}")
        return None

dnn_net = load_dnn_face_detector()
haar_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")

app = FastAPI(title="SPi Face Access API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


def _parse_names(raw: str) -> List[str]:
    return [name.strip() for name in raw.split(",") if name.strip()]


def _safe_stem(path_str: str) -> str:
    return Path(path_str).stem


def _detect_faces_compreface(frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
    if _compreface_integration is None:
        return []
    boxes = _compreface_integration.detect_faces(frame)
    faces = []
    for box in boxes:
        if len(box) != 4:
            continue
        x, y, w, h = box
        top = max(0, int(y))
        left = max(0, int(x))
        bottom = max(0, int(y + h))
        right = max(0, int(x + w))
        faces.append((top, right, bottom, left))
    return faces


def _detect_faces_best(frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
    faces = _detect_faces_compreface(frame)
    if faces:
        return faces
    return detect_faces_hybrid(frame)


def _collect_frames_from_dir(frames_dir: Path) -> List[Path]:
    if not frames_dir.exists() or not frames_dir.is_dir():
        return []
    patterns = ("*.jpg", "*.jpeg", "*.png")
    files = []
    for pattern in patterns:
        files.extend(frames_dir.glob(pattern))
    return sorted(files)


def _load_image_file_fallback(image_file) -> np.ndarray:
    """Load image file in BGR format (OpenCV default)"""
    if hasattr(image_file, 'read'):  # File-like object
        nparr = np.frombuffer(image_file.read(), np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    else:  # File path
        return cv2.imread(str(image_file))


def _extract_face_encoding_orb(face_image: np.ndarray, size: int = 128) -> np.ndarray:
    """
    Extract face encoding using ORB (Oriented FAST and Rotated BRIEF) descriptor.
    ORB is robust and doesn't require dlib/complex ML frameworks.
    Returns a normalized feature vector of exactly 'size' dimensions.
    """
    try:
        # Convert to grayscale
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        
        # Initialize ORB detector
        orb = cv2.ORB_create(nfeatures=256)
        keypoints, descriptors = orb.detectAndCompute(gray, None)
        
        if descriptors is None or len(descriptors) == 0:
            # If no descriptors found, use downsampled pixel values as fallback
            # Calculate dimensions needed for exactly 'size' pixels
            dim = int(np.sqrt(size))
            if dim * dim < size:
                dim += 1
            face_resized = cv2.resize(gray, (dim, dim))
            encoding = face_resized.flatten().astype(np.float32) / 255.0
            # Ensure exact size
            if len(encoding) > size:
                encoding = encoding[:size]
            elif len(encoding) < size:
                encoding = np.pad(encoding, (0, size - len(encoding)), mode='constant')
        else:
            # Use mean descriptor as encoding (normalize to fixed size)
            descriptors = descriptors.astype(np.float32) / 255.0
            encoding = np.mean(descriptors, axis=0)
            
            # Pad or truncate to fixed size
            if len(encoding) < size:
                encoding = np.pad(encoding, (0, size - len(encoding)), mode='constant')
            else:
                encoding = encoding[:size]
        
        return encoding
    except Exception as e:
        print(f"ORB encoding failed: {e}. Using pixel-based fallback.")
        # Safe fallback - create encoding of exact size
        dim = int(np.sqrt(size))
        if dim * dim < size:
            dim += 1
        if len(face_image.shape) == 3:
            gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
        else:
            gray = face_image
        face_resized = cv2.resize(gray, (dim, dim))
        encoding = face_resized.flatten().astype(np.float32) / 255.0
        return encoding[:size] if len(encoding) > size else np.pad(encoding, (0, size - len(encoding)), mode='constant')


def _face_distance_fallback(encodings1: List[np.ndarray], encoding2: np.ndarray) -> List[float]:
    """
    Calculate Euclidean distances between encodings (similar to face_recognition.face_distance)
    """
    distances = []
    for enc1 in encodings1:
        # Normalize both vectors
        enc1_norm = enc1 / (np.linalg.norm(enc1) + 1e-6)
        enc2_norm = encoding2 / (np.linalg.norm(encoding2) + 1e-6)
        
        # Euclidean distance
        distance = np.linalg.norm(enc1_norm - enc2_norm)
        distances.append(distance)
    return distances


def _get_face_distance(known_encodings: List[np.ndarray], test_encoding: np.ndarray) -> List[float]:
    """Wrapper that uses face_recognition if available, else fallback"""
    if HAS_FACE_RECOGNITION:
        return face_recognition.face_distance(known_encodings, test_encoding)
    else:
        return _face_distance_fallback(known_encodings, test_encoding)


def _get_face_encodings(image: np.ndarray, locations: List[Tuple], use_cnn: bool = False) -> List[np.ndarray]:
    """
    Extract face encodings from image given face locations.
    Wrapper that uses face_recognition if available, else fallback using ORB.
    """
    if not locations:
        return []
    
    if HAS_FACE_RECOGNITION:
        return face_recognition.face_encodings(image, locations)
    else:
        # Extract encodings using ORB for each face location
        encodings = []
        for top, right, bottom, left in locations:
            face_crop = image[top:bottom, left:right]
            if face_crop.size > 0:
                encoding = _extract_face_encoding_orb(face_crop)
                encodings.append(encoding)
        return encodings


async def _build_known_encodings(
    images: List[UploadFile],
    image_ids: List[str],
    fallback_ids: List[str]
) -> Tuple[List[np.ndarray], List[str]]:
    known_encodings: List[np.ndarray] = []
    known_ids: List[str] = []

    for idx, img in enumerate(images):
        try:
            content = await img.read()
            
            if HAS_FACE_RECOGNITION:
                # Use face_recognition library if available
                image = face_recognition.load_image_file(io.BytesIO(content))
                locations = face_recognition.face_locations(image, model="hog")
                encodings = _get_face_encodings(image, locations)
                if not encodings:
                    continue
                encoding = encodings[0]
            else:
                # Use OpenCV fallback
                nparr = np.frombuffer(content, np.uint8)
                image_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                if image_bgr is None:
                    print(f"Failed to decode image {img.filename}")
                    continue
                
                # Detect faces in image
                locations = detect_faces_hybrid(image_bgr)
                if not locations:
                    print(f"No faces detected in {img.filename}")
                    continue
                
                # Extract encoding from first face
                top, right, bottom, left = locations[0]
                face_crop = image_bgr[top:bottom, left:right]
                if face_crop.size == 0:
                    print(f"Empty face crop in {img.filename}")
                    continue
                encoding = _extract_face_encoding_orb(face_crop)
                print(f"Extracted encoding for {img.filename}, shape: {encoding.shape}")
            
            # Determine employee ID
            if idx < len(image_ids) and image_ids[idx]:
                emp_id = image_ids[idx]
            elif len(fallback_ids) == 1:
                emp_id = fallback_ids[0]
            else:
                emp_id = _safe_stem(img.filename)
            
            known_encodings.append(encoding)
            known_ids.append(emp_id)
        except Exception as exc:
            print(f"Error processing image {img.filename}: {exc}")
            continue

    # Validate encoding consistency
    if known_encodings:
        shapes = [enc.shape for enc in known_encodings]
        print(f"Loaded {len(known_encodings)} face encodings with shapes: {shapes}")
        if len(set(str(s) for s in shapes)) > 1:
            print(f"WARNING: Inconsistent encoding shapes detected! {shapes}")
    
    return known_encodings, known_ids


def detect_faces_dnn(frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Detect faces using OpenCV DNN - better for CCTV, low-light, angles
    Returns: List of (top, right, bottom, left) tuples
    """
    if dnn_net is None:
        return []
    
    h, w = frame.shape[:2]
    blob = cv2.dnn.blobFromImage(frame, 1.0, (300, 300), [104, 117, 123], False, False)
    dnn_net.setInput(blob)
    detections = dnn_net.forward()
    
    faces = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.5:  # Threshold for DNN detector
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            left, top, right, bottom = box.astype("int")
            # Ensure coordinates are within bounds
            left = max(0, left)
            top = max(0, top)
            right = min(w, right)
            bottom = min(h, bottom)
            faces.append((top, right, bottom, left))
    
    return faces


def detect_faces_hybrid(frame: np.ndarray) -> List[Tuple[int, int, int, int]]:
    """
    Hybrid detection: Try DNN first, fall back to face_recognition if DNN fails
    DNN is better for CCTV, face_recognition is better for clear faces
    """
    # Try DNN first (optimized for real-world CCTV)
    if dnn_net is not None:
        faces = detect_faces_dnn(frame)
        if len(faces) > 0:
            return faces
    
    # Fall back to Haar cascade for basic detection with improved parameters
    if haar_cascade is not None:
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) if len(frame.shape) == 3 else frame
        # Apply histogram equalization to improve detection
        gray = cv2.equalizeHist(gray)
        # More lenient parameters for CCTV footage
        boxes = haar_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.05,  # More sensitive scaling
            minNeighbors=3,    # Lower threshold for detection
            minSize=(30, 30),  # Smaller minimum face size
            flags=cv2.CASCADE_SCALE_IMAGE
        )
        if len(boxes) > 0:
            faces = []
            for (x, y, w, h) in boxes:
                faces.append((y, x + w, y + h, x))
            return faces

    # Fall back to face_recognition if DNN didn't find faces
    if HAS_FACE_RECOGNITION:
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB) if len(frame.shape) == 3 else frame
        try:
            faces = face_recognition.face_locations(rgb, model="hog")  # "hog" is faster than "cnn"
            return faces
        except Exception:
            pass
    
    return []


def enhance_frame_for_detection(frame: np.ndarray) -> np.ndarray:
    """
    Pre-process frame to improve face detection in CCTV footage
    - Improve contrast
    - Reduce noise
    - Adjust brightness
    """
    # CLAHE (Contrast Limited Adaptive Histogram Equalization) - good for CCTV
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    enhanced = cv2.merge([l, a, b])
    enhanced = cv2.cvtColor(enhanced, cv2.COLOR_LAB2BGR)
    
    # Denoise
    enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, h=10, hForColorComponents=10, templateWindowSize=7, searchWindowSize=21)
    
    return enhanced


@app.get("/")
def root():
    return {
        "message": "SPi Face Recognition API",
        "version": "1.0",
        "status": "running",
        "endpoints": {
            "GET /health": "Check backend status",
            "POST /analyze": "Analyze video/frames for face recognition",
            "GET /docs": "Interactive API documentation"
        }
    }


@app.get("/health")
def health():
    return {
        "status": "ok", 
        "face_recognition": HAS_FACE_RECOGNITION,
        "face_detection": "OpenCV DNN + Haar Cascade",
        "backend": "FastAPI"
    }


@app.post("/analyze")
async def analyze(
    video: UploadFile = File(None),
    images: List[UploadFile] = File([]),
    authorized_ids: str = Form(""),
    authorized_image_ids: List[str] = Form([]),
    frames_dir: str = Form(""),
    # Support for split authorized/unauthorized uploads
    authorized_images: List[UploadFile] = File([]),
    unauthorized_images: List[UploadFile] = File([]),
    unauthorized_ids: str = Form(""),
    unauthorized_image_ids: List[str] = Form([])
):
    # Combine authorized and unauthorized images into one list
    all_images = list(authorized_images) if authorized_images else []
    all_images.extend(unauthorized_images if unauthorized_images else [])
    
    # If using old 'images' parameter, add those too
    if images:
        all_images.extend(images)
    
    # Combine IDs
    auth_ids = _parse_names(authorized_ids)
    unauth_ids = _parse_names(unauthorized_ids)
    all_authorized_list = auth_ids + unauth_ids  # For now, treat all as known faces
    
    # Combine image IDs
    all_image_ids = list(authorized_image_ids) if authorized_image_ids else []
    all_image_ids.extend(unauthorized_image_ids if unauthorized_image_ids else [])
    
    # Build known encodings from uploaded images
    known_encodings, known_ids = await _build_known_encodings(
        all_images, all_image_ids, all_authorized_list
    )
    
    if not known_encodings:
        return {"error": "No valid face encodings from uploaded images"}
    
    # Process video if provided
    if video is not None:
        try:
            # Save video to temp file
            with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as temp_video:
                content = await video.read()
                temp_video.write(content)
                temp_video_path = temp_video.name
            
            # Process video
            cap = cv2.VideoCapture(temp_video_path)
            frame_count = 0
            matches = []
            detection_stats = {}  # Track detections per employee
            
            # Adaptive threshold based on encoding method
            match_threshold = 0.8 if HAS_FACE_RECOGNITION else 1.2
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every 10th frame to improve performance
                frame_count += 1
                if frame_count % 10 != 0:
                    continue
                
                # Enhance frame for better detection (optional - can be slow)
                # enhanced_frame = enhance_frame_for_detection(frame)
                
                # Detect faces in frame
                face_locations = _detect_faces_best(frame)
                
                if not face_locations:
                    continue
                
                # Get encodings for detected faces
                if HAS_FACE_RECOGNITION:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    face_encodings = _get_face_encodings(rgb_frame, face_locations)
                else:
                    face_encodings = _get_face_encodings(frame, face_locations)
                
                # Match against known faces
                for face_encoding, face_location in zip(face_encodings, face_locations):
                    distances = _get_face_distance(known_encodings, face_encoding)
                    min_distance_idx = np.argmin(distances)
                    min_distance = distances[min_distance_idx]
                    
                    # More lenient threshold for OpenCV fallback
                    if min_distance < match_threshold:
                        employee_id = known_ids[min_distance_idx]
                        
                        # Track detection statistics
                        if employee_id not in detection_stats:
                            detection_stats[employee_id] = {
                                'count': 0,
                                'first_frame': frame_count,
                                'last_frame': frame_count,
                                'confidences': []
                            }
                        
                        detection_stats[employee_id]['count'] += 1
                        detection_stats[employee_id]['last_frame'] = frame_count
                        detection_stats[employee_id]['confidences'].append(float(1 - min_distance))
                        
                        matches.append({
                            "frame": frame_count,
                            "employee_id": employee_id,
                            "confidence": float(1 - min_distance),
                            "authorized": employee_id in all_authorized_list,
                            "distance": float(min_distance)
                        })
            
            cap.release()
            os.unlink(temp_video_path)
            
            # Calculate aggregate statistics for risk assessment
            cctv_stats = []
            for emp_id, stats in detection_stats.items():
                avg_confidence = sum(stats['confidences']) / len(stats['confidences'])
                duration_frames = stats['last_frame'] - stats['first_frame']
                cctv_stats.append({
                    'employee_id': emp_id,
                    'detection_count': stats['count'],
                    'avg_confidence': round(avg_confidence, 3),
                    'first_seen_frame': stats['first_frame'],
                    'last_seen_frame': stats['last_frame'],
                    'duration_frames': duration_frames,
                    'authorized': emp_id in all_authorized_list
                })
            
            return {
                "matches": matches, 
                "total_frames": frame_count,
                "cctv_stats": cctv_stats,
                "unique_detections": len(detection_stats)
            }
            
        except Exception as e:
            return {"error": f"Video processing error: {str(e)}"}
    
    # Process frames directory if provided
    elif frames_dir:
        try:
            frames_path = Path(frames_dir)
            frame_files = _collect_frames_from_dir(frames_path)
            
            if not frame_files:
                return {"error": f"No frames found in {frames_dir}"}
            
            matches = []
            
            for frame_file in frame_files:
                frame = cv2.imread(str(frame_file))
                if frame is None:
                    continue
                
                # Detect faces
                face_locations = _detect_faces_best(frame)
                
                if not face_locations:
                    continue
                
                # Get encodings
                if HAS_FACE_RECOGNITION:
                    rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                    face_encodings = _get_face_encodings(rgb_frame, face_locations)
                else:
                    face_encodings = _get_face_encodings(frame, face_locations)
                
                # Match against known faces
                for face_encoding, face_location in zip(face_encodings, face_locations):
                    distances = _get_face_distance(known_encodings, face_encoding)
                    min_distance_idx = np.argmin(distances)
                    
                    if distances[min_distance_idx] < 0.6:
                        matches.append({
                            "frame": frame_file.name,
                            "employee_id": known_ids[min_distance_idx],
                            "confidence": float(1 - distances[min_distance_idx]),
                            "authorized": known_ids[min_distance_idx] in all_authorized_list
                        })
            
            return {"matches": matches, "total_frames": len(frame_files)}
            
        except Exception as e:
            return {"error": f"Frames processing error: {str(e)}"}
    
    else:
        return {"error": "No video or frames_dir provided"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
