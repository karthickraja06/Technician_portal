from flask import Flask, request, jsonify
from multiprocessing import Queue, Process
from data_stream import data_streaming
from data_processing import process_data
from server import run_server, update_dashboard
import threading

app = Flask(__name__)

# Global variable for the number of machines
num_machines = 2

@app.route('/update_machine_count', methods=['POST'])
def update_machine_count():
    global num_machines
    data = request.json
    num_machines = data.get('count', num_machines)
    print(f"Updated number of machines: {num_machines}")
    return jsonify({"message": "Machine count updated", "num_machines": num_machines})

if __name__ == "__main__":
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
