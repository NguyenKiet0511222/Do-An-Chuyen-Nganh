# File chính của AI Service (FastAPI).
# Nhận ảnh đầu vào -> tiền xử lý GIỐNG HỆT lúc train -> MobileNetV2 -> trả JSON theo hợp đồng
# với Spring Boot (CLAUDE.md mục 7). Chỉ backend gọi service này (app.ai.base-url), frontend KHÔNG gọi thẳng.
#
# Chạy (đứng trong thư mục ai/):  uvicorn ai.main:app --reload --port 8000
# Swagger:                         http://localhost:8000/docs

import io
import os
import sys
from pathlib import Path

import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image, UnidentifiedImageError

from fastapi import FastAPI, UploadFile, File, HTTPException

# Windows ghi output ra file / chạy nền dùng mã cp1252 -> in tiếng Việt bị UnicodeEncodeError làm sập
# service ngay lúc khởi động. Ép stdout sang UTF-8 (không đổi gì khi chạy trong terminal bình thường).
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ============================================================
# 1. ĐƯỜNG DẪN + CẤU HÌNH (ghi đè được bằng biến môi trường)
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

MODEL_PATH = Path(os.getenv(
    "MODEL_PATH",
    BASE_DIR / "models" / "mobilenetv2_fruitquality_best.pth"
))
if not MODEL_PATH.is_absolute():
    MODEL_PATH = BASE_DIR / MODEL_PATH  # đường dẫn tương đối luôn tính từ thư mục ai/, không phụ thuộc nơi chạy lệnh

# Ghi vào kết quả để backend biết nhãn do model nào gắn (đổi khi train lại)
MODEL_VERSION = os.getenv("MODEL_VERSION", "mobilenetv2-pt-v1")

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)


# ============================================================
# 2. LOAD MODEL
# ============================================================

def load_model(path: Path):
    """Nạp checkpoint do training/train.py lưu.

    Trả về (model, class_names, image_size, lỗi). Thiếu / hỏng file thì model = None nhưng service
    vẫn chạy: /health báo model_loaded=false, /classify trả 503 -> backend đưa ảnh vào hàng chờ admin
    (nguyên tắc "AI không được chặn tiến độ web", CLAUDE.md mục 2).
    """
    if not path.exists():
        return None, [], 128, f"Không tìm thấy file model: {path}"
    try:
        checkpoint = torch.load(path, map_location=DEVICE)

        names = list(checkpoint["class_names"])
        size = int(checkpoint.get("image_size", 128))

        net = models.mobilenet_v2(weights=None)
        net.classifier[1] = nn.Linear(
            net.classifier[1].in_features,
            checkpoint["num_classes"]
        )
        net.load_state_dict(checkpoint["model_state_dict"])
        net = net.to(DEVICE)
        net.eval()
        return net, names, size, None
    except Exception as e:  # file hỏng, sai kiến trúc...
        return None, [], 128, f"Không nạp được model: {e}"


model, class_names, IMAGE_SIZE, load_error = load_model(MODEL_PATH)

if load_error:
    print(f"[AI] CẢNH BÁO: {load_error} -> /classify sẽ trả 503")
else:
    print(f"[AI] Đã nạp {MODEL_PATH.name}: {len(class_names)} lớp, ảnh {IMAGE_SIZE}x{IMAGE_SIZE}, {DEVICE}")


# ============================================================
# 3. XỬ LÝ ẢNH — PHẢI GIỐNG HỆT val_transform trong training/train.py
#    (lệch là model vẫn chạy nhưng đoán sai dù % tin cậy vẫn cao)
# ============================================================

transform = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# ============================================================
# 4. FASTAPI
# ============================================================

app = FastAPI(
    title="Nhóm 5 - AI Service phân loại nông sản",
    description="Nhận ảnh nông sản, trả về loại nông sản + tươi/hỏng + độ tin cậy (MobileNetV2, PyTorch).",
    version="1.0"
)


# ============================================================
# 5. HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "UP",
        "model_loaded": model is not None,
        "model_version": MODEL_VERSION if model is not None else None,
        "num_classes": len(class_names),
        "labels": class_names,
        "device": str(DEVICE),
        "error": load_error
    }


# ============================================================
# 6. PHÂN LOẠI ẢNH
# ============================================================

@app.post("/classify", summary="Phân loại 1 ảnh (backend gọi endpoint này)")
@app.post("/predict", summary="Bí danh của /classify (giữ cho tương thích)")
def classify(image: UploadFile = File(...)):
    """Hợp đồng với Spring Boot (CLAUDE.md mục 7) — giữ nguyên tên field khi đổi model:

    {
      "label": "apple_fresh",          # tên lớp lúc train ({loại}_{tình trạng})
      "produce_type": "apple",
      "condition": "fresh",            # fresh | rotten
      "confidence": 0.9312,            # 0..1 -> backend so với ngưỡng auto-accept
      "all_scores": {"apple_fresh": 0.9312, ...},
      "model_version": "mobilenetv2-pt-v1"
    }
    """
    if model is None:
        raise HTTPException(
            status_code=503,
            detail=f"Model chưa được nạp: {load_error}"
        )

    # Kiểm tra file ảnh
    if not image.content_type or not image.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400,
            detail="File tải lên phải là hình ảnh (jpg/png/webp)."
        )

    image_bytes = image.file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="File ảnh rỗng.")

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except (UnidentifiedImageError, OSError) as e:
        raise HTTPException(
            status_code=422,
            detail=f"Không đọc được ảnh: {e}"
        )

    # Preprocess -> batch 1 ảnh
    input_tensor = transform(img).unsqueeze(0).to(DEVICE)

    # Dự đoán
    with torch.no_grad():
        probabilities = torch.softmax(model(input_tensor), dim=1)[0]

    best = int(torch.argmax(probabilities).item())
    label = class_names[best]

    # Tách tên nông sản và tình trạng: "bellpepper_rotten" -> ("bellpepper", "rotten")
    parts = label.rsplit("_", 1)
    produce_type, condition = (parts[0], parts[1]) if len(parts) == 2 else (label, "unknown")

    return {
        "label": label,
        "produce_type": produce_type,
        "condition": condition,
        "confidence": round(float(probabilities[best]), 4),
        "all_scores": {
            name: round(float(p), 4)
            for name, p in zip(class_names, probabilities.tolist())
        },
        "model_version": MODEL_VERSION
    }
