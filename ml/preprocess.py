import os
import numpy as np
from PIL import Image

# Base folder for processed data (absolute or relative)
processed_data_dir = os.path.join(os.getcwd(), 'data', 'processed')  
# Points to: C:\Users\sures\EMOTUNE\ML\data\processed

# Image size
IMG_SIZE = 48

# Splits
splits = ['train', 'val', 'test']

for split in splits:
    split_path = os.path.join(processed_data_dir, split)
    print(f'Processing {split} set...')
    
    images = []
    labels = []
    
    classes = os.listdir(split_path)
    classes.sort()  # Ensure same order every time
    
    for idx, emotion in enumerate(classes):
        emotion_path = os.path.join(split_path, emotion)
        if not os.path.isdir(emotion_path):
            continue
        
        for img_file in os.listdir(emotion_path):
            img_path = os.path.join(emotion_path, img_file)
            
            # Skip non-image files
            if not img_file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                continue

            # Open, convert to grayscale, resize
            img = Image.open(img_path).convert('L')
            img = img.resize((IMG_SIZE, IMG_SIZE))
            
            # Normalize pixels to [0,1]
            img_array = np.array(img) / 255.0
            images.append(img_array)
            labels.append(idx)
    
    # Convert lists to numpy arrays
    X = np.array(images)
    y = np.array(labels)
    
    # Save processed arrays
    np.save(os.path.join(processed_data_dir, f'{split}_X.npy'), X)
    np.save(os.path.join(processed_data_dir, f'{split}_y.npy'), y)
    
    print(f'{split} set processed: {X.shape[0]} images, shape {X.shape[1:]}')

print('Preprocessing complete!')
