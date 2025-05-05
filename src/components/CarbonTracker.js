import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CarbonTracker = () => {
  const navigate = useNavigate();
  const [transportationData, setTransportationData] = useState([{ distance: '', mode: '' }]);
  const [electricityData, setElectricityData] = useState({ previousUsage: '', todayUsage: '' });
  const [wasteData, setWasteData] = useState({ dryWaste: '', wetWaste: '' });
  const [totalEmissions, setTotalEmissions] = useState({ transportation: 0, electricity: 0, waste: 0 });
  const [historicalData, setHistoricalData] = useState([]);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userCity, setUserCity] = useState('');
  const [userName, setUserName] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('jwtToken');
  const [recordDate, setRecordDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  

  useEffect(() => {
    if (!userId || !token) {
      navigate('/authpage');
    } else {
      fetchUserData();
      fetchDashboardData();
    }
  }, [navigate, userId, token]);

  const fetchUserData = async () => {
    console.log(userId);
    try {
      const response = await axios.get(`http://localhost:3000/carbonTrack/profile/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setUserEmail(response.data.email);
      setUserCity(response.data.city);
      setUserName(response.data.name);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/carbonTrack/user/${userId}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      setHistoricalData(response.data);
      updateChartData(response.data);
      updateTotalEmissions(response.data[0]); // Assuming the first item is the most recent
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/carbonTrack/leaderBoard/${userCity}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      // Normalize backend field `totalCarbon` to `totalCarbonFootprint` expected by frontend
    const normalizedData = response.data.map(user => ({
      ...user,
      totalCarbonFootprint: user.totalCarbon // adapt to expected key
    }));

    setLeaderboardData(normalizedData);
      
    } catch (error) {
      console.error('Error fetching leaderboard data:', error);
    }
  };


  const updateChartData = (data) => {
    const labels = data.map(item => item.date).reverse();
    const carbonFootprints = data.map(item => item.totalCarbonFootprint).reverse();

    setChartData({
      labels,
      datasets: [
        {
          label: 'Total Carbon Footprint',
          data: carbonFootprints,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        }
      ]
    });
  };

  const updateTotalEmissions = (latestData) => {
    // This is a placeholder. You might need to adjust this based on how your backend provides category-specific data
    setTotalEmissions({
      transportation: latestData.totalCarbonFootprint * 0.5, // Example: 40% of total
      electricity: latestData.totalCarbonFootprint * 0.3, // Example: 30% of total
      waste: latestData.totalCarbonFootprint * 0.2 // Example: 30% of total
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('jwtToken');
    navigate('/authpage');
  };

  const handleTransportationChange = (index, e) => {
    const updatedTransportationData = [...transportationData];
    updatedTransportationData[index][e.target.name] = e.target.value;
    setTransportationData(updatedTransportationData);
  };

  const handleAddTransportation = () => {
    setTransportationData([...transportationData, { distance: '', mode: '' }]);
  };

  const handleElectricityChange = (e) => {
    setElectricityData({
      ...electricityData,
      [e.target.name]: e.target.value,
    });
  };

  const handleWasteChange = (e) => {
    setWasteData({
      ...wasteData,
      [e.target.name]: e.target.value,
    });
  };

  const validateInputs = () => {
    if (
      transportationData.some(data => !data.distance || !data.mode) ||
      !electricityData.previousUsage ||
      !electricityData.todayUsage ||
      !wasteData.dryWaste ||
      !wasteData.wetWaste
    ) {
      setError('Please fill in all fields.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;
  
    try {
      // 🔹 Step 1: Fetch user name & city by userId
      const userInfoResponse = await axios.get(`http://localhost:3000/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
  
      const { name, city } = userInfoResponse.data;
  
      // 🔹 Step 2: Build final payload
      const transformedData = {
        userId: userId,
        city,
        name,
        date: recordDate, 
        transportations: transportationData.map(item => ({
          mode: item.mode,
          distance: parseInt(item.distance),
          time: item.time ? parseInt(item.time) : 0
        })),
        wastages: [{
          wetWaste: parseInt(wasteData.wetWaste),
          dryWaste: parseInt(wasteData.dryWaste)
        }],
        prevWatts: parseInt(electricityData.previousUsage),
        todayWatts: parseInt(electricityData.todayUsage)
      };
  
      // 🔹 Step 3: Submit the data
      const response = await axios.post('http://localhost:3000/carbonTrack/calculateAndSubmit', transformedData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });
  
      console.log(response.data);
      alert(`Your total carbon footprint is ${response.data.totalCarbonEmission.toFixed(2)} kgCO2e`);
      fetchDashboardData();
    }  catch (error) {
      // ← Replace your old catch here with this:
      console.error('Submission failed:', error.response?.data || error.message);
  
      const serverMessage = error.response?.data?.message;
      setError(serverMessage || 'Failed to submit data. Please try again.');
    }
  };
  
  

  const renderEmissionsDetails = () => {
    switch (activeCategory) {
      case 'transportation':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-2">Transportation Emissions</h3>
            <p>Total: {totalEmissions.transportation.toFixed(2)} kgCO2e</p>
            {/* Add more detailed breakdown here if available */}
          </div>
        );
      case 'electricity':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-2">Electricity Emissions</h3>
            <p>Total: {totalEmissions.electricity.toFixed(2)} kgCO2e</p>
            {/* Add more detailed breakdown here if available */}
          </div>
        );
      case 'waste':
        return (
          <div>
            <h3 className="text-xl font-semibold mb-2">Waste Emissions</h3>
            <p>Total: {totalEmissions.waste.toFixed(2)} kgCO2e</p>
            {/* Add more detailed breakdown here if available */}
          </div>
        );
      default:
        return null;
    }
  };

  const renderLeaderboard = () => {
    return (
      <div className="bg-white p-4 rounded shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Leaderboard</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Rank</th>
              <th className="border p-2">User</th>
              <th className="border p-2">City</th>
              <th className="border p-2">Total Carbon Footprint</th>
            </tr>
          </thead>
          <tbody>
            {leaderboardData.map((user, index) => (
              <tr key={index}>
                <td className="border p-2">{index + 1}</td>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.city}</td>
                <td className="border p-2">
                  {/* Safely handle the undefined or non-numeric values */}
                  {typeof user.totalCarbon === 'number' && !isNaN(user.totalCarbon)
                      ? user.totalCarbon.toFixed(2)
                              : 'N/A'} kgCO2e
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };
  

  return (
    <div className="bg-gray-100 min-h-screen">
      <header className="bg-gray-800 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Carbon Tracker</h1>
        <nav className="space-x-6">
          <a href="/" className="mx-4 hover:text-blue-500">Home</a>
          <a href="/community" className="mx-4 hover:text-blue-500">Community</a>
          <span className="mx-4">Welcome, {userEmail}</span>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Logout</button>
        </nav>
      </header>

      <div className="my-8 text-center">
  <h2 className="text-2xl font-semibold">Latest Total Emissions</h2>
  <div className="flex justify-around mt-4">
    <div className="text-center bg-white p-4 rounded shadow-lg w-1/4">
      <h3 className="text-lg font-semibold">Transportation</h3>
      <p>{totalEmissions.transportation.toFixed(2)} kgCO2e</p>
    </div>
    <div className="text-center bg-white p-4 rounded shadow-lg w-1/4">
      <h3 className="text-lg font-semibold">Electricity</h3>
      <p>{totalEmissions.electricity.toFixed(2)} kgCO2e</p>
    </div>
    <div className="text-center bg-white p-4 rounded shadow-lg w-1/4">
      <h3 className="text-lg font-semibold">Waste</h3>
      <p>{totalEmissions.waste.toFixed(2)} kgCO2e</p>
    </div>
  </div>

  <div className="mt-6">
    <button
      onClick={() => { setShowLeaderboard(!showLeaderboard); if (!showLeaderboard) fetchLeaderboardData(); }}
      className="p-2 bg-green-500 text-white rounded"
    >
      Leaderboard
    </button>
  </div>

  {error && <p className="text-red-500 mt-4">{error}</p>}
  {showLeaderboard && renderLeaderboard()}
</div>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-center">Carbon Emissions History</h2>
        <div className="max-w-4xl mx-auto">
          <Line data={chartData} />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-lg max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Submit Daily Consumption Details</h2>
        {error && <p className="text-red-500">{error}</p>}
        {/* Transportation Data */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Transportation</h3>
          {transportationData.map((data, index) => (
            <div key={index} className="mb-2 flex gap-4">
              <input
                type="number"
                name="distance"
                placeholder="Distance (km)"
                value={data.distance}
                onChange={(e) => handleTransportationChange(index, e)}
                className="w-1/2 px-3 py-2 border rounded"
              />
              <input
                type="text"
                name="mode"
                placeholder="Mode of Transport"
                value={data.mode}
                onChange={(e) => handleTransportationChange(index, e)}
                className="w-1/2 px-3 py-2 border rounded"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddTransportation}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Add More
          </button>
        </div>

        {/* Electricity Data */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Electricity</h3>
          <input
            type="number"
            name="previousUsage"
            placeholder="Previous Month Usage (kWh)"
            value={electricityData.previousUsage}
            onChange={handleElectricityChange}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="number"
            name="todayUsage"
            placeholder="Today's Usage (kWh)"
            value={electricityData.todayUsage}
            onChange={handleElectricityChange}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        {/* Waste Data */}
        <div className="mb-4">
          <h3 className="text-xl font-semibold mb-2">Waste</h3>
          <input
            type="number"
            name="dryWaste"
            placeholder="Dry Waste (kg)"
            value={wasteData.dryWaste}
            onChange={handleWasteChange}
            className="w-full px-3 py-2 border rounded mb-2"
          />
          <input
            type="number"
            name="wetWaste"
            placeholder="Wet Waste (kg)"
            value={wasteData.wetWaste}
            onChange={handleWasteChange}
            className="w-full px-3 py-2 border rounded"
          />
        </div>

        <button
          type="submit"
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
        >
          Calculate Carbon Footprint
        </button>
      </form>

      <div className="mt-8 max-w-4xl mx-auto">
        <h2 className="text-2xl font-semibold mb-4">Detailed Emissions</h2>
        <div className="flex justify-center space-x-4 mb-4">
          <button
            onClick={() => setActiveCategory('transportation')}
            className={`px-4 py-2 rounded ${activeCategory === 'transportation' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Transportation
          </button>
          <button
            onClick={() => setActiveCategory('electricity')}
            className={`px-4 py-2 rounded ${activeCategory === 'electricity' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Electricity
          </button>
          <button
            onClick={() => setActiveCategory('waste')}
            className={`px-4 py-2 rounded ${activeCategory === 'waste' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Waste
          </button>
        </div>
        <div className="bg-white p-4 rounded shadow-lg">
          {renderEmissionsDetails()}
        </div>
        
      </div>
    </div>
  );
};

export default CarbonTracker;