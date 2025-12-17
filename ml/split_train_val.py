import os
import shutil
import random

# --- Absolute paths (Windows-friendly) ---
raw_train = r"C:\Users\sures\EMOTUNE\ML\data\raw\train"
raw_test  = r"C:\Users\sures\EMOTUNE\ML\data\raw\test"

processed_train = r"C:\Users\sures\EMOTUNE\ML\data\processed\train"
processed_val   = r"C:\Users\sures\EMOTUNE\ML\data\processed\val"
processed_test  = r"C:\Users\sures\EMOTUNE\ML\data\processed\test"

# Make sure folders exist
os.makedirs(processed_train, exist_ok=True)
os.makedirs(processed_val, exist_ok=True)
os.makedirs(processed_test, exist_ok=True)

def split_data(raw_folder, proc_train, proc_val, train_ratio=0.7, val_ratio=0.15):
    for emotion in os.listdir(raw_folder):
        emotion_path = os.path.join(raw_folder, emotion)
        if not os.path.isdir(emotion_path):
            continue

        images = os.listdir(emotion_path)
        random.shuffle(images)

        n_total = len(images)
        n_train = int(train_ratio * n_total)
        n_val = int(val_ratio * n_total)

        train_images = images[:n_train]
        val_images = images[n_train:n_train+n_val]
        test_images = images[n_train+n_val:]

        # Create folders in processed
        os.makedirs(os.path.join(proc_train, emotion), exist_ok=True)
        os.makedirs(os.path.join(proc_val, emotion), exist_ok=True)
        os.makedirs(os.path.join(processed_test, emotion), exist_ok=True)

        # Copy files
        for img in train_images:
            shutil.copy(os.path.join(emotion_path, img), os.path.join(proc_train, emotion, img))
        for img in val_images:
            shutil.copy(os.path.join(emotion_path, img), os.path.join(proc_val, emotion, img))
        for img in test_images:
            shutil.copy(os.path.join(emotion_path, img), os.path.join(processed_test, emotion, img))

        print(f"{emotion}: {len(train_images)} train, {len(val_images)} val, {len(test_images)} test images")

# Split train data
split_data(raw_train, processed_train, processed_val)

# Copy test data as-is
for emotion in os.listdir(raw_test):
    emotion_path = os.path.join(raw_test, emotion)
    if not os.path.isdir(emotion_path):
        continue
    os.makedirs(os.path.join(processed_test, emotion), exist_ok=True)
    for img in os.listdir(emotion_path):
        shutil.copy(os.path.join(emotion_path, img), os.path.join(processed_test, emotion, img))

print("Dataset split complete!")
