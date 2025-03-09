// src/App.js
import React from 'react';
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@material-ui/core';
import theme from './theme';
import { AuthProvider } from './contexts/AuthContext';

// Components
import NavBar from './components/NavBar';
import PrivateRoute from './components/PrivateRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EEGUpload from './pages/EEGUpload';
import EEGDetail from './pages/EEGDetail';
import ADHDAnalysis from './pages/ADHDAnalysis';
import Profile from './pages/Profile';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Switch>
            <Route exact path="/">
              <Redirect to="/dashboard" />
            </Route>
            <Route path="/login" component={Login} />
            <Route path="/register" component={Register} />
            <Route path="/(.+)">
              {/* Routes that require navigation bar */}
              <>
                <NavBar />
                <Switch>
                  <PrivateRoute exact path="/dashboard" component={Dashboard} />
                  <PrivateRoute exact path="/upload" component={EEGUpload} />
                  <PrivateRoute exact path="/eeg/:id" component={EEGDetail} />
                  <PrivateRoute exact path="/analysis/:id" component={ADHDAnalysis} />
                  <PrivateRoute exact path="/profile" component={Profile} />
                </Switch>
              </>
            </Route>
          </Switch>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;