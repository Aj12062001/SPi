import os
import cv2
import numpy as np
from PIL import Image

base_dir = r"f:\main project\SPi-main\public\demo_cctv"
img_paths = [
    os.path.join(base_dir, "person1.png"),
    os.path.join(base_dir, "person2.png"),
    os.path.join(base_dir, "person3.png"),
]

# Load images
people = []
for path in img_paths:
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    img = Image.open(path).convert("RGB")
    people.append(np.array(img))

# Video settings
width, height = 1280, 720
fps = 12
duration_seconds = 50
frames = fps * duration_seconds

video_path = os.path.join(base_dir, "cctv_demo_real.mp4")
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
writer = cv2.VideoWriter(video_path, fourcc, fps, (width, height))

# Entrance times (seconds)
entrance_times = [0, 15, 30]

# Person positions
start_x = -300
end_x = 220
lane_y = [220, 360, 500]

# Resize person images to fit scene
resized_people = []
for person in people:
    h, w = person.shape[:2]
    scale = 0.45
    new_w, new_h = int(w * scale), int(h * scale)
    resized = cv2.resize(person, (new_w, new_h))
    resized_people.append(resized)

for frame_idx in range(frames):
    t = frame_idx / fps
    frame = np.zeros((height, width, 3), dtype=np.uint8)
    frame[:] = (18, 24, 38)  # dark background

    # Draw room box
    cv2.rectangle(frame, (140, 120), (1140, 640), (30, 40, 60), 2)
    cv2.putText(frame, "ROOM ENTRY", (160, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 180, 180), 2)
    cv2.putText(frame, f"Time: {t:05.1f}s", (1000, 100), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 2)

    # Draw each person if their entrance time has passed
    for i in range(3):
        if t >= entrance_times[i]:
            # Move in from left to entry point in 5 seconds
            progress = min(1.0, (t - entrance_times[i]) / 5.0)
            x = int(start_x + (end_x - start_x) * progress)
            y = lane_y[i]
            person = resized_people[i]
            ph, pw = person.shape[:2]

            # Composite person image
            x1, y1 = max(0, x), max(0, y)
            x2, y2 = min(width, x + pw), min(height, y + ph)

            if x1 < x2 and y1 < y2:
                px1, py1 = x1 - x, y1 - y
                px2, py2 = px1 + (x2 - x1), py1 + (y2 - y1)
                frame[y1:y2, x1:x2] = person[py1:py2, px1:px2]

            cv2.putText(frame, f"Person {i+1}", (x + 10, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1)

    writer.write(frame)

writer.release()
print("Created video:", video_path)
