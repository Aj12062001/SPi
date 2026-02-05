import os
from PIL import Image, ImageDraw
import numpy as np
import cv2

base_dir = r"f:\main project\SPi-main\public\demo_cctv"
os.makedirs(base_dir, exist_ok=True)

employees = [
    ("AAE0190", (46, 204, 113)),
    ("ABC0174", (59, 130, 246)),
    ("UNKNOWN", (239, 68, 68)),
]

for name, color in employees:
    img = Image.new("RGB", (400, 400), (15, 23, 42))
    draw = ImageDraw.Draw(img)
    draw.ellipse((80, 60, 320, 300), fill=color)
    draw.text((120, 320), name, fill=(255, 255, 255))
    img.save(os.path.join(base_dir, f"employee_{name}.jpg"))

video_path = os.path.join(base_dir, "cctv_demo.mp4")
width, height = 640, 360
fps = 12
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(video_path, fourcc, fps, (width, height))

frames = fps * 6
for i in range(frames):
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (15, 23, 42)

    for idx, (name, color) in enumerate(employees):
        cx = 80 + idx * 200 + int(20 * np.sin(i / 5))
        cy = 120 + int(30 * np.cos(i / 7 + idx))
        cv2.circle(frame, (cx, cy), 45, color[::-1], -1)
        cv2.putText(frame, name, (cx - 45, cy + 70), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1)

    cv2.putText(frame, "CCTV DEMO", (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)
    writer.write(frame)

writer.release()
print("Created demo assets in", base_dir)
