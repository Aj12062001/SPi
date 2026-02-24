from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="SPi Simple Test API")

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

@app.get("/")
def read_root():
    return {"message": "Backend is running!", "status": "ok"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "face_recognition": "available"
    }

@app.get("/api/v1/status")
def status():
    return {
        "status": "operational",
        "backend": "available",
        "face_recognition": "available",
        "cctv": "available"
    }

@app.get("/api/v1/cctv/status")
def cctv_status():
    return {
        "status": "operational",
        "backend": "available",
        "face_recognition": "backend available",
        "cctv_monitoring": "active"
    }

@app.post("/cctv/analyze-video")
def analyze_video(file: UploadFile = None):
    return {
        "status": "success",
        "analyzed": True,
        "results": []
    }

@app.post("/api/v1/cctv/analyze-video")
def analyze_video_v1(file: UploadFile = None):
    return {
        "status": "success",
        "analyzed": True,
        "results": []
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)

