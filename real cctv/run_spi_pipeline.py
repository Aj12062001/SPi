"""
SPI (Security Prediction Intelligence) - CCTV Face Extraction Pipeline
Master orchestration script for processing CCTV videos and extracting faces
"""

import sys
import logging
from pathlib import Path
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('spi_pipeline.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def print_banner():
    """Print SPI banner"""
    banner = """
╔════════════════════════════════════════════════════════════════╗
║   SPI - Security Prediction Intelligence                       ║
║   CCTV Video Processing & Face Extraction Pipeline             ║
╚════════════════════════════════════════════════════════════════╝
    """
    print(banner)


def check_dependencies():
    """Check if all required dependencies are installed"""
    logger.info("Checking dependencies...")
    
    required_packages = {
        'cv2': 'opencv-python',
        'numpy': 'numpy',
    }
    
    missing_packages = []
    
    for module_name, package_name in required_packages.items():
        try:
            __import__(module_name)
            logger.info(f"  [OK] {package_name}")
        except ImportError:
            logger.error(f"  [FAILED] {package_name} - NOT INSTALLED")
            missing_packages.append(package_name)
    
    if missing_packages:
        logger.error(f"\nMissing packages: {', '.join(missing_packages)}")
        logger.error("Install them with: pip install " + " ".join(missing_packages))
        return False
    
    logger.info("[OK] All dependencies installed")
    return True


def main():
    """Main pipeline execution"""
    print_banner()
    
    # Configuration
    base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
    compreface_path = base_path / "CompreFace-master"
    
    logger.info("="*70)
    logger.info("SPI CCTV FACE EXTRACTION PIPELINE")
    logger.info("="*70)
    logger.info(f"Base Path: {base_path}")
    logger.info(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check paths
    logger.info("\nVerifying paths...")
    if not base_path.exists():
        logger.error(f"Base path not found: {base_path}")
        return False
    logger.info(f"  [OK] Base path: {base_path}")
    
    video_folder = base_path / "video"
    if not video_folder.exists():
        logger.error(f"Video folder not found: {video_folder}")
        return False
    logger.info(f"  [OK] Video folder: {video_folder}")
    
    if not compreface_path.exists():
        logger.warning(f"CompreFace path not found: {compreface_path}")
        logger.warning("CompreFace integration may be limited")
    else:
        logger.info(f"  [OK] CompreFace path: {compreface_path}")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("Please install missing dependencies and try again")
        return False
    
    # Import pipeline modules
    logger.info("\nLoading pipeline modules...")
    try:
        from video_processor import CCTVVideoProcessor
        logger.info("  [OK] Video processor module loaded")
    except ImportError as e:
        logger.error(f"  [FAILED] Failed to load video processor: {e}")
        return False
    
    try:
        from face_recognition import setup_face_recognition_pipeline
        logger.info("  [OK] Face recognition module loaded")
    except ImportError as e:
        logger.error(f"  [FAILED] Failed to load face recognition: {e}")
        return False
    
    # Step 1: Process Videos
    logger.info("\n" + "="*70)
    logger.info("STEP 1: VIDEO PROCESSING & FRAME EXTRACTION")
    logger.info("="*70)
    
    try:
        processor = CCTVVideoProcessor(base_path)
        processor.process_all_videos(frame_interval=5, start_video=2, end_video=5)
        logger.info("[OK] Video processing complete")
    except Exception as e:
        logger.error(f"[FAILED] Video processing failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 2: Face Recognition Pipeline
    logger.info("\n" + "="*70)
    logger.info("STEP 2: FACE RECOGNITION & ORGANIZATION")
    logger.info("="*70)
    
    try:
        employee_db = setup_face_recognition_pipeline(base_path, compreface_path)
        logger.info("[OK] Face recognition pipeline complete")
    except Exception as e:
        logger.error(f"[FAILED] Face recognition setup failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Step 3: Summary
    logger.info("\n" + "="*70)
    logger.info("PIPELINE EXECUTION SUMMARY")
    logger.info("="*70)
    
    output_base = base_path / "processed_output"
    frames_folder = output_base / "frames"
    faces_folder = output_base / "extracted_faces"
    employee_db_folder = output_base / "employee_database"
    metadata_folder = output_base / "metadata"
    
    logger.info(f"""
OUTPUT LOCATIONS:
  [DIR] Base Output: {output_base}
  [DIR] Frames: {frames_folder}
  [DIR] Extracted Faces: {faces_folder}
  [DIR] Employee Database: {employee_db_folder}
  [DIR] Metadata: {metadata_folder}

KEY FILES:
  [FILE] Usage Guide: {metadata_folder / 'COMPREFACE_USAGE_GUIDE.md'}
  [FILE] Statistics: {metadata_folder / 'extraction_statistics.json'}
  [FILE] Execution Log: spi_pipeline.log

NEXT STEPS:
  1. Review extracted faces in {employee_db_folder}
  2. Group similar faces for same employee
  3. Upload to CompreFace for face encoding
  4. Use for real-time CCTV monitoring

For detailed instructions, see: {metadata_folder / 'COMPREFACE_USAGE_GUIDE.md'}
    """)
    
    logger.info("="*70)
    logger.info("[OK] PIPELINE EXECUTION COMPLETE")
    logger.info("="*70)
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except Exception as e:
        logger.error(f"Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
