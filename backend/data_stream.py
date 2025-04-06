import pandas as pd
import time
import random

DATA_PATHS = {
    "bearing": "data/bearing_data.csv",
    "misalignment": "data/misalignment_data.csv",
    "normal": "data/normal_data.csv",
    "unbalance": "data/unbalance_data.csv"
    # "feature": "data/feature_VBL-VA001.csv"
}

def load_random_vibration_data():
    condition = random.choice(list(DATA_PATHS.keys()))  # Pick a random fault condition
    df = pd.read_csv(
        DATA_PATHS[condition], 
        skiprows=random.randint(0, 900),  # Skip random rows
        nrows=100,  # Read only 100 rows
        header=None,  # No headers in the file
        names=['time', 'x', 'y', 'z']  # Explicit column names
    )  # Load small chunk
    return (df[['time', 'x', 'y', 'z']].values,condition) # Return NumPy array

def data_streaming(machine_id, queue):
    """ Simulates real-time streaming of vibration data for a machine """
    while True:
        data, condition = load_random_vibration_data()
        queue.put((machine_id, data, condition))  # Send to processing queue
        time.sleep(1/20)  # Simulate real-time arrival of data