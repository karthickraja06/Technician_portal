from flask import Flask, jsonify
from flask_cors import CORS
from livereload import Server

app = Flask(__name__)
CORS(app)
processed_data = {}  # Store latest machine features

@app.route('/machine_data')
def get_machine_data():
    return jsonify(processed_data)

def update_dashboard(result_queue):
    """ Updates the processed data for real-time visualization """
    global processed_data
    while True:
        machine_id, features = result_queue.get()
        processed_data[machine_id] = features

def run_server():
    server = Server(app.wsgi_app)  # Wrap Flask app with livereload server
    server.watch('*.py')  # Watch for changes in Python files
    server.serve(host='127.0.0.1', port=5000, debug=True)
#http://127.0.0.1:5000/update_machine_count