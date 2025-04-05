from collections import deque
import numpy as np
from feature_extraction import extract_feature
from predictor import predict_fault

ROLLING_WINDOW = 5
machine_buffers = {i: deque(maxlen=ROLLING_WINDOW) for i in range(1, 11)}

def process_data(queue, result_queue):
    """ Process incoming vibration data and extract features """
    while True:
        machine_id, data, expected = queue.get()
        machine_buffers[machine_id].append(data)  # Store in rolling buffer

        # Combine the rolling buffer into a single 2D array
        latest_data = np.vstack(machine_buffers[machine_id])  # Stack all buffered data vertically

        # Extract features from the latest data
        features = extract_feature(latest_data)  # Extract features (ensure this returns a 1D array)

        # Predict fault using the extracted features
        prediction = predict_fault(features)

        # Send processed data to the result queue
        result_queue.put((machine_id, {
            'expected': expected,  # Expected fault condition
            'predicted_fault': prediction['fault'],
            'confidence': prediction['confidence'],
            'models': {  # Individual model outputs
                'svm': prediction['svm'],
                'knn': prediction['knn'],
                'gnb': prediction['gnb']
            }
        }))
