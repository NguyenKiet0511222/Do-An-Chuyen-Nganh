# AI service — phân loại chất lượng nông sản qua ảnh

Python + **PyTorch** + FastAPI, model **MobileNetV2** (transfer learning từ ImageNet) phân loại **28 lớp** =
14 loại nông sản × {tươi, hỏng}. Spring Boot gọi service này qua REST; frontend **không** gọi thẳng.

> **Chưa biết gì về AI?** Đọc [`docs/GIAI-THICH-AI.md`](docs/GIAI-THICH-AI.md) trước — giải thích thuật ngữ,
> vì sao chọn MobileNetV2, pipeline train/serve và bản đồ bước ↔ file. README này chỉ là hướng dẫn thao tác.

## Cấu trúc

```
ai/
  ai/main.py                    FastAPI: nạp model, GET /health, POST /classify (bí danh /predict)
  models/mobilenetv2_fruitquality_best.pth   model đã train (~9 MB, CÓ commit)
  preprocessing/preprocess.py   chia dataset 70/15/15 (train/val/test)
  preprocessing/dataset_distribution.py      biểu đồ số ảnh mỗi lớp
  training/train.py             train MobileNetV2, lưu model val accuracy tốt nhất
  training/evaluate.py          đánh giá trên tập test -> results/
  results/                      metrics.txt, classification_report.txt, confusion_matrix.png, ...
  dataset/                      (gitignore) ảnh gốc + processed_dataset/
```

## Chạy service (máy nào chạy backend cũng nên chạy cái này)

```bash
cd ai
python -m venv .venv
.venv\Scripts\activate                     # Mac/Linux: source .venv/bin/activate
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
uvicorn ai.main:app --reload --port 8000
```

- Swagger: http://localhost:8000/docs
- `GET /health` → `model_loaded` phải là `true`, kèm `labels` (28 lớp) và `model_version`.
- `POST /classify` (hoặc `/predict`) — form-data field **`image`** → JSON (hợp đồng với backend, CLAUDE.md mục 7):

```json
{ "label": "apple_fresh", "produce_type": "apple", "condition": "fresh",
  "confidence": 0.9312, "all_scores": { "apple_fresh": 0.9312, "...": 0.0 }, "model_version": "mobilenetv2-pt-v1" }
```

| Tình huống | HTTP |
|---|---|
| Không phải ảnh / file rỗng | 400 |
| Ảnh hỏng, không đọc được | 422 |
| Thiếu / hỏng file model | 503 (service vẫn chạy, `/health` báo `model_loaded: false` + `error`) — backend đưa ảnh vào hàng chờ admin |

Biến môi trường tuỳ chọn: `MODEL_PATH` (mặc định `models/mobilenetv2_fruitquality_best.pth`), `MODEL_VERSION`
(mặc định `mobilenetv2-pt-v1` — **đổi mỗi khi train lại** để backend biết nhãn do model nào gắn).

## Kết quả model hiện tại

Tập test 4.410 ảnh (15% dataset, chưa từng dùng lúc train): **Accuracy 96,78% · Precision 96,89% · Recall 96,78% ·
F1 96,72%** — chi tiết từng lớp ở [`results/classification_report.txt`](results/classification_report.txt).

Lớp yếu cần thêm ảnh khi train lại: `bellpepper_rotten` (recall 0,61 — hay bị đoán nhầm sang lớp khác),
`carrot_rotten` (0,85), `jujube_rotten` (0,83), `potato_rotten` (0,83). Các lớp rau củ chỉ có ~90 ảnh test, ít hơn
hẳn táo/chuối/cam/xoài (300–440).

28 lớp: apple, banana, bellpepper, carrot, cucumber, grape, guava, jujube, mango, orange, pomegranate, potato,
strawberry, tomato — mỗi loại `_fresh` / `_rotten`.

## Train lại model

```bash
pip install -r requirements-train.txt
```

1. Đặt ảnh gốc vào `ai/dataset/fruitquality1/train/<loại>/{fresh,rotten}/` (dataset không commit — lấy từ Duy).
2. `python preprocessing/preprocess.py` → tạo `dataset/processed_dataset/{train,val,test}/<loại>_<tình trạng>/`
   (chia 70/15/15, `random.seed(42)` nên chạy lại vẫn ra đúng cách chia cũ).
3. (Tuỳ chọn) `python preprocessing/dataset_distribution.py` → `results/train_class_distribution.png`.
4. `python training/train.py` — 10 epoch, lưu model có **val accuracy** tốt nhất vào `models/`. Có GPU (CUDA) thì
   tự dùng, không thì chạy CPU (chậm, nên train trên Colab/máy có GPU).
5. `python training/evaluate.py` → cập nhật `results/` (metrics, classification report, confusion matrix).
6. Tăng `MODEL_VERSION`, commit file `.pth` mới + `results/`.

⚠️ **Tiền xử lý lúc phục vụ (`ai/main.py`) phải giống hệt `val_transform` lúc train** (resize về `image_size` lưu
trong checkpoint, `ToTensor`, chuẩn hoá mean/std ImageNet). Lệch là model vẫn chạy nhưng đoán sai dù % tin cậy cao.
Danh sách lớp và kích thước ảnh được đọc **từ chính checkpoint**, nên không phải chép tay `LABELS` như bản cũ.
