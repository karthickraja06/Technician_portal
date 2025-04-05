import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Clock, Settings, AlertCircle, Grid, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

// Types
interface VibrationData {
  timestamp: number;
  x: number;
  y: number;
  z: number;
}

interface MachineStatus {
  status: 'normal' | 'warning' | 'fault';
  rul: number;
  alerts: string[];
}

interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  lastMaintenance: string;
  status: MachineStatus;
  vibrationData: VibrationData[];
}

// Simulated data generation
const generateVibrationData = (): VibrationData => ({
  timestamp: Date.now(),
  x: Math.sin(Date.now() / 1000) + Math.random() * 0.5,
  y: Math.cos(Date.now() / 1000) + Math.random() * 0.5,
  z: Math.sin(Date.now() / 500) + Math.random() * 0.5,
});

// This is where we are deciding the machine status based on the vibration data
const simulateMachineStatus = (data: VibrationData[]): MachineStatus => {
  const maxVibration = Math.max(...data.flatMap(d => [d.x, d.y, d.z]));
  const status = maxVibration > 2 ? 'fault' : maxVibration > 1.5 ? 'warning' : 'normal';
  const rul = Math.max(0, 45 - Math.floor(maxVibration * 10));
  const alerts = [];
  
  if (rul < 7) {
    alerts.push('Critical: Maintenance required within 7 days');
  }
  if (maxVibration > 1.8) {
    alerts.push('Warning: Abnormal vibration detected');
  }
  
  return { status, rul, alerts };
};

// Generate initial machines data
const generateMachines = (): Machine[] => {
  return Array.from({ length: 8 }, (_, i) => {
    const vibrationData = [generateVibrationData()];
    const status = simulateMachineStatus(vibrationData);
    return {
      id: `MACHINE-${String(i + 1).padStart(3, '0')}`,
      name: `Production Unit ${i + 1}`,
      type: ['Conveyor', 'Pump', 'Motor', 'Generator'][i % 4],
      location: ['Floor 1', 'Floor 2', 'Floor 3'][Math.floor(i / 3)],
      lastMaintenance: format(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status,
      vibrationData,
    };
  });
};

function App() {
  const [machines, setMachines] = useState<Machine[]>(generateMachines());
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'Conveyor',
    location: 'Floor 1'
  });

  const url  = "http://127.0.0.1:5000"
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${url}/machine_data`);
        setMachines(response.data);
      } catch (error) {
        console.error('Error fetching machines data:', error);
      }
    };

    fetchData();
  }
, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setMachines(prev => prev.map(machine => {
        const newData = generateVibrationData();
        const updatedVibrationData = [...machine.vibrationData, newData].slice(-50);
        return {
          ...machine,
          vibrationData: updatedVibrationData,
          status: simulateMachineStatus(updatedVibrationData),
        };
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    normal: 'bg-emerald-500',
    warning: 'bg-amber-500',
    fault: 'bg-red-500',
  };

  const handleAddMachine = () => {
    if (!newMachine.name) return;

    const newId = `MACHINE-${String(machines.length + 1).padStart(3, '0')}`;
    const vibrationData = [generateVibrationData()];
    const status = simulateMachineStatus(vibrationData);

    const machine: Machine = {
      id: newId,
      name: newMachine.name,
      type: newMachine.type,
      location: newMachine.location,
      lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
      status,
      vibrationData,
    };

    setMachines(prev => [...prev, machine]);
    setNewMachine({ name: '', type: 'Conveyor', location: 'Floor 1' });
    setIsAddingMachine(false);
  };

  const handleRemoveMachine = (machineId: string) => {
    setMachines(prev => prev.filter(machine => machine.id !== machineId));
    if (selectedMachine?.id === machineId) {
      setSelectedMachine(null);
    }
  };

  const AddMachineModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Machine</h2>
          <button
            onClick={() => setIsAddingMachine(false)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Machine Name
            </label>
            <input
              type="text"
              value={newMachine.name}
              onChange={(e) => setNewMachine(prev => ({ ...prev, name: e.target.value }))}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
              placeholder="Enter machine name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Type
            </label>
            <select
              value={newMachine.type}
              onChange={(e) => setNewMachine(prev => ({ ...prev, type: e.target.value }))}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="Conveyor">Conveyor</option>
              <option value="Pump">Pump</option>
              <option value="Motor">Motor</option>
              <option value="Generator">Generator</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Location
            </label>
            <select
              value={newMachine.location}
              onChange={(e) => setNewMachine(prev => ({ ...prev, location: e.target.value }))}
              className="w-full bg-gray-700 rounded px-3 py-2 text-white"
            >
              <option value="Floor 1">Floor 1</option>
              <option value="Floor 2">Floor 2</option>
              <option value="Floor 3">Floor 3</option>
            </select>
          </div>
          <button
            onClick={handleAddMachine}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded transition-colors"
          >
            Add Machine
          </button>
        </div>
      </div>
    </div>
  );

  const MachineCard = ({ machine }: { machine: Machine }) => (
    <div 
      className={`p-6 rounded-lg ${statusColors[machine.status.status]} bg-opacity-10 border border-opacity-30 
        ${statusColors[machine.status.status].replace('bg-', 'border-')} cursor-pointer transform transition-all duration-300 
        hover:scale-105 hover:bg-opacity-20 group relative`}
      onClick={() => setSelectedMachine(machine)}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveMachine(machine.id);
        }}
        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-5 w-5" />
      </button>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">{machine.name}</h3>
          <p className="text-sm text-gray-300">{machine.id}</p>
        </div>
        {machine.status.status === 'normal' ? (
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        ) : machine.status.status === 'warning' ? (
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-red-500" />
        )}
      </div>

      <div className="space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Type:</span>
          <span>{machine.type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Location:</span>
          <span>{machine.location}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Last Maintenance:</span>
          <span>{machine.lastMaintenance}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">RUL:</span>
          <span>{machine.status.rul} days</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {isAddingMachine && <AddMachineModal />}
      
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 p-4">
        <div className="flex items-center gap-2 mb-8">
          <Activity className="h-6 w-6 text-emerald-500" />
          <h1 className="text-xl font-bold">Machine Monitor</h1>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer">
            <Grid className="h-5 w-5" />
            <span>Dashboard</span>
          </div>
          <div className="flex items-center gap-2 text-gray-400 hover:text-white cursor-pointer">
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-8">
        {selectedMachine ? (
          <>
            <button 
              className="flex items-center gap-2 text-gray-400 hover:text-white mb-6"
              onClick={() => setSelectedMachine(null)}
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Dashboard
            </button>

            {/* Status Cards */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className={`p-6 rounded-lg ${statusColors[selectedMachine.status.status]} bg-opacity-20 border border-opacity-50 ${statusColors[selectedMachine.status.status].replace('bg-', 'border-')}`}>
                <div className="flex items-center gap-3 mb-2">
                  {selectedMachine.status.status === 'normal' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : selectedMachine.status.status === 'warning' ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                  <h2 className="text-lg font-semibold">Machine Status</h2>
                </div>
                <p className="capitalize">{selectedMachine.status.status}</p>
              </div>

              <div className="p-6 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Remaining Useful Life</h2>
                </div>
                <p>{selectedMachine.status.rul} days</p>
              </div>

              <div className="p-6 rounded-lg bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Current Load</h2>
                </div>
                <p>{Math.round(Math.max(...selectedMachine.vibrationData.slice(-1).map(d => Math.max(d.x, d.y, d.z))) * 100)}%</p>
              </div>
            </div>

            {/* Vibration Chart */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold mb-4">Live Vibration Data</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMachine.vibrationData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: 'none' }}
                      labelFormatter={(timestamp) => format(timestamp, 'HH:mm:ss')}
                    />
                    <Line type="monotone" dataKey="x" stroke="#EC4899" name="X-Axis" dot={false} />
                    <Line type="monotone" dataKey="y" stroke="#8B5CF6" name="Y-Axis" dot={false} />
                    <Line type="monotone" dataKey="z" stroke="#3B82F6" name="Z-Axis" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Alerts */}
            {selectedMachine.status.alerts.length > 0 && (
              <div className="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  Active Alerts
                </h2>
                <ul className="space-y-2">
                  {selectedMachine.status.alerts.map((alert, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      {alert}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Machine Dashboard</h2>
              <button
                onClick={() => setIsAddingMachine(true)}
                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 px-4 py-2 rounded transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Machine
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {machines.map(machine => (
                <MachineCard key={machine.id} machine={machine} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;