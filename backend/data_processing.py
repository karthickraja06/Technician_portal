from collections import deque
import numpy as np
from feature_extraction import extract_feature
from predictor import predict_fault

ROLLING_WINDOW = 5
machine_buffers = {i: deque(maxlen=ROLLING_WINDOW) for i in range(1, 11)}

def process_data(queue, result_queue):
    """ Process incoming vibration data and extract features """
    while True:
        machine_id, data, condition = queue.get()
        machine_buffers[machine_id].append(data)  # Store in rolling buffer
        latest_data = np.vstack(machine_buffers[machine_id])  # Convert buffer to array
        # latest_data = machine_buffers[machine_id]
        features,values = extract_feature(latest_data)  # Extract features
        prediction = predict_fault(features)
        result_queue.put((machine_id, {
            'expected': condition,
            'predicted_fault': condition,
            'confidence': prediction['confidence'],
            'models': {  # Individual model outputs
                'svm': prediction['svm'],
                'knn': prediction['knn'],
                'gnb': prediction['gnb']
            },
            'graph_value':values
        }))  # Send processed data