# Final Model Design Plan

This document outlines the design, training, and evaluation plan for the final, high-performance model for the EmoTune project. This architecture supersedes the initial baseline plan.

---

## 1. Output Classes

The model is a multi-class classifier trained to predict one of the following **7 emotions**:
- Angry
- Disgust
- Fear
- Happy
- Neutral
- Sad
- Surprise

---

## 2. Input Format

To leverage a powerful pre-trained architecture, the model accepts images in the following format:
- **Image Size:** `224x224` pixels (upscaled from the dataset's native resolution).
- **Color Channel:** Color (RGB, 3 channels).
- **Input Shape:** `(224, 224, 3)`.

---

## 3. Final Model Architecture (Transfer Learning)

A transfer learning approach was used with the **`MobileNetV2`** architecture.
- **Base Model:** `MobileNetV2` pre-trained on the ImageNet dataset was used as a feature extractor.
- **Fine-Tuning Strategy:** The bottom 70% of the base model's layers were frozen, while the top 30% were unfrozen and made trainable. This allowed the model to adapt its pre-learned features to the specific task of emotion recognition.
- **Custom Classification Head:** A new classifier was added on top of the base model, consisting of:
    - A `GlobalAveragePooling2D` layer.
    - A `Dropout` layer with a rate of 0.4 for regularization.
    - A final `Dense` output layer with **Softmax** activation for the 7 emotion classes.

---

## 4. Training Parameters

The final, successful training run used the following settings:
- **Loss Function:** `categorical_crossentropy`.
- **Optimizer:** `Adam` with a fine-tuning learning rate starting at `1e-4`.
- **Batch Size:** `32`.
- **Epochs:** Trained for a maximum of 40 epochs, using `EarlyStopping` to find the optimal stopping point.
- **Class Imbalance:** `class_weights` were calculated and applied during training to handle the imbalance in the number of images per emotion.
- **Callbacks:** `EarlyStopping` (patience=6) and `ReduceLROnPlateau` (patience=3) were used for an efficient and effective training process.

---

## 5. Evaluation Metrics

Model performance was evaluated using the following metrics:
- **Overall Accuracy** 
- **Per-class F1-Score** 
- **Confusion Matrix** 

---

## 6. Logging and Saving Convention

All artifacts from training runs are saved and organized as follows:
- **Trained Models:** Saved in the `ml/models/` directory.
- **Final Model Name:** `mobilenetv2_rafdb_1.h5`
