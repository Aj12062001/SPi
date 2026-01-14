import cv2
import numpy as np
from PIL import Image
import os

# -------------------------------
# FACE RECOGNITION MODULE (SIMULATED)
# -------------------------------

# Since face-recognition library is not installed, simulate with OpenCV

def load_known_faces():
    # Placeholder: simulate known faces
    known_face_encodings = []  # In real, would be face encodings
    known_face_names = ["AAM0658", "ACM2278"]  # Sample users
    return known_face_encodings, known_face_names

def recognize_face(image_path):
    # Simulate recognition
    # In real, use cv2 or face_recognition
    # For now, randomly recognize or not
    import random
    known_names = ["AAM0658", "ACM2278", "Unknown"]
    recognized_users = [random.choice(known_names)]
    return recognized_users

# Simulate logging access
def log_physical_access(user, zone, authorized, face_recognized):
    # Append to physical_access.csv
    import pandas as pd
    new_row = pd.DataFrame([{
        'user': user,
        'timestamp': pd.Timestamp.now(),
        'zone': zone,
        'authorized': 'yes' if authorized else 'no',
        'face_recognized': 'yes' if face_recognized else 'no'
    }])
    new_row.to_csv("data/physical_access.csv", mode='a', header=False, index=False)

# Example usage (simulated)
if __name__ == "__main__":
    # Simulate recognition
    result = recognize_face("sample_image.jpg")
    if result and result[0] != "Unknown":
        log_physical_access(result[0], "restricted", True, True)
    print("Face recognition module loaded (simulated).")