import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const AuthPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [city, setCity] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (isRegistering && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
  
    try {
      const endpoint = isRegistering ? 'signup' : 'login';
      const payload = isRegistering
        ? { name, email, password, city }
        : { email, password };
  
      const response = await fetch(`http://localhost:3000/auth/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
  
      const contentType = response.headers.get('Content-Type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        console.log('Response data:', data); // Debug: Log the entire response data
  
        if (response.ok) {
          if (!isRegistering && data.token) { // Only decode the token during login
            // Decode the JWT token
            const decodedToken = jwtDecode(data.token);
            console.log('Decoded token:', decodedToken); // Debug: Log the decoded token
  
            // Check if the decoded token contains a user ID
            if (decodedToken.userId) {
              const userId = decodedToken.userId;
              console.log(userId);
              localStorage.setItem('userId', userId);
              localStorage.setItem('jwtToken', data.token);
  
              navigate('/carbontracker'); // Redirect to CarbonTracker after login
            } else {
              console.error('User ID not found in token:', decodedToken);
              setError('Login successful, but there was an issue with the token. Please contact support.');
            }
          } else if (isRegistering) {
            setError('Registration successful! Please log in.');
            // Clear form fields after registration
            setName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setCity('');
            setIsRegistering(false);
          }
        } else {
          // If response is not ok or token is missing, set the error message from the response
          setError(data.message || 'An error occurred. Please try again.');
        }
      } else {
        console.error('Received non-JSON response:', await response.text());
        setError('Received non-JSON response. Please check the server.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };
  

  return (
    <div className="bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-4">{isRegistering ? 'Register' : 'Login'}</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          
          {isRegistering && (
            <>
              <label className="block text-gray-700 font-bold mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
              
              <label className="block text-gray-700 font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
              
              <label className="block text-gray-700 font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
              
              <label className="block text-gray-700 font-bold mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
              
              <label className="block text-gray-700 font-bold mb-2">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
            </>
          )}
          
          {!isRegistering && (
            <>
              <label className="block text-gray-700 font-bold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
              
              <label className="block text-gray-700 font-bold mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                required
              />
            </>
          )}
          
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          >
            {isRegistering ? 'Register' : 'Login'}
          </button>
          
          <p className="mt-4">
            {isRegistering ? 'Already have an account?' : 'Need an account?'}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="text-blue-500 ml-2"
            >
              {isRegistering ? 'Login' : 'Register'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthPage;
