# EMOTUNE Dataset Report

## 1. Dataset Source

- **Name:** RAF-DB (Real-world Affective Faces Database)
- **Source:** [Kaggle Face Expression Recognition Dataset](https://www.kaggle.com/datasets/jonathanoheix/face-expression-recognition-dataset)
- **License:** Available for non-commercial research purposes.
- **Description:** The dataset consists of thousands of `100x100` pixel aligned color images of faces. Each image has been independently labeled by about 40 human annotators.

---

## 2. Emotion Classes

The model was trained on the 7 basic emotion classes provided by the dataset:
- Angry
- Disgust
- Fear
- Happy
- Neutral
- Sad
- Surprise

**Note:** All seven classes from the dataset were used.

---

## 3. Preprocessing and Augmentation

- **Image Format:** Images were loaded in color (RGB) format to be compatible with the pre-trained `MobileNetV2` model.
- **Resizing:** All images were resized to **`224x224` pixels** to match the optimal input size for the architecture.
- **Normalization:** Pixel values were rescaled from the `[0, 255]` range to the `[0, 1]` range using the `rescale` parameter in the data generator.
- **Augmentation:** The following augmentations were applied only to the training set to improve model generalization:
    - Rotation range: 20 degrees
    - Width and height shift range: 20%
    - Zoom range: 20%
    - Horizontal flips

---

## 4. Dataset Split

The dataset was split into training, validation, and testing sets with the following image counts based on the final successful training run:

| Split      | Count |
| :--------- | :---- |
| Training   | 10,434 |
| Validation | 1,837  |
| Test       | 3,068  |

---

## 5. Notes on Quality

- **Image Quality:** Images are higher-resolution (`100x100` native) and are considered "clean" compared to other common benchmarks.
- **Label Quality:** RAF-DB is a high-quality dataset with reliable labels due to being annotated by multiple human subjects.
- **Imbalance:** The distribution of classes is slightly imbalanced. This was addressed during the final training runs by calculating and applying `class_weights` to encourage the model to pay more attention to rarer classes.

# 6. Folder Structure
ml/
├─ data/
│ ├─ raw/
│ │ ├─ train/
│ │ ├─ test/
│ ├─ processed/
│ ├─ train/
│ ├─ val/
│ ├─ test/


- Each split contains one subfolder per emotion label.

---



