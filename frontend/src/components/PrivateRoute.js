// src/components/PrivateRoute.js
import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { currentUser, loading } = useAuth();
  
  return (
    <Route
      {...rest}
      render={(props) => {
        // Show loading indicator while checking authentication
        if (loading) {
          return <div>Loading...</div>;
        }
        
        // Redirect to login if not authenticated
        if (!currentUser) {
          return <Redirect to="/login" />;
        }
        
        // Render the protected component
        return <Component {...props} />;
      }}
    />
  );
};

export default PrivateRoute;