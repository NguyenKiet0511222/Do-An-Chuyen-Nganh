# Thống kê số lượng ảnh của từng class trong dataset.
# Dùng để kiểm tra dataset có bị mất cân bằng giữa các class hay không.
# Kết quả có thể được dùng để tạo biểu đồ phân bố dữ liệu.

import sys
from pathlib import Path
import matplotlib.pyplot as plt

# Windows ghi log ra file dùng mã cp1252 -> print tiếng Việt bị UnicodeEncodeError làm dừng script
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")


# ============================================================
# 1. XÁC ĐỊNH ĐƯỜNG DẪN DATASET
# ============================================================

BASE_DIR = Path(__file__).resolve().parent.parent

DATASET_DIR = BASE_DIR / "dataset" / "processed_dataset"

TRAIN_DIR = DATASET_DIR / "train"

# Dataset không commit lên git -> máy mới clone về sẽ chưa có thư mục này
if not TRAIN_DIR.exists():
    print("\nERROR: Không tìm thấy thư mục train!")
    print(TRAIN_DIR)
    print("Chạy preprocessing/preprocess.py trước (cần ảnh gốc trong dataset/fruitquality1/train).")
    sys.exit(1)


# ============================================================
# 2. ĐẾM SỐ ẢNH CỦA TỪNG CLASS
# ============================================================

classes = []
image_counts = []

image_extensions = {
    ".jpg",
    ".jpeg",
    ".png",
    ".bmp",
    ".webp"
}


for class_dir in sorted(TRAIN_DIR.iterdir()):

    if not class_dir.is_dir():
        continue

    count = 0

    for image_file in class_dir.iterdir():

        if image_file.is_file() and image_file.suffix.lower() in image_extensions:
            count += 1

    classes.append(class_dir.name)
    image_counts.append(count)


# ============================================================
# 3. IN KẾT QUẢ RA MÀN HÌNH
# ============================================================

print("=" * 60)
print("PHÂN BỐ SỐ LƯỢNG ẢNH THEO CLASS - TRAINING")
print("=" * 60)

for class_name, count in zip(classes, image_counts):
    print(f"{class_name:<25} : {count}")


print("-" * 60)
print(f"Tổng số class : {len(classes)}")
print(f"Tổng số ảnh   : {sum(image_counts)}")


# ============================================================
# 4. VẼ BIỂU ĐỒ
# ============================================================

plt.figure(figsize=(18, 9))

bars = plt.bar(
    classes,
    image_counts
)

plt.title(
    "Phân bố số lượng ảnh theo Class - Training",
    fontsize=16
)

plt.xlabel(
    "Class",
    fontsize=12
)

plt.ylabel(
    "Số lượng ảnh",
    fontsize=12
)

# Xoay tên class để không bị chồng lên nhau
plt.xticks(
    rotation=90,
    fontsize=9
)

# Hiển thị số lượng trên đầu mỗi cột
for bar, count in zip(bars, image_counts):

    plt.text(
        bar.get_x() + bar.get_width() / 2,
        bar.get_height() + 5,
        str(count),
        ha="center",
        va="bottom",
        fontsize=8
    )


plt.grid(
    axis="y",
    alpha=0.3
)

plt.tight_layout()


# ============================================================
# 5. LƯU ẢNH
# ============================================================

RESULTS_DIR = BASE_DIR / "results"

RESULTS_DIR.mkdir(
    exist_ok=True
)

OUTPUT_FILE = RESULTS_DIR / "train_class_distribution.png"

plt.savefig(
    OUTPUT_FILE,
    dpi=200,
    bbox_inches="tight"
)

print()
print("=" * 60)
print("ĐÃ TẠO BIỂU ĐỒ")
print("=" * 60)
print(f"File: {OUTPUT_FILE}")


# Hiển thị biểu đồ
plt.show()