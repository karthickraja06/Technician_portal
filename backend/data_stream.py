import pandas as pd
import time
import random

def data_streaming(machine_id, queue, shared_data):
    """ Simulates real-time streaming of vibration data for a machine """
    while True:
        # Get the current condition for the machine
        condition = shared_data.get(str(machine_id), "normal")  # Default to "normal"

        # Always use the feature file
        file_path = r"D:\karthick\machine learning\FYP\technician_portal\summa\backend\data\feature_VBL-VA001.csv"

        # Determine the row range based on the condition
        if condition == "normal":
            start_row, end_row = 0, 1000
        elif condition == "misalignment":
            start_row, end_row = 1001, 2000
        elif condition == "unbalance":
            start_row, end_row = 2001, 3000
        elif condition == "bearing":
            start_row, end_row = 3001, 4000
        else:
            start_row, end_row = 0, 1000  # Default to normal condition

        # Randomly select a row within the specified range
        random_row = random.randint(start_row, end_row - 1)

        # Load the selected row from the feature file
        df = pd.read_csv(
            file_path,
            skiprows=random_row,  # Skip to the randomly selected row
            nrows=1,  # Read only one row
            header=None,  # No headers in the file
        )

        # Send the data to the processing queue
        queue.put((machine_id, df.values, condition))

        # Simulate real-time arrival of data
        time.sleep(1)