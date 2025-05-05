import './App.css';
import React from 'react';
import HomePage from './components/HomePage';
import CarbonTracker from './components/CarbonTracker';
import AuthPage from './components/AuthPage';        
import CommunityPage from './components/CommunityPage';
import LocationPage from './components/LocationPage';
import CommentsPage from './components/CommentsPage'; // Import the new CommentsPage component
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <div>
      <BrowserRouter>
        <div className="container mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/carbontracker" element={<CarbonTracker />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/authpage" element={<AuthPage />} />
            <Route path="/location" element={<LocationPage />} />
            <Route path="/comments/:postId" element={<CommentsPage />} /> {/* Route for Comments Page */}
          </Routes>
        </div>
      </BrowserRouter>
    </div>
  );
}

export default App;
