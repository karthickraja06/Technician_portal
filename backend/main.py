# # api/main.py
#   
# from fastapi import FastAPI
# from predictor import predict_fault
# from simulator import MachineDataSimulator
# import numpy as np

# app = FastAPI()
# simulator = MachineDataSimulator("data/dummy_data.csv")

# @app.get("/api/all-machines")
# def get_all_machines():
#     data = simulator.get_all_machines_data()
#     for machine, values in data.items():
#         features = np.array([[values['x'], values['y'], values['z']]])
#         prediction = predict_fault(features)
#         data[machine].update({
#             'predicted_fault': prediction['fault'],
#             'confidence': prediction['confidence'],
#             'models': {  # Individual model outputs
#                 'svm': prediction['svm'],
#                 'knn': prediction['knn'],
#                 'gnb': prediction['gnb']
#             }
#         })
#     return data
# print(get_all_machines())
from multiprocessing import Queue, Process
from data_stream import data_streaming
from data_processing import process_data
from server import run_server, update_dashboard
import threading


if __name__ == "__main__":
    
    num_machines = 2
    data_queue = Queue()
    result_queue = Queue()

    # Start data streaming processes
    processes = []
    for machine_id in range(1, num_machines + 1):
        p = Process(target=data_streaming, args=(machine_id, data_queue))
        p.start()
        processes.append(p)

    # Start data processing
    processing_process = Process(target=process_data, args=(data_queue, result_queue))
    processing_process.start()

    # Start Flask server
    threading.Thread(target=run_server).start()

    # Start updating dashboard
    update_dashboard(result_queue)
