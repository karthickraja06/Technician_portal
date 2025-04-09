from flask import Flask, jsonify, request
from flask_cors import CORS
from livereload import Server

app = Flask(__name__)
CORS(app)
processed_data = {}  # Store latest machine features
shared_data = None  # Placeholder for shared data

DATA_PATHS = {
    "bearing": "data/bearing_data.csv",
    "misalignment": "data/misalignment_data.csv",
    "normal": "data/normal_data.csv",
    "unbalance": "data/unbalance_data.csv"
}

@app.route('/machine_data')
def get_machine_data():
    return jsonify(processed_data)

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
    global shared_data
    data = request.json
    if "count" in data:
        shared_data["num_machines"] = data["count"]  # Update the shared variable
        print(f"Updated number of machines: {shared_data['num_machines']}")
        return jsonify({"message": "Machine count updated", "num_machines": shared_data["num_machines"]}), 200
    else:
        return jsonify({"error": "Count not provided"}), 400

def update_dashboard(result_queue):
    """ Updates the processed data for real-time visualization """
    global processed_data
    while True:
        machine_id, features = result_queue.get()
        processed_data[machine_id] = features

def run_server(shared):
    global shared_data
    shared_data = shared  # Assign the shared dictionary
    server = Server(app.wsgi_app)  # Wrap Flask app with livereload server
    server.watch('*.py')  # Watch for changes in Python files
    server.serve(host='127.0.0.1', port=8088, debug=True)