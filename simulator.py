import pandas as pd
from typing import Dict

class MachineDataSimulator:
    def __init__(self, csv_path: str):
        self.data = pd.read_csv(csv_path)
        self.machines = self.data['machine_id'].unique()
        self.pointers = {machine: 0 for machine in self.machines}  # Track data position

    def get_all_machines_data(self) -> Dict[str, Dict]:
        """Simulate real-time data for all machines from the dataset"""
        results = {}
        for machine in self.machines:
            machine_data = self.data[self.data['machine_id'] == machine]
            row = machine_data.iloc[self.pointers[machine] % len(machine_data)]
            self.pointers[machine] += 1
            
            results[machine] = {
                "time": row['time'],
                "x": row['x'],
                "y": row['y'],
                "z": row['z'],
                "fault_type": row.get('fault_type', 'normal')  # Fallback if column missing
            }
        print(results)
        return results  