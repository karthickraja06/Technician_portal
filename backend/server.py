from flask import Flask, jsonify, request
from flask_cors import CORS
from livereload import Server
from datetime import datetime

app = Flask(__name__)
CORS(app)
processed_data = {}  # Store latest machine features
shared_data = {"num_machines": 1}  # Initialize with a num_machines key
machine_details = {}  # Store machine details like name, type, location

DATA_PATHS = {
    "bearing": "data/bearing_data.csv",
    "misalignment": "data/misalignment_data.csv",
    "normal": "data/normal_data.csv",
    "unbalance": "data/unbalance_data.csv",
    "feature":r"D:\karthick\machine learning\FYP\technician_portal\summa\backend\data\feature_VBL-VA001.csv"
}

@app.route('/machine_data')
def get_machine_data():
    response_data = {}
    for machine_id, data in processed_data.items():
        response_data[str(machine_id)] = {
            **data,
            **machine_details.get(str(machine_id), {})
        }
    return jsonify(response_data)

@app.route('/machine_data/<machine_id>', methods=['GET'])
def get_machine_data_by_id(machine_id):
    # Convert machine_id to string to match the dictionary keys
    
    machine_data = processed_data.get(int(machine_id))
    if machine_data:
        return jsonify({machine_id: machine_data})
    else:
        print(f"Machine ID {machine_id} not found in processed_data")  # Debug log
        return jsonify({"error": "Machine ID not found"}), 404

@app.route('/update_test_input', methods=['POST'])
def update_feature():
    global shared_data
    data = request.json  # Parse the incoming JSON data
    feature = data.get('feature')  # Extract the 'feature' key
    machine_id = data.get('machine_id')  # Extract the 'machine_id' key

    if feature and machine_id:
        
        if feature in DATA_PATHS:  # Ensure the feature is valid
            shared_data[machine_id] = feature  # Update the condition for the machine
            print(f"Updated machine {machine_id} to feature: {feature}")
            return jsonify({"message": "Feature updated successfully", "feature": feature, "machine_id": machine_id}), 200
        else:
            return jsonify({"error": "Invalid feature"}), 400
    else:
        return jsonify({"error": "Feature or machine_id not provided"}), 400

@app.route('/update_machine_count', methods=['POST'])
def update_machine_count():
    global shared_data, machine_details
    data = request.json
    print("Current shared_data:", shared_data)
    
    if "machine" in data:
        machine = data["machine"]
        machine_id = str(data.get("count"))  # Use count as ID
        
        # Store machine details
        machine_details[machine_id] = {
            "name": machine.get("name", f"Machine {machine_id}"),
            "type": machine.get("type", "Conveyor"),
            "location": machine.get("location", "Floor 1"),
            "lastMaintenance": machine.get("lastMaintenance", datetime.now().strftime("%Y-%m-%d")),
            "condition": "normal"  # Default condition
        }
        
        # Update machine count
        old_count = shared_data.get("num_machines", 0)
        shared_data["num_machines"] = data.get("count", old_count)
        shared_data[machine_id] = "normal"  # Initialize condition
        
        print(f"Machine count updated from {old_count} to {shared_data['num_machines']}")
        print("Updated shared_data:", shared_data)
        print("Updated machine_details:", machine_details)
        
        return jsonify({
            "message": "Machine added successfully",
            "num_machines": shared_data["num_machines"],
            "machine_id": machine_id,
            "details": machine_details[machine_id]
        }), 200
    else:
        return jsonify({"error": "Machine details not provided"}), 400

def update_dashboard(result_queue):
    """ Updates the processed data for real-time visualization """
    global processed_data
    while True:
        machine_id, features = result_queue.get()
        processed_data[machine_id] = features

def run_server(shared):
    global shared_data
    shared_data = shared  # Assign the shared dictionary
    if "num_machines" not in shared_data:
        shared_data["num_machines"] = 0  # Initialize if not present
    print("Initial shared_data:", shared_data)  # Debug log
    server = Server(app.wsgi_app)
    server.watch('*.py')
    server.serve(host='127.0.0.1', port=8088, debug=True)