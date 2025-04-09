import pandas as pd
import time
import random

DATA_PATHS = {
    "bearing": "data/bearing_data.csv",
    "misalignment": "data/misalignment_data.csv",
    "normal": "data/normal_data.csv",
    "unbalance": "data/unbalance_data.csv"
}

def data_streaming(machine_id, queue, shared_data):
    """ Simulates real-time streaming of vibration data for a machine """
    while True:
        # Get the current condition for the machine
        condition = shared_data.get(str(machine_id), "normal")  # Default to "normal"
        file_path = DATA_PATHS[condition]  # Get the file path for the condition
        # Load data from the corresponding file
        df = pd.read_csv(
            file_path,
            skiprows=random.randint(0, 10000),  # Skip random rows
            nrows=100,  # Read only 100 rows
            header=None,  # No headers in the file
            names=['time', 'x', 'y', 'z']  # Explicit column names
        )
        queue.put((machine_id, df[['time', 'x', 'y', 'z']].values, condition))  # Send to processing queue
        time.sleep(1)  # Simulate real-time arrival of data