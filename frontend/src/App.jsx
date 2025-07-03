import React, { useState, useEffect, useRef } from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
import axios from 'axios';
import * as Papa from 'papaparse';
ChartJS.register(...registerables);

const App = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [chartConfig, setChartConfig] = useState(null);
  const [uploadedData, setUploadedData] = useState(null);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [colorPickerPos, setColorPickerPos] = useState({ x: 0, y: 0 });
  const [selectedDatasetIndex, setSelectedDatasetIndex] = useState(null);
  const [selectedDataIndex, setSelectedDataIndex] = useState(null);
  const [isLegendClick, setIsLegendClick] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chartRef = useRef(null);

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/chart/generate';

  const distinctColors = [
    '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
    '#ec4899', '#14b8a6', '#f97316', '#8b5cf6', '#22c55e',
    '#d946ef', '#06b6d4', '#f43f5e', '#84cc16', '#7c3aed',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim() && !uploadedData) return;

    const userMessage = { role: 'user', content: message || `Uploaded file` };
    setMessages((prev) => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post(BACKEND_URL, {
        message: message || 'Generate chart from uploaded data',
        data: uploadedData,
      });
      const config = response.data.config;
      setChartConfig(config);
      setMessages((prev) => [...prev, { role: 'bot', content: 'Chart generated successfully!' }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${error.message}` }]);
    } finally {
      setIsLoading(false);
    }

    setUploadedData(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setMessages((prev) => [...prev, { role: 'user', content: `Uploaded: ${file.name}` }]);

    if (file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const updatedDatasets = json.datasets.map((dataset, index) => ({
            ...dataset,
            backgroundColor: dataset.backgroundColor || distinctColors[index % distinctColors.length],
            borderColor: json.type === 'line' ? (dataset.borderColor || distinctColors[index % distinctColors.length]) : undefined,
          }));
          setUploadedData({ ...json, datasets: updatedDatasets });
        } catch (error) {
          setMessages((prev) => [...prev, { role: 'bot', content: 'Invalid JSON file' }]);
        }
      };
      reader.readAsText(file);
    } else if (file.type === 'text/csv') {
      Papa.parse(file, {
        complete: (result) => {
          const labels = result.data[0].slice(1);
          const values = result.data.slice(1).map((row) => row.slice(1).map(Number));
          const datasets = values.map((data, index) => ({
            label: `Dataset ${index + 1}`,
            data,
            backgroundColor: distinctColors[index % distinctColors.length],
            borderColor: distinctColors[index % distinctColors.length],
          }));
          setUploadedData({ labels, datasets });
        },
        header: false,
        skipEmptyLines: true,
      });
    } else {
      setMessages((prev) => [...prev, { role: 'bot', content: 'Unsupported file type' }]);
    }
  };

  const handleChartClick = (event) => {
    const chart = chartRef.current;
    if (!chart) return;

    const elements = chart.getElementsAtEventForMode(
      event,
      chartConfig?.type === 'bar' ? 'point' : 'nearest',
      { intersect: true },
      true
    );
    if (elements.length > 0) {
      const { datasetIndex, index } = elements[0];
      const canvas = chart.canvas;
      const rect = canvas.getBoundingClientRect();
      const x = Math.min(Math.max(event.clientX - rect.left, 10), rect.width - 100);
      const y = Math.min(Math.max(event.clientY - rect.top, 10), rect.height - 100);
      setSelectedDatasetIndex(datasetIndex);
      setSelectedDataIndex(index);
      setIsLegendClick(false);
      setColorPickerPos({ x, y });
      setShowColorPicker(true);
    }
  };

  const handleLegendClick = (event, legendItem, legend) => {
    const datasetIndex = legendItem.datasetIndex;
    const chart = chartRef.current;
    if (!chart) return;

    const canvas = chart.canvas;
    const rect = canvas.getBoundingClientRect();
    const x = Math.min(Math.max(event.clientX - rect.left, 10), rect.width - 100);
    const y = Math.min(Math.max(event.clientY - rect.top, 10), rect.height - 100);
    setSelectedDatasetIndex(datasetIndex);
    setSelectedDataIndex(null);
    setIsLegendClick(true);
    setColorPickerPos({ x, y });
    setShowColorPicker(true);
  };

  const handleColorChange = (event) => {
    const color = event.target.value;
    if (chartConfig && selectedDatasetIndex !== null) {
      const newConfig = JSON.parse(JSON.stringify(chartConfig));
      const dataset = newConfig.data.datasets[selectedDatasetIndex];

      if (isLegendClick) {
        dataset.backgroundColor = color;
        if (chartConfig.type === 'line') {
          dataset.borderColor = color;
        }
      } else if (chartConfig.type === 'pie' || chartConfig.type === 'bar') {
        const backgroundColor = Array.isArray(dataset.backgroundColor)
          ? [...dataset.backgroundColor]
          : new Array(dataset.data.length).fill(dataset.backgroundColor || distinctColors[selectedDatasetIndex % distinctColors.length]);
        backgroundColor[selectedDataIndex] = color;
        dataset.backgroundColor = backgroundColor;
      } else {
        dataset.backgroundColor = color;
        if (chartConfig.type === 'line') {
          dataset.borderColor = color;
        }
      }

      setChartConfig(newConfig);
      setShowColorPicker(false);
    }
  };

  const handleExportImage = () => {
    if (!chartConfig) return;
    const canvas = document.getElementById('chart');
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = 'chart.png';
    link.click();
  };

  const handleExportCode = () => {
    if (!chartConfig) return;
    const code = `
import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Chart } from 'react-chartjs-2';
ChartJS.register(...registerables);

const MyChart = () => {
  const chartConfig = ${JSON.stringify(chartConfig, null, 2)};
  return <Chart type={chartConfig.type} data={chartConfig.data} options={chartConfig.options} />;
};

export default MyChart;
    `;
    const blob = new Blob([code], { type: 'text/javascript' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'MyChart.jsx';
    link.click();
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative container mx-auto px-6 py-8">
          <div className="flex items-center justify-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <div className="w-8 h-8 text-white font-bold text-xl flex items-center justify-center">📊</div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              ChartGenix
            </h1>
            <div className="w-6 h-6 text-yellow-300 animate-pulse flex items-center justify-center text-lg">✨</div>
          </div>
          <p className="text-center mt-2 text-blue-100 font-medium">
            AI-Powered Chart Generation Platform
          </p>
        </div>
      </header>

      <main className="flex-1 container mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full">
          <div className="flex flex-col h-full">
            <div className="flex justify-center items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <div className="w-5 h-5 text-white font-bold flex items-center justify-center">💬</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Chat Interface</h2>
            </div>
            
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="h-[450px] p-6 overflow-y-auto custom-scrollbar">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl flex items-center justify-center">💬</div>
                      <p className="text-lg font-medium">Start a conversation</p>
                      <p className="text-sm mt-2">Describe your chart or upload data to begin</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl shadow-md ${
                            msg.role === 'user'
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-md'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800 rounded-bl-md'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold opacity-80">
                              {msg.role === 'user' ? 'You' : 'ChartGenix AI'}
                            </span>
                          </div>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex justify-start mb-4">
                        <div className="bg-gradient-to-r from-gray-100 to-gray-200 px-4 py-3 rounded-2xl rounded-bl-md">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <span className="text-xs text-gray-600">ChartGenix is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Describe your chart or ask a question..."
                      className="w-full px-4 py-3 pr-12 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 shadow-sm hover:shadow-md"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <label className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl cursor-pointer hover:from-gray-600 hover:to-gray-700 transition-all duration-300 transform hover:scale-105 shadow-md">
                    <div className="w-5 h-5 text-white font-bold flex items-center justify-center">📁</div>
                    <input
                      type="file"
                      accept=".json,.csv"
                      onChange={handleFileUpload}
                      ref={fileInputRef}
                      className="hidden"
                    />
                  </label>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || (!message.trim() && !uploadedData)}
                    className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="w-5 h-5 text-white font-bold flex items-center justify-center">🚀</div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full">
            <div className="flex justify-center items-center gap-3 mb-6">
              <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg">
                <div className="w-5 h-5 text-white font-bold flex items-center justify-center">📊</div>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Chart Preview</h2>
            </div>
            
            <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="h-[450px] p-6 relative">
                {chartConfig ? (
                  <>
                    <div className="h-full">
                      <Chart
                        id="chart"
                        ref={chartRef}
                        type={chartConfig.type}
                        data={chartConfig.data}
                        options={{
                          ...chartConfig.options,
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            ...chartConfig.options?.plugins,
                            legend: {
                              ...chartConfig.options?.plugins?.legend,
                              onClick: handleLegendClick,
                            },
                          },
                        }}
                        onClick={handleChartClick}
                      />
                    </div>
                    {showColorPicker && (
                      <div
                        className="absolute z-20 bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-xl shadow-2xl p-4 flex flex-col items-center gap-3"
                        style={{ left: `${colorPickerPos.x}px`, top: `${colorPickerPos.y}px` }}
                      >
                        <input
                          type="color"
                          className="w-16 h-16 cursor-pointer rounded-lg border-2 border-gray-200"
                          onChange={handleColorChange}
                        />
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-md"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full flex items-center justify-center text-gray-400">
                    <div className="text-center">
                      <div className="w-20 h-20 mx-auto mb-4 text-gray-300 text-5xl flex items-center justify-center">📊</div>
                      <p className="text-xl font-medium">No chart generated yet</p>
                      <p className="text-sm mt-2">Start chatting to create your first chart</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="p-6 bg-gradient-to-r from-gray-50 to-green-50 border-t border-gray-200">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={handleExportImage}
                    disabled={!chartConfig}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">📥</div>
                    Export Image
                  </button>
                  <button
                    onClick={handleExportCode}
                    disabled={!chartConfig}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 transform hover:scale-105 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <div className="w-4 h-4 flex items-center justify-center">💻</div>
                    Export Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gradient-to-r from-gray-800 via-gray-900 to-black text-white mt-12">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 text-blue-400 text-xl flex items-center justify-center">📊</div>
              <span className="text-xl font-bold">ChartGenix</span>
            </div>
            <p className="text-sm text-gray-300 mb-2">© 2025 ChartGenix. All rights reserved.</p>
            <p className="text-xs text-gray-400">Powered by AI for seamless chart creation</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.4s ease-out;
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default App;