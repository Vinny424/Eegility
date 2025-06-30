// src/contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  
  // Configure axios defaults
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get('/api/auth/validate', {
          timeout: 5000 // 5 second timeout
        });
        if (response.data.valid) {
          // If we have valid token data, set it as current user
          setCurrentUser({
            id: response.data.userId,
            email: response.data.email
          });
        } else {
          logout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        // Clear invalid token but don't throw error
        logout();
      } finally {
        setLoading(false);
      }
    };
    
    verifyToken();
  }, [token]);
  
  // Register a new user
  const register = async (username, email, password) => {
    try {
      const response = await axios.post('/api/auth/register', {
        username,
        email,
        password
      });
      
      const { token: newToken, user } = response.data;
      
      // Save token to local storage
      localStorage.setItem('token', newToken);
      
      // Update state
      setToken(newToken);
      setCurrentUser(user);
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };
  
  // Login user
  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        email,
        password
      });
      
      const { token: newToken, user } = response.data;
      
      // Save token to local storage
      localStorage.setItem('token', newToken);
      
      // Update state
      setToken(newToken);
      setCurrentUser(user);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };
  
  // Logout user
  const logout = () => {
    // Remove token from local storage
    localStorage.removeItem('token');
    
    // Update state
    setToken(null);
    setCurrentUser(null);
    
    // Clear authorization header
    delete axios.defaults.headers.common['Authorization'];
  };
  
  // Update user profile
  const updateProfile = async (userData) => {
    try {
      const response = await axios.put('/api/users/profile', userData);
      setCurrentUser(response.data);
      return response.data;
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  };
  
  const value = {
    currentUser,
    login,
    logout,
    register,
    updateProfile,
    loading
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;