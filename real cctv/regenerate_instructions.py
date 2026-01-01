"""
Quick fix to generate CompreFace instructions after processing
"""

from face_recognition import setup_face_recognition_pipeline
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

base_path = Path(r"d:\Main File store\Ajin\Project\cctv footage for spi\real cctv")
compreface_path = base_path / "CompreFace-master"

# Run face recognition organization only
setup_face_recognition_pipeline(base_path, compreface_path)
