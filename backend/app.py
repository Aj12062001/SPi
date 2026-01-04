from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Tuple
from dataclasses import asdict
from pydantic import BaseModel
import tempfile
import io
import os
import cv2
import numpy as np
import json
import base64
import re
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path
import importlib.util
import sys
import smtplib
from email.message import EmailMessage

try:
    import face_recognition  # type: ignore
    HAS_FACE_RECOGNITION = True
    print("[OK] face_recognition library loaded successfully")
except Exception as e:
    HAS_FACE_RECOGNITION = False
    print(f"[INFO] face_recognition not installed ({type(e).__name__}); using OpenCV DNN fallback for face encoding.")
    print("[INFO] Optional install: pip install cmake dlib face-recognition")

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


def _load_env_file(env_file: Path) -> None:
    if not env_file.exists() or not env_file.is_file():
        return

    try:
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue

            key, value = line.split("=", 1)
            key = key.strip()
            value = value.strip().strip('"').strip("'")

            if key and key not in os.environ:
                os.environ[key] = value
    except Exception as exc:
        print(f"[WARN] Failed to load env file {env_file}: {exc}")


_load_env_file(SPI_PROJECT_ROOT / ".env")
_load_env_file(Path(__file__).resolve().parent / ".env")
_load_env_file(SPI_PROJECT_ROOT / ".env.local")
_load_env_file(Path(__file__).resolve().parent / ".env.local")

ENABLE_SPI_COMPREFACE_BRIDGE = os.getenv("ENABLE_SPI_COMPREFACE_BRIDGE", "false").lower() == "true"
ENABLE_COMPREFACE = os.getenv("ENABLE_COMPREFACE", "false").lower() == "true"
COMPREFACE_URL = os.getenv("COMPREFACE_URL", "http://localhost:8001")


SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = os.getenv("SMTP_PORT", "")
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false")


def _first_non_empty(*values: str) -> str:
    for value in values:
        if value and value.strip():
            return value.strip()
    return ""


def _get_twilio_config() -> Tuple[str, str, str]:
    account_sid = os.getenv("TWILIO_ACCOUNT_SID", "").strip()
    auth_token = os.getenv("TWILIO_AUTH_TOKEN", "").strip()
    from_number = os.getenv("TWILIO_FROM_NUMBER", "").strip()
    return account_sid, auth_token, from_number


def _get_smtp_config() -> dict:
    host = _first_non_empty(
        os.getenv("SMTP_HOST", ""),
        os.getenv("EMAIL_HOST", ""),
        SMTP_HOST
    )
    port_raw = _first_non_empty(
        os.getenv("SMTP_PORT", ""),
        os.getenv("EMAIL_PORT", ""),
        SMTP_PORT
    )
    username = _first_non_empty(
        os.getenv("SMTP_USERNAME", ""),
        os.getenv("EMAIL_USERNAME", ""),
        os.getenv("EMAIL_USER", ""),
        SMTP_USERNAME
    )
    password = _first_non_empty(
        os.getenv("SMTP_PASSWORD", ""),
        os.getenv("EMAIL_PASSWORD", ""),
        os.getenv("EMAIL_PASS", ""),
        SMTP_PASSWORD
    )
    from_email = _first_non_empty(
        os.getenv("SMTP_FROM_EMAIL", ""),
        os.getenv("EMAIL_FROM", ""),
        SMTP_FROM_EMAIL
    )
    use_tls_raw = _first_non_empty(
        os.getenv("SMTP_USE_TLS", ""),
        os.getenv("EMAIL_USE_TLS", ""),
        SMTP_USE_TLS,
        "true"
    ).lower()
    use_ssl_raw = _first_non_empty(
        os.getenv("SMTP_USE_SSL", ""),
        os.getenv("EMAIL_USE_SSL", ""),
        SMTP_USE_SSL,
        "false"
    ).lower()

    if not from_email and username:
        from_email = username

    port = 0
    if port_raw:
        try:
            port = int(port_raw)
        except ValueError:
            port = 0

    use_tls = use_tls_raw in {"1", "true", "yes", "on"}
    use_ssl = use_ssl_raw in {"1", "true", "yes", "on"}

    return {
        "host": host,
        "port": port,
        "username": username,
        "password": password,
        "from_email": from_email,
        "use_tls": use_tls,
        "use_ssl": use_ssl
    }

def _load_spi_compreface():
    if not ENABLE_SPI_COMPREFACE_BRIDGE:
        return None
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
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:5173"
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
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
    """
    Build known face encodings from uploaded images.
    Groups all images with the same employee_id (folder name) into a single encoding.
    Each folder = 1 employee, regardless of how many poses/images inside.
    """
    # First pass: extract encoding for each image and organize by employee_id
    employee_encodings: dict = {}  # emp_id -> list of encodings
    
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
            
            # Determine employee ID from image_ids array (should be folder name)
            if idx < len(image_ids) and image_ids[idx]:
                emp_id = image_ids[idx]
            elif len(fallback_ids) == 1:
                emp_id = fallback_ids[0]
            else:
                emp_id = _safe_stem(img.filename)
            
            # Normalize employee_id (remove file extensions, sanitize)
            emp_id = emp_id.split('.')[0].strip()
            
            # Group encodings by employee_id
            if emp_id not in employee_encodings:
                employee_encodings[emp_id] = []
            employee_encodings[emp_id].append(encoding)
            
            print(f"[INFO] Added encoding for employee={emp_id} from {img.filename}")
        except Exception as exc:
            print(f"[ERROR] Processing image {img.filename}: {exc}")
            continue
    
    # Second pass: aggregate encodings per employee_id (one encoding per employee)
    known_encodings: List[np.ndarray] = []
    known_ids: List[str] = []
    
    for emp_id, encodings_list in sorted(employee_encodings.items()):
        if not encodings_list:
            continue
        
        if len(encodings_list) == 1:
            # Single image for this employee
            known_encodings.append(encodings_list[0])
            known_ids.append(emp_id)
            print(f"[OK] Employee {emp_id}: 1 encoding")
        else:
            # Multiple images (different poses) - average them into ONE encoding
            try:
                avg_encoding = np.mean(encodings_list, axis=0)
                known_encodings.append(avg_encoding)
                known_ids.append(emp_id)
                print(f"[OK] Employee {emp_id}: {len(encodings_list)} images → 1 averaged encoding")
            except Exception as e:
                print(f"[ERROR] Averaging encodings for {emp_id}: {e}")
                # Fallback: use first encoding
                known_encodings.append(encodings_list[0])
                known_ids.append(emp_id)
    
    # Validate
    print(f"\n[SUMMARY] Loaded {len(known_encodings)} employees (each with 1 aggregated encoding)")
    if known_encodings:
        shapes = [enc.shape for enc in known_encodings]
        if len(set(str(s) for s in shapes)) > 1:
            print(f"[WARN] Inconsistent encoding shapes: {shapes}")
    
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
    
    # Denoise (h parameter handles both luminance and color components)
    try:
        enhanced = cv2.fastNlMeansDenoisingColored(enhanced, None, h=10, templateWindowSize=7, searchWindowSize=21)
    except Exception as e:
        print(f"[WARN] Denoising failed: {e}; skipping denoising step")
    
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
            match_threshold = 0.8 if HAS_FACE_RECOGNITION else 1.15
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Process every 5th frame for better recall on blurred/missed faces
                frame_count += 1
                if frame_count % 5 != 0:
                    continue
                
                # Enhance frame for better detection in low-light/blurred CCTV footage
                enhanced_frame = enhance_frame_for_detection(frame)
                
                # Detect faces in frame
                face_locations = _detect_faces_best(enhanced_frame)
                
                if not face_locations:
                    continue
                
                # Get encodings for detected faces
                if HAS_FACE_RECOGNITION:
                    rgb_frame = cv2.cvtColor(enhanced_frame, cv2.COLOR_BGR2RGB)
                    face_encodings = _get_face_encodings(rgb_frame, face_locations)
                else:
                    face_encodings = _get_face_encodings(enhanced_frame, face_locations)
                
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


# ============================================================================
# COMPREFACE-BASED CCTV VIDEO PROCESSING ENDPOINTS
# ============================================================================

try:
    from compreface_integration import CompreFaceIntegration
    from cctv_video_processor import CCTVVideoProcessor
    COMPREFACE_MODULES_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] CompreFace modules not available: {e}")
    COMPREFACE_MODULES_AVAILABLE = False
    CompreFaceIntegration = None
    CCTVVideoProcessor = None

# Initialize CompreFace integration
_compreface_client = None
_video_processor = None

def _init_compreface():
    """Initialize CompreFace integration"""
    global _compreface_client, _video_processor
    
    if not ENABLE_COMPREFACE:
        print("[INFO] CompreFace disabled (set ENABLE_COMPREFACE=true to enable)")
        return

    if not COMPREFACE_MODULES_AVAILABLE:
        print("[INFO] CompreFace modules not available")
        return
    
    if _compreface_client is None:
        try:
            _compreface_client = CompreFaceIntegration(
                compreface_url=COMPREFACE_URL
            )
            if _compreface_client.is_available():
                print("[OK] CompreFace integration initialized")
                _video_processor = CCTVVideoProcessor(_compreface_client)
            else:
                print("[WARN] CompreFace service not available")
                _compreface_client = None
        except Exception as e:
            print(f"[WARN] CompreFace initialization failed: {e}")
            _compreface_client = None

_init_compreface()


class ThreatAlert(BaseModel):
    employee_id: str
    employee_name: Optional[str] = None
    risk_score: float
    risk_level: str
    status: str
    detection_count: Optional[int] = None


class SMSAlertRequest(BaseModel):
    phone_number: str
    alerts: List[ThreatAlert]


class EmailAlertRequest(BaseModel):
    from_email: Optional[str] = None
    recipient_email: str
    alerts: List[ThreatAlert]


def _normalize_email_address(email: str) -> str:
    value = (email or "").strip()
    if not re.fullmatch(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$", value):
        raise HTTPException(status_code=400, detail="Invalid recipient email address")
    return value


def _classify_risk_level(risk_score: float) -> Optional[str]:
    if risk_score >= 80:
        return "CRITICAL"
    if risk_score >= 60:
        return "HIGH"
    return None


def _build_risk_alert_email_body(alert: ThreatAlert, risk_level: str) -> str:
    employee_name = (alert.employee_name or alert.employee_id or "Unknown").strip()
    employee_id = (alert.employee_id or "Unknown").strip()
    risk_score_display = f"{float(alert.risk_score):.2f}"

    return (
        "Dear Admin,\n\n"
        "The system has detected an employee with elevated risk status.\n\n"
        "Employee Details:\n"
        "------------------------\n"
        f"Employee Name: {employee_name}\n"
        f"Employee ID: {employee_id}\n"
        f"Risk Score: {risk_score_display}\n"
        f"Risk Level: {risk_level}\n\n"
        "Please review the employee activity immediately.\n\n"
        "Regards,\n"
        "Risk Monitoring System"
    )


def _send_smtp_email(recipient_email: str, from_email: str, subject: str, body: str, smtp_config: dict) -> dict:
    host = smtp_config.get("host", "")
    port = int(smtp_config.get("port", 0) or 0)
    username = smtp_config.get("username", "")
    password = smtp_config.get("password", "")
    use_tls = bool(smtp_config.get("use_tls", True))
    use_ssl = bool(smtp_config.get("use_ssl", False))

    if not (host and port and from_email):
        return {
            "sent": False,
            "reason": "SMTP is not fully configured"
        }

    if username and not password:
        return {
            "sent": False,
            "reason": "SMTP authentication password missing"
        }

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = from_email
    message["To"] = recipient_email
    message.set_content(body)

    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=15) as server:
                if username and password:
                    server.login(username, password)
                server.send_message(message)
        else:
            with smtplib.SMTP(host, port, timeout=15) as server:
                server.ehlo()
                if use_tls:
                    server.starttls()
                    server.ehlo()
                if username and password:
                    server.login(username, password)
                server.send_message(message)

        return {
            "sent": True,
            "recipient_email": recipient_email,
            "subject": subject
        }
    except Exception as exc:
        error_str = str(exc)
        if "530" in error_str or "Authentication" in error_str:
            error_msg = f"SMTP Authentication failed. Check SMTP_USERNAME and SMTP_PASSWORD. Gmail users: Use an App Password (Settings > Security > App passwords), not your regular password."
        elif "535" in error_str:
            error_msg = f"SMTP credentials rejected. Verify SMTP_USERNAME and SMTP_PASSWORD are correct."
        elif "Connection refused" in error_str or "connect" in error_str.lower():
            error_msg = f"Cannot connect to SMTP server {host}:{port}. Check SMTP_HOST and SMTP_PORT."
        else:
            error_msg = f"Email send failed: {exc}"
        return {
            "sent": False,
            "reason": error_msg
        }


def _build_alert_message(alerts: List[ThreatAlert]) -> str:
    lines = ["SPi Security Alert", "High/Critical risk persons detected:"]
    for idx, alert in enumerate(alerts, start=1):
        name = alert.employee_name or alert.employee_id
        count_part = f", detections={alert.detection_count}" if alert.detection_count is not None else ""
        lines.append(
            f"{idx}. {name} ({alert.employee_id}) - status={alert.status}, risk={alert.risk_score:.1f} ({alert.risk_level}){count_part}"
        )
    return "\n".join(lines)


def _send_twilio_sms(to_number: str, body: str, account_sid: str, auth_token: str, from_number: str) -> dict:
    url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
    payload = urllib.parse.urlencode({
        "To": to_number,
        "From": from_number,
        "Body": body
    }).encode("utf-8")

    auth_string = f"{account_sid}:{auth_token}".encode("utf-8")
    auth_header = base64.b64encode(auth_string).decode("ascii")

    req = urllib.request.Request(url, data=payload, method="POST")
    req.add_header("Authorization", f"Basic {auth_header}")
    req.add_header("Content-Type", "application/x-www-form-urlencoded")

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            response_data = json.loads(response.read().decode("utf-8"))
            return {
                "sent": True,
                "sid": response_data.get("sid"),
                "status": response_data.get("status")
            }
    except urllib.error.HTTPError as exc:
        error_payload = exc.read().decode("utf-8", errors="ignore")
        twilio_message = ""
        twilio_code = ""
        try:
            parsed_error = json.loads(error_payload)
            twilio_message = str(parsed_error.get("message", "")).strip()
            twilio_code = str(parsed_error.get("code", "")).strip()
        except Exception:
            twilio_message = ""
            twilio_code = ""

        reason = f"Twilio HTTP error: {exc.code}"
        if twilio_message and twilio_code:
            reason = f"Twilio error {twilio_code}: {twilio_message}"
        elif twilio_message:
            reason = f"Twilio error: {twilio_message}"

        return {
            "sent": False,
            "reason": reason,
            "details": error_payload
        }
    except Exception as exc:
        return {
            "sent": False,
            "reason": f"SMS send failed: {exc}"
        }


def _normalize_phone_number(phone_number: str) -> str:
    raw = (phone_number or "").strip()
    compact = re.sub(r"[\s\-().]", "", raw)

    if compact.startswith("00"):
        compact = f"+{compact[2:]}"

    if compact and not compact.startswith("+") and compact.isdigit():
        compact = f"+{compact}"

    if not re.fullmatch(r"^\+[1-9]\d{6,14}$", compact):
        raise HTTPException(
            status_code=400,
            detail="Invalid phone number format. Use E.164 format like +14155552671."
        )

    return compact


@app.post("/api/v1/alerts/sms")
async def send_sms_alert(request: SMSAlertRequest):
    account_sid, auth_token, from_number = _get_twilio_config()

    if not (account_sid and auth_token and from_number):
        missing = []
        if not account_sid:
            missing.append("TWILIO_ACCOUNT_SID")
        if not auth_token:
            missing.append("TWILIO_AUTH_TOKEN")
        if not from_number:
            missing.append("TWILIO_FROM_NUMBER")
        raise HTTPException(
            status_code=500,
            detail=f"SMS service is not configured. Missing: {', '.join(missing)}"
        )

    if not request.alerts:
        raise HTTPException(status_code=400, detail="At least one alert is required")

    high_or_critical = [
        alert for alert in request.alerts
        if alert.risk_score >= 60 or alert.risk_level.upper() in {"HIGH", "CRITICAL"} or alert.status.lower() == "unauthorized"
    ]

    if not high_or_critical:
        raise HTTPException(status_code=400, detail="No high/critical alerts to send")

    normalized_phone = _normalize_phone_number(request.phone_number)
    message = _build_alert_message(high_or_critical)
    sms_result = _send_twilio_sms(normalized_phone, message, account_sid, auth_token, from_number)

    if not sms_result.get("sent"):
        raise HTTPException(
            status_code=502,
            detail={
                "message": sms_result.get("reason", "SMS send failed"),
                "twilio_details": sms_result.get("details", "")
            }
        )

    return {
        "ok": True,
        "phone_number": normalized_phone,
        "alert_count": len(high_or_critical),
        "sms": sms_result
    }


@app.post("/api/v1/alerts/email")
async def send_email_alert(request: EmailAlertRequest):
    smtp_config = _get_smtp_config()
    request_from_email = (request.from_email or "").strip()
    effective_from_email = _normalize_email_address(request_from_email) if request_from_email else smtp_config.get("from_email", "")

    missing = []
    if not smtp_config.get("host"):
        missing.append("SMTP_HOST")
    if not smtp_config.get("port"):
        missing.append("SMTP_PORT")
    if not effective_from_email:
        missing.append("from_email (request) or SMTP_FROM_EMAIL/SMTP_USERNAME")

    if missing:
        raise HTTPException(
            status_code=500,
            detail=f"Email service is not configured. Missing: {', '.join(missing)}"
        )

    if not request.alerts:
        raise HTTPException(status_code=400, detail="At least one alert is required")

    normalized_email = _normalize_email_address(request.recipient_email)
    subject = "⚠ Risk Alert: High/Critical Risk Employee Detected"

    high_or_critical = []
    for alert in request.alerts:
        computed_level = _classify_risk_level(float(alert.risk_score))
        if computed_level:
            high_or_critical.append((alert, computed_level))

    if not high_or_critical:
        raise HTTPException(status_code=400, detail="No high/critical alerts to send")

    sent_results = []
    for alert, computed_level in high_or_critical:
        body = _build_risk_alert_email_body(alert, computed_level)
        result = _send_smtp_email(normalized_email, effective_from_email, subject, body, smtp_config)
        if not result.get("sent"):
            raise HTTPException(
                status_code=502,
                detail={
                    "message": result.get("reason", "Email send failed"),
                    "employee_id": alert.employee_id
                }
            )
        sent_results.append({
            "employee_id": alert.employee_id,
            "risk_level": computed_level,
            "risk_score": float(alert.risk_score)
        })

    return {
        "ok": True,
        "from_email": effective_from_email,
        "recipient_email": normalized_email,
        "alert_count": len(high_or_critical),
        "subject": subject,
        "emails_sent": sent_results
    }


@app.get("/api/v1/alerts/email/test-config")
async def test_email_config():
    """Test SMTP configuration and authentication"""
    smtp_config = _get_smtp_config()
    
    missing = []
    if not smtp_config.get("host"):
        missing.append("SMTP_HOST")
    if not smtp_config.get("port"):
        missing.append("SMTP_PORT")
    if not smtp_config.get("username"):
        missing.append("SMTP_USERNAME")
    if not smtp_config.get("password"):
        missing.append("SMTP_PASSWORD")
    
    if missing:
        return {
            "ok": False,
            "configured": False,
            "missing_fields": missing,
            "message": f"Missing required SMTP config: {', '.join(missing)}"
        }
    
    host = smtp_config.get("host", "")
    port = int(smtp_config.get("port", 0) or 0)
    username = smtp_config.get("username", "")
    password = smtp_config.get("password", "")
    use_tls = bool(smtp_config.get("use_tls", True))
    use_ssl = bool(smtp_config.get("use_ssl", False))
    
    try:
        if use_ssl:
            with smtplib.SMTP_SSL(host, port, timeout=10) as server:
                server.login(username, password)
        else:
            with smtplib.SMTP(host, port, timeout=10) as server:
                server.ehlo()
                if use_tls:
                    server.starttls()
                    server.ehlo()
                server.login(username, password)
        
        return {
            "ok": True,
            "configured": True,
            "message": f"✅ SMTP connection and authentication successful! Host: {host}:{port}, User: {username}"
        }
    except Exception as exc:
        error_str = str(exc)
        if "530" in error_str or "Authentication" in error_str or "535" in error_str:
            detail = "❌ Authentication failed. For Gmail: Use an App Password from Settings > Security > App passwords, not your regular password. For other providers, verify SMTP_USERNAME and SMTP_PASSWORD."
        elif "Connection refused" in error_str or "connect" in error_str.lower():
            detail = f"❌ Cannot connect to {host}:{port}. Verify SMTP_HOST and SMTP_PORT are correct."
        else:
            detail = f"❌ SMTP test failed: {error_str}"
        
        return {
            "ok": False,
            "configured": False,
            "message": detail,
            "error": error_str
        }



@app.post("/api/v1/cctv/analyze-video")
async def analyze_cctv_video(
    video_file: UploadFile = File(...),
    sample_rate: int = 5
):
    """
    Analyze CCTV video using CompreFace for face detection and anomaly detection
    
    Parameters:
    - video_file: Video file to analyze (MP4, AVI, MOV, etc.)
    - sample_rate: Extract every nth frame (default: 5)
    
    Returns:
    - Detailed analysis with face detections, recognitions, and anomalies
    """
    try:
        if not _video_processor:
            return {
                "error": "Video processor not available",
                "hint": "Make sure CompreFace service is running"
            }
        
        # Save uploaded video temporarily
        import tempfile
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp4") as tmp:
            tmp_path = tmp.name
            content = await video_file.read()
            tmp.write(content)
        
        # Prepare known faces database and risk scores
        known_faces_db = {}
        risk_scores = {}
        authorized_zones = {
            "ceo_suite": ["AAE0190", "AAF0535"],
            "financial_vault": ["ABC0174", "AAE0190"],
            "server_room": ["LOW0001", "AAE0190"],
            "rd_lab": ["AAF0535", "ABC0174"]
        }
        
        # Process video
        analysis = _video_processor.process_video(
            tmp_path,
            known_faces_db,
            authorized_zones,
            risk_scores,
            sample_rate=sample_rate
        )
        
        # Generate summary
        summary = _video_processor.get_anomaly_summary(analysis)
        
        # Cleanup
        Path(tmp_path).unlink()
        
        return {
            "status": "success",
            "video_analysis": asdict(analysis),
            "summary": summary
        }
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "error_type": type(e).__name__
        }


@app.post("/api/v1/cctv/real-time-detection")
async def real_time_face_detection(
    image_file: UploadFile = File(...),
    zone: str = None
):
    """
    Real-time face detection in CCTV frames
    
    Parameters:
    - image_file: JPEG/PNG image from CCTV stream
    - zone: Current monitoring zone ID
    
    Returns:
    - Detected faces with employee IDs, risk scores, and access status
    """
    try:
        if not _compreface_client:
            return {
                "error": "CompreFace integration not available"
            }
        
        # Read image
        content = await image_file.read()
        nparr = np.frombuffer(content, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"error": "Invalid image format"}
        
        # Detect faces
        detections = _compreface_client.detect_faces_in_frame(frame)
        
        result = {
            "timestamp": str(np.datetime64('now')),
            "frame_shape": frame.shape,
            "detections": []
        }
        
        # Prepare sample data for demo
        known_faces_db = {}
        risk_scores = {
            "AAE0190": 64.02, "AAF0535": 77.37, "ABC0174": 78.63,
            "ACC0042": 92.46, "LOW0001": 12.5
        }
        
        authorized_zones = {
            "ceo_suite": ["AAE0190", "AAF0535"],
            "financial_vault": ["ABC0174", "AAE0190"],
            "server_room": ["LOW0001", "AAE0190"],
            "rd_lab": ["AAF0535", "ABC0174"]
        }
        
        for detection in detections:
            detection_data = {
                "box": {
                    "x": detection.x,
                    "y": detection.y,
                    "width": detection.width,
                    "height": detection.height
                },
                "detection_confidence": detection.confidence
            }
            
            # Try to recognize face
            recognition = _compreface_client.recognize_face(
                frame,
                detection,
                known_faces_db
            )
            
            if recognition:
                employee_id = recognition.employee_id
                risk = risk_scores.get(employee_id, 50)
                
                detection_data["recognized"] = True
                detection_data["employee_id"] = employee_id
                detection_data["match_confidence"] = recognition.confidence
                detection_data["risk_score"] = risk
                
                if zone and zone in authorized_zones:
                    is_authorized = employee_id in authorized_zones[zone]
                    detection_data["zone_authorized"] = is_authorized
                    
                    access_status = "GRANTED"
                    if not is_authorized:
                        access_status = "DENIED" if risk > 60 else "ADVISORY"
                    
                    detection_data["access_status"] = access_status
            else:
                detection_data["recognized"] = False
            
            result["detections"].append(detection_data)
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "error_type": type(e).__name__
        }


@app.get("/api/v1/cctv/status")
async def cctv_system_status():
    """Get status of CCTV monitoring system and CompreFace integration"""
    
    compreface_available = False
    if _compreface_client:
        compreface_available = _compreface_client.is_available()
    
    return {
        "system_status": "operational",
        "compreface_integration": {
            "configured": _compreface_client is not None,
            "available": compreface_available,
            "url": "http://localhost:8000" if _compreface_client else None
        },
        "video_processor": {
            "initialized": _video_processor is not None,
            "available": _video_processor is not None and _compreface_client is not None
        },
        "features": {
            "face_detection": compreface_available,
            "face_recognition": compreface_available,
            "anomaly_detection": True,
            "real_time_monitoring": compreface_available,
            "batch_video_processing": _video_processor is not None
        }
    }


if __name__ == "__main__":
    import uvicorn
    
    preferred_port = int(os.getenv("PORT", "8000"))
    port = preferred_port
    max_retries = 10
    
    for attempt in range(max_retries):
        try:
            if port != preferred_port:
                print(f"[INFO] Port {preferred_port} is in use. Starting on port {port}...")
            uvicorn.run(app, host="0.0.0.0", port=port)
            break  # Server stopped gracefully
        except OSError as e:
            if e.errno == 10048 or "address already in use" in str(e).lower():
                if attempt == max_retries - 1:
                    print(f"[ERROR] Could not find an available port after trying ports {preferred_port}-{port}.")
                    exit(1)
                port += 1
            else:
                    raise  # Re-raise other OSErrors

