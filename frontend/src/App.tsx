import React, { useState, useEffect, useRef } from 'react';
  import { Activity, AlertTriangle, CheckCircle, Settings, AlertCircle, Grid, ArrowLeft, Plus, Trash2, X } from 'lucide-react';
  import { format } from 'date-fns';
  import axios from 'axios';
  import { Chart, registerables } from 'chart.js';
  import 'chart.js/auto';
  import 'chartjs-adapter-luxon';  // Keep only this adapter
  import ChartStreaming from 'chartjs-plugin-streaming';
  // import 'chartjs-adapter-date-fns';
  // Chart.register(...registerables, 'chartjs-adapter-date-fns');

  Chart.register(...registerables);
  Chart.register(ChartStreaming);

  interface FeatureData {
    rms: number;
    kurtosis: number;
    pp: number;
    crestf: number;
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
    graph_value?: {
      x: Partial<FeatureData>;
      y: Partial<FeatureData>;
      z: Partial<FeatureData>;
    };
  }

  // interface ApiResponse {
  //   [key: string]: MachineData;
  // }

  interface Machine {
    id: string;
    name: string;
    type: string; // Changed from 'realtime' to string
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
  // const API_URL = 'http://127.0.0.1:8088/machine_data';

  // Chart.register(ChartStreaming);

  const RealTimeChart = ({ selectedAxis, selectedMachine }: { selectedAxis: 'x' | 'y' | 'z'; selectedMachine: Machine | null }) => {
    const chartRef = useRef<HTMLCanvasElement | null>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    useEffect(() => {
      if (!chartRef.current) return;
      const ctx = chartRef.current.getContext('2d');
      if (!ctx) return;

      // Destroy the previous chart instance if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }

      chartInstanceRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          datasets: [
            {
              label: 'RMS',
              // borderColor: 'rgba(255, 99, 132, 1)',
              // backgroundColor: 'rgba(255, 99, 132, 0.2)',
              borderColor: 'rgba(255, 99, 132, 1)',
              backgroundColor: 'rgba(255, 99, 132, 0.2)',
              fill: false,
              data: [],
              borderWidth: 3,
              pointRadius: 0,
              tension: 0.4,
            },
            {
              label: 'Kurtosis',
              borderColor: 'rgba(54, 162, 235, 1)',
              backgroundColor: 'rgba(54, 162, 235, 0.2)',
              fill: false,
              data: [],
              borderWidth: 1,
              pointRadius: 0,
              tension: 0.4,
            },
            {
              label: 'PP',
              borderColor: 'rgba(75, 192, 192, 1)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              fill: false,
              data: [],
              borderWidth: 3,
              pointRadius: 0,
              tension: 0.4,
            },
            {
              label: 'Crest Factor',
              borderColor: 'rgba(153, 102, 255, 1)',
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              fill: false,
              data: [],
              borderWidth: 1,
              pointRadius: 0,
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              type: 'realtime',
              realtime: {
                onRefresh: (chart) => {
                  if (selectedMachine && (selectedMachine.featureHistory ?? []).length > 0) {
                    const latest = selectedMachine.featureHistory[selectedMachine.featureHistory.length - 1];
                    const axisData = latest[selectedAxis];
                    if (axisData) {
                      const now = new Date(Date.now());
                      // console.log('Chart adding data:', {
                      //   now,
                      //   rms: axisData.rms,
                      //   kurtosis: axisData.kurtosis,
                      //   pp: axisData.pp,
                      //   crestf: axisData.crestf,
                      // });
                      chart.data.datasets[0].data.push({ x: now.getTime(), y: axisData.rms });
                      chart.data.datasets[1].data.push({ x: now.getTime(), y: axisData.kurtosis });
                      chart.data.datasets[2].data.push({ x: now.getTime(), y: axisData.pp });
                      chart.data.datasets[3].data.push({ x: now.getTime(), y: axisData.crestf });
                      // Remove old data points to match duration
                      const removeTime = now.getTime() - 20000;
                      chart.data.datasets.forEach((dataset) => {
                        dataset.data = dataset.data.filter((point) => point !== null && typeof point === 'object' && 'x' in point && point.x > removeTime);
                      });
                      chart.update();
                    }
                  }
                },
              },
            },
            y: {
              beginAtZero: true,
              suggestedMin: 0,          // Start at zero
              suggestedMax: selectedMachine ? Math.max(...selectedMachine.featureHistory.map(f => Math.max(f[selectedAxis].rms, f[selectedAxis].kurtosis, f[selectedAxis].pp, f[selectedAxis].crestf))) * 1.1 : 0, // 10% buffer
              title: {
                display: true,
                text: 'Value',
              },
            },
          },
          plugins: {
            legend: {
              position: 'top',
            },
            title: {
              display: true,
              text: `${selectedAxis.toUpperCase()} Axis Measurements`,
            },
            streaming: {
              duration: 20000, // 20 seconds of data
              refresh: 2000,   // Refresh every 1 second
              delay: 0,
              frameRate: 30,
            },
          },
          animation: false,
        },
      });

      // Cleanup function to destroy the chart on unmount or re-render
      return () => {
        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }
      };
    }, [selectedAxis, selectedMachine]);

    return (
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <canvas ref={chartRef} style={{ width: '100%', height: '100%' }} />
      </div>
    );
  };

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
          const response = await axios.get('http://127.0.0.1:8088/machine_data');
          const data = response.data;
    
          setMachines((prev) => {
            const updatedMachines = Object.entries(data).map(([id, machineData]) => {
              const existingMachine = prev.find((m) => m.id === id);
              const newFeatureData = {
                timestamp: Date.now(),
                x: {
                  rms: (machineData as MachineData).graph_value?.x?.rms ?? 0,
                  kurtosis: (machineData as MachineData).graph_value?.x?.kurtosis ?? 0,
                  pp: (machineData as MachineData).graph_value?.x?.pp ?? 0,
                  crestf: (machineData as MachineData).graph_value?.x?.crestf ?? 0,
                },
                y: {
                  rms: (machineData as MachineData).graph_value?.y?.rms ?? 0,
                  kurtosis: (machineData as MachineData).graph_value?.y?.kurtosis ?? 0,
                  pp: (machineData as MachineData).graph_value?.y?.pp ?? 0,
                  crestf: (machineData as MachineData).graph_value?.y?.crestf ?? 0,
                },
                z: {
                  rms: (machineData as MachineData).graph_value?.z?.rms ?? 0,
                  kurtosis: (machineData as MachineData).graph_value?.z?.kurtosis ?? 0,
                  pp: (machineData as MachineData).graph_value?.z?.pp ?? 0,
                  crestf: (machineData as MachineData).graph_value?.z?.crestf ?? 0,
                },
              };
              const updatedFeatureHistory = [...(existingMachine?.featureHistory || []), newFeatureData].slice(-50);
              // console.log(`Machine ${id} featureHistory:`, updatedFeatureHistory); // Debug here
              return {
                id,
                name: existingMachine?.name || `Machine ${id}`,
                type: existingMachine?.type || 'Conveyor',
                location: existingMachine?.location || 'Floor 1',
                lastMaintenance: existingMachine?.lastMaintenance || format(new Date(), 'yyyy-MM-dd'),
                data: {...(machineData as MachineData),
                  predicted_fault: (machineData as MachineData).predicted_fault || 'normal'
                },
                featureHistory: [...(existingMachine?.featureHistory || []), newFeatureData].slice(-50),
              };
            });
            const manualMachines = prev.filter((m) => m.id && !data[m.id]);
            return [...updatedMachines, ...manualMachines];
          });
    
          // Sync selectedMachine
          if (selectedMachine) {
            const updatedSelectedMachine = data[selectedMachine.id];
            if (updatedSelectedMachine) {
              setSelectedMachine((prev) => {
                if (!prev) return null;
                const updated = {
                  ...prev,
                  data: updatedSelectedMachine,
                  featureHistory: prev.featureHistory,
                };
                // console.log('Updated selectedMachine featureHistory:', updated.featureHistory); // Debug here
                return updated;
              });
            }
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };
    
      fetchData(); // Initial fetch
      const interval = setInterval(fetchData, 1000);
      return () => clearInterval(interval);
    }, [selectedMachine]);

    useEffect(() => {
      if (selectedMachine) {
        const updatedMachine = machines.find((machine) => machine.id === selectedMachine.id);
        if (updatedMachine) {
          // console.log('Synced selectedMachine featureHistory:', updatedMachine.featureHistory); // Debug here
          setSelectedMachine(updatedMachine);
        }
      }
    }, [machines]);


    const getStatusColor = (machine: Machine) => {
      const { predicted_fault, confidence } = machine.data;
      if (predicted_fault === 'normal') return 'bg-emerald-500';
      return confidence === 'high' ? 'bg-red-500' : 'bg-amber-500';
    };

    const handleAddMachine = async () => {
      if (!newMachine.name) return;
      
      try {
        const machineCount = machines.length + 1;
        const response = await axios.post('http://127.0.0.1:8088/update_machine_count', {
          count: machineCount,
          machine: {
            name: newMachine.name,
            type: newMachine.type,
            location: newMachine.location,
            lastMaintenance: format(new Date(), 'yyyy-MM-dd')
          }
        });
    
        if (response.data.machine_id) {
          const newMachineData: Machine = {
            id: response.data.machine_id,
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
              graph_value: {
                x: { rms: 0, kurtosis: 0, pp: 0, crestf: 0 },
                y: { rms: 0, kurtosis: 0, pp: 0, crestf: 0 },
                z: { rms: 0, kurtosis: 0, pp: 0, crestf: 0 }
              }
            },
            featureHistory: []
          };
    
          setMachines(prev => [...prev, newMachineData]);
          setNewMachine({ name: '', type: 'Conveyor', location: 'Floor 1' });
          setIsAddingMachine(false);
        }
      } catch (error) {
        console.error('Error adding machine:', error);
        setIsAddingMachine(false);
      }
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
                onChange={(e) => setNewMachine((prev) => ({ ...prev, type: e.target.value }))}
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

    const MachineCard = React.memo(({ machine, onClick }: { machine: Machine; onClick: () => void }) => (
      <div
        className={`p-6 rounded-lg ${getStatusColor(machine)} bg-opacity-10 border border-opacity-30 
          ${getStatusColor(machine).replace('bg-', 'border-')} cursor-pointer transform transition-all duration-300 
          hover:scale-105 hover:bg-opacity-20 group relative`}
        onClick={onClick}
      >
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent click event from propagating to the parent div
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
    ));

    const updateMachineCount = async (count: number) => {
      try {
        console.log(`Sending request to: http://127.0.0.1:8088/update_machine_count`);
        await axios.post(`http://127.0.0.1:8088/update_machine_count`, { count });
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
                      Test Input
                    </label>
                    <select
                      value={selectedFeature}
                      onChange={async (e) => {
                        const newFeature = e.target.value as keyof FeatureData;
                        setSelectedFeature(newFeature);
                        try{
                          await axios.post('http://127.0.0.1:8088/update_test_input', { feature: newFeature, machine_id: selectedMachine?.id });
                          console.log(`Test input updated to ${newFeature } for machine ${selectedMachine?.id}`);
                        }catch (error) {
                          console.error('Error updating test input:', error);
                        }
                      }}
                      className="bg-gray-700 rounded px-3 py-2 text-white"
                    >
                      <option value="normal">Normal</option>
                      <option value="misalignment">Misalignment</option>
                      <option value="unbalance">Unbalance</option>
                      <option value="bearing">bearing</option>
                    </select>
                  </div>
                </div>

                <div className="h-[800px]">
                    <RealTimeChart
                      selectedAxis={selectedAxis}
                      selectedMachine={selectedMachine}
                    />
                  
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
                  <MachineCard key={machine.id} machine={machine} onClick={() => {
                    console.log('Machine clicked:', machine); // Debugging log
                    setSelectedMachine(machine);
                  }} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  export default App;