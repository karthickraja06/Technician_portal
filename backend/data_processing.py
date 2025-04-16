from collections import deque
from feature_extraction import extract_feature
from predictor import predict_fault

ROLLING_WINDOW = 5
machine_buffers = {i: deque(maxlen=ROLLING_WINDOW) for i in range(1, 11)}

def process_data(queue, result_queue):
    """ Process incoming vibration data and send directly to prediction """
    while True:
        machine_id, data, condition = queue.get()
        
        # Directly send the data to predict_fault
        prediction = predict_fault(data)

        # Use the same data for graph_value
        graph_value = {
            "x": {
                'rms': float(data[0][3]),  # Assuming 'x' is in the 2nd column
                'kurtosis': float(data[0][6]),  # Assuming 'y' is in the 3rd column
                'pp': float(data[0][5]),  # Assuming 'z' is in the 4th column
                'crestf': float(data[0][7])  # Example: duplicate 'z' for crestf
            },
            "y": {
                'rms': float(data[0][3 + 9]),
                'kurtosis': float(data[0][6 + 9]),
                'pp': float(data[0][5 + 9]),
                'crestf': float(data[0][7 + 9])
            },
            "z": {
                'rms': float(data[0][3 + 18]),
                'kurtosis': float(data[0][6 + 18]),
                'pp': float(data[0][5 + 18]),
                'crestf': float(data[0][7 + 18])
            }
        }

        # Send the processed data to the result queue
        result_queue.put((machine_id, {
            'expected': condition,
            'predicted_fault': prediction['fault'],  # Assuming predict_fault returns this
            'confidence': prediction['confidence'],  # Assuming predict_fault returns confidence
            'models': {  # Individual model outputs
                'svm': prediction['svm'],
                'knn': prediction['knn'],
                'gnb': prediction['gnb']
            },
            'graph_value': graph_value
        }))