import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, Settings, AlertCircle, Grid, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';

// Types
interface FeatureData {
  rms: number;
  kurtosis: number;
  'peek-to-peek': number;
  crest_factor: number;
}

interface AxisFeatures {
  x: FeatureData;
  y: FeatureData;
  z: FeatureData;
}

interface MachineData {
  confidence: string;
  models: {
    gnb: string;
    knn: string;
    svm: string;
  };
  predicted_fault: string;
  features?: AxisFeatures;
}

interface ApiResponse {
  [key: string]: MachineData;
}

interface Machine {
  id: string;
  name: string;
  type: string;
  location: string;
  lastMaintenance: string;
  data: MachineData;
  featureHistory: {
    timestamp: number;
    x: FeatureData;
    y: FeatureData;
    z: FeatureData;
  }[];
}

// API URL (replace with actual URL)
const API_URL = 'http://127.0.0.1:5000/machine_data';

function App() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);
  const [isAddingMachine, setIsAddingMachine] = useState(false);
  const [selectedAxis, setSelectedAxis] = useState<'x' | 'y' | 'z'>('x');
  const [selectedFeature, setSelectedFeature] = useState<keyof FeatureData>('rms');
  const [newMachine, setNewMachine] = useState({
    name: '',
    type: 'Conveyor',
    location: 'Floor 1'
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get<ApiResponse>(API_URL);
        setMachines(prev => {
          const updatedMachines = Object.entries(response.data).map(([id, data]) => {
            const existingMachine = prev.find(m => m.id === id);
            const newFeatureData = {
              timestamp: Date.now(),
              ...data.features!
            };

            return {
              id,
              name: existingMachine?.name || `Machine ${id}`,
              type: existingMachine?.type || 'Conveyor',
              location: existingMachine?.location || 'Floor 1',
              lastMaintenance: existingMachine?.lastMaintenance || format(new Date(), 'yyyy-MM-dd'),
              data,
              featureHistory: [
                ...(existingMachine?.featureHistory || []),
                newFeatureData
              ].slice(-50)
            };
          });

          // Keep manually added machines that aren't in the API response
          const manualMachines = prev.filter(machine => 
            !Object.keys(response.data).includes(machine.id) &&
            machine.id.startsWith('manual-')
          );

          return [...updatedMachines, ...manualMachines];
        });
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    const interval = setInterval(fetchData, 50); // 1/20th second
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (machine: Machine) => {
    const { predicted_fault, confidence } = machine.data;
    if (predicted_fault === 'normal') return 'bg-emerald-500';
    return confidence === 'high' ? 'bg-red-500' : 'bg-amber-500';
  };

  const handleAddMachine = () => {
    if (!newMachine.name) return;

    const newMachineData: Machine = {
      id: `manual-${Date.now()}`,
      name: newMachine.name,
      type: newMachine.type,
      location: newMachine.location,
      lastMaintenance: format(new Date(), 'yyyy-MM-dd'),
      data: {
        confidence: 'high',
        models: {
          gnb: 'normal',
          knn: 'normal',
          svm: 'normal'
        },
        predicted_fault: 'normal',
        features: {
          x: { rms: 0, kurtosis: 0, 'peek-to-peek': 0, crest_factor: 0 },
          y: { rms: 0, kurtosis: 0, 'peek-to-peek': 0, crest_factor: 0 },
          z: { rms: 0, kurtosis: 0, 'peek-to-peek': 0, crest_factor: 0 }
        }
      },
      featureHistory: []
    };

    setMachines(prev => {
      const updatedMachines = [...prev, newMachineData];
      updateMachineCount(updatedMachines.length); // Update machine count in backend
      return updatedMachines;
    });

    setIsAddingMachine(false);
    setNewMachine({ name: '', type: 'Conveyor', location: 'Floor 1' });
  };

  const handleRemoveMachine = (machineId: string) => {
    setMachines(prev => {
      const updatedMachines = prev.filter(machine => machine.id !== machineId);
      updateMachineCount(updatedMachines.length); // Update machine count in backend
      return updatedMachines;
    });

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
              autoFocus
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
      className={`p-6 rounded-lg ${getStatusColor(machine)} bg-opacity-10 border border-opacity-30 
        ${getStatusColor(machine).replace('bg-', 'border-')} cursor-pointer transform transition-all duration-300 
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
        {machine.data.predicted_fault === 'normal' ? (
          <CheckCircle className="h-6 w-6 text-emerald-500" />
        ) : machine.data.confidence === 'low' ? (
          <AlertTriangle className="h-6 w-6 text-amber-500" />
        ) : (
          <AlertCircle className="h-6 w-6 text-red-500" />
        )}
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Type:</span>
          <span>{machine.type}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Location:</span>
          <span>{machine.location}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Fault Status:</span>
          <span className="capitalize">{machine.data.predicted_fault}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Confidence:</span>
          <span className="capitalize">{machine.data.confidence}</span>
        </div>
      </div>
    </div>
  );

  const updateMachineCount = async (count: number) => {
    try {
      await axios.post(`${API_URL}/update_machine_count`, { count });
      console.log(`Machine count updated to ${count}`);
    } catch (error) {
      console.error('Error updating machine count:', error);
    }
  };

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
              <div className={`p-6 rounded-lg ${getStatusColor(selectedMachine)} bg-opacity-20 border border-opacity-50`}>
                <div className="flex items-center gap-3 mb-2">
                  {selectedMachine.data.predicted_fault === 'normal' ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : selectedMachine.data.confidence === 'low' ? (
                    <AlertTriangle className="h-6 w-6" />
                  ) : (
                    <AlertCircle className="h-6 w-6" />
                  )}
                  <h2 className="text-lg font-semibold">Machine Status</h2>
                </div>
                <p className="capitalize">{selectedMachine.data.predicted_fault}</p>
              </div>

              <div className="p-6 rounded-lg bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <Activity className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Confidence Level</h2>
                </div>
                <p className="capitalize">{selectedMachine.data.confidence}</p>
              </div>

              <div className="p-6 rounded-lg bg-purple-500 bg-opacity-20 border border-purple-500 border-opacity-50">
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-6 w-6" />
                  <h2 className="text-lg font-semibold">Model Predictions</h2>
                </div>
                <div className="space-y-1 text-sm">
                  <p>GNB: {selectedMachine.data.models.gnb}</p>
                  <p>KNN: {selectedMachine.data.models.knn}</p>
                  <p>SVM: {selectedMachine.data.models.svm}</p>
                </div>
              </div>
            </div>

            {/* Feature Chart Controls */}
            <div className="bg-gray-800 rounded-lg p-6 mb-8">
              <div className="flex gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Axis
                  </label>
                  <select
                    value={selectedAxis}
                    onChange={(e) => setSelectedAxis(e.target.value as 'x' | 'y' | 'z')}
                    className="bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="x">X Axis</option>
                    <option value="y">Y Axis</option>
                    <option value="z">Z Axis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Feature
                  </label>
                  <select
                    value={selectedFeature}
                    onChange={(e) => setSelectedFeature(e.target.value as keyof FeatureData)}
                    className="bg-gray-700 rounded px-3 py-2 text-white"
                  >
                    <option value="rms">RMS</option>
                    <option value="kurtosis">Kurtosis</option>
                    <option value="peek-to-peek">Peek-to-Peek</option>
                    <option value="crest_factor">Crest Factor</option>
                  </select>
                </div>
              </div>

              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedMachine.featureHistory}>
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
                    <Line 
                      type="monotone" 
                      dataKey={`${selectedAxis}.${selectedFeature}`}
                      stroke="#EC4899" 
                      name={`${selectedAxis.toUpperCase()} ${selectedFeature}`} 
                      dot={false} 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
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