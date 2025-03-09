// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  Divider,
  Box,
  Snackbar,
  CircularProgress,
  Avatar,
  Tab,
  Tabs,
  Card,
  CardContent
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import { Person as PersonIcon, Lock as LockIcon } from '@material-ui/icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  avatar: {
    width: theme.spacing(10),
    height: theme.spacing(10),
    margin: 'auto',
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.primary.main,
  },
  avatarIcon: {
    fontSize: theme.spacing(5),
  },
  form: {
    marginTop: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  tabContent: {
    padding: theme.spacing(3),
  },
  buttonProgress: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  buttonWrapper: {
    position: 'relative',
    display: 'inline-block',
  },
  tabPanel: {
    padding: theme.spacing(3, 0),
  },
  statsCard: {
    height: '100%',
  },
  statsValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  statsLabel: {
    color: theme.palette.text.secondary,
  }
}));

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box className={props.className}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Profile = () => {
  const classes = useStyles();
  const { currentUser, login, logout } = useAuth();
  
  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for profile form
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [organization, setOrganization] = useState('');
  
  // State for password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading and error states
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Success message state
  const [successMessage, setSuccessMessage] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  
  // Stats
  const [userStats, setUserStats] = useState({
    totalUploads: 0,
    totalAnalyses: 0,
    lastActivity: null
  });
  
  // Fetch user data on component mount
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || '');
      setEmail(currentUser.email || '');
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setOrganization(currentUser.organization || '');
      
      // Fetch user stats
      fetchUserStats();
    }
  }, [currentUser]);
  
  const fetchUserStats = async () => {
    try {
      // Sample - In a real app, you'd have an API endpoint for this
      // This is just a placeholder for the stats that you would get from the backend
      const stats = {
        totalUploads: 15,
        totalAnalyses: 8,
        lastActivity: new Date()
      };
      
      setUserStats(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };
  
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setProfileLoading(true);
      setProfileError('');
      
      const response = await axios.put('/api/users/profile', {
        username,
        email,
        firstName,
        lastName,
        organization
      });
      
      // Update context with new user data
      if (response.data) {
        // In a real app, you'd have a way to update the current user info in context
        // This is a simple example - might need to be adjusted based on your auth implementation
        const token = localStorage.getItem('token');
        if (token) {
          await login(email, currentPassword); // Re-login to refresh user data
        }
      }
      
      setSuccessMessage('Profile updated successfully');
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error('Error updating profile:', err);
      setProfileError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    try {
      setPasswordLoading(true);
      setPasswordError('');
      
      await axios.put('/api/users/password', {
        currentPassword,
        newPassword
      });
      
      // Clear password fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSuccessMessage('Password updated successfully');
      setSnackbarOpen(true);
      
    } catch (err) {
      console.error('Error updating password:', err);
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  return (
    <Container className={classes.root}>
      <Typography variant="h4" component="h1" className={classes.title}>
        Your Profile
      </Typography>
      
      <Grid container spacing={3}>
        {/* User Stats */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Card className={classes.statsCard}>
                <CardContent align="center">
                  <Typography variant="h6" className={classes.statsLabel}>
                    EEG Uploads
                  </Typography>
                  <Typography className={classes.statsValue}>
                    {userStats.totalUploads}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card className={classes.statsCard}>
                <CardContent align="center">
                  <Typography variant="h6" className={classes.statsLabel}>
                    ADHD Analyses
                  </Typography>
                  <Typography className={classes.statsValue}>
                    {userStats.totalAnalyses}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Card className={classes.statsCard}>
                <CardContent align="center">
                  <Typography variant="h6" className={classes.statsLabel}>
                    Last Activity
                  </Typography>
                  <Typography className={classes.statsValue}>
                    {userStats.lastActivity 
                      ? new Date(userStats.lastActivity).toLocaleDateString() 
                      : 'Never'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
        
        {/* Profile Tabs */}
        <Grid item xs={12}>
          <Paper>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab icon={<PersonIcon />} label="Profile Information" />
              <Tab icon={<LockIcon />} label="Change Password" />
            </Tabs>
            
            <Divider />
            
            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0} className={classes.tabPanel}>
              <Grid container spacing={2} justify="center">
                <Grid item xs={12} md={8}>
                  <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
                    <Avatar className={classes.avatar}>
                      <PersonIcon className={classes.avatarIcon} />
                    </Avatar>
                    <Typography variant="h5">
                      {firstName} {lastName}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {username}
                    </Typography>
                  </Box>
                  
                  {profileError && (
                    <Alert severity="error" style={{ marginBottom: 16 }}>
                      {profileError}
                    </Alert>
                  )}
                  
                  <form onSubmit={handleProfileSubmit} className={classes.form}>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Username"
                          variant="outlined"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          variant="outlined"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="First Name"
                          variant="outlined"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Last Name"
                          variant="outlined"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Organization"
                          variant="outlined"
                          value={organization}
                          onChange={(e) => setOrganization(e.target.value)}
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end">
                          <div className={classes.buttonWrapper}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={profileLoading}
                            >
                              Save Changes
                            </Button>
                            {profileLoading && (
                              <CircularProgress size={24} className={classes.buttonProgress} />
                            )}
                          </div>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
                </Grid>
              </Grid>
            </TabPanel>
            
            {/* Password Tab */}
            <TabPanel value={tabValue} index={1} className={classes.tabPanel}>
              <Grid container spacing={2} justify="center">
                <Grid item xs={12} md={8}>
                  <Typography variant="h6" gutterBottom>
                    Change Your Password
                  </Typography>
                  
                  {passwordError && (
                    <Alert severity="error" style={{ marginBottom: 16 }}>
                      {passwordError}
                    </Alert>
                  )}
                  
                  <form onSubmit={handlePasswordSubmit} className={classes.form}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Current Password"
                          variant="outlined"
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="New Password"
                          variant="outlined"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                          helperText="Password must be at least 6 characters long"
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Confirm New Password"
                          variant="outlined"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                          error={newPassword !== confirmPassword && confirmPassword !== ''}
                          helperText={
                            newPassword !== confirmPassword && confirmPassword !== ''
                              ? 'Passwords do not match'
                              : ''
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <Box display="flex" justifyContent="flex-end">
                          <div className={classes.buttonWrapper}>
                            <Button
                              type="submit"
                              variant="contained"
                              color="primary"
                              disabled={passwordLoading}
                            >
                              Update Password
                            </Button>
                            {passwordLoading && (
                              <CircularProgress size={24} className={classes.buttonProgress} />
                            )}
                          </div>
                        </Box>
                      </Grid>
                    </Grid>
                  </form>
                </Grid>
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Profile;