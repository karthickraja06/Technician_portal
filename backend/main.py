from multiprocessing import Queue, Process, Manager
from data_stream import data_streaming
from data_processing import process_data
from server import run_server, update_dashboard
import threading

if __name__ == "__main__":
    manager = Manager()
    shared_data = manager.dict()  # Shared dictionary for inter-process communication
    
    shared_data["num_machines"] = 1  # Initialize num_machines

    # Initialize each machine's condition to "normal"
    # for machine_id in range(1, shared_data["num_machines"] + 1):
    #     shared_data[machine_id] = "normal"

    data_queue = Queue()
    result_queue = Queue()

    # Start data streaming processes
    processes = []
    for machine_id in range(1, shared_data["num_machines"] + 1):
        p = Process(target=data_streaming, args=(machine_id, data_queue, shared_data))
        p.start()
        processes.append(p)

    # Start data processing
    processing_process = Process(target=process_data, args=(data_queue, result_queue))
    processing_process.start()

    # Start Flask server
    threading.Thread(target=run_server, args=(shared_data,)).start()

    # Start updating dashboard
    update_dashboard(result_queue)
