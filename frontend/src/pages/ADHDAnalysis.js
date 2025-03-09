// src/pages/ADHDAnalysis.js
import React, { useState, useEffect } from 'react';
import { useParams, useHistory, Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Stepper,
  Step,
  StepLabel,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Snackbar,
  IconButton,
  Tooltip,
  Chip
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  PlayArrow as RunIcon,
  Check as CheckIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  ArrowBack as BackIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  BrainIcon,
  Science as ScienceIcon,
  Description as FileIcon,
  Person as PersonIcon,
  Assignment as ReportIcon,
  HelpOutline as HelpIcon
} from '@material-ui/icons';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
import { format } from 'date-fns';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  stepper: {
    backgroundColor: 'transparent',
    marginBottom: theme.spacing(3),
  },
  chartContainer: {
    height: 300,
    marginBottom: theme.spacing(2),
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
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
  noAnalysisCard: {
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  noAnalysisIcon: {
    fontSize: 48,
    color: theme.palette.text.secondary,
    marginBottom: theme.spacing(2),
  },
  resultCard: {
    marginBottom: theme.spacing(3),
  },
  resultIcon: {
    fontSize: 42,
    marginBottom: theme.spacing(1),
  },
  resultSuccess: {
    color: theme.palette.success.main,
  },
  resultError: {
    color: theme.palette.error.main,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  infoIcon: {
    fontSize: 16,
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary,
    verticalAlign: 'middle',
  },
  confidenceValue: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: theme.palette.primary.main,
  },
  resultValue: {
    fontSize: '1.75rem',
    fontWeight: 'bold',
  },
  footer: {
    marginTop: theme.spacing(4),
    textAlign: 'center',
  }
}));

// Analysis steps
const steps = ['Review EEG Data', 'Request Analysis', 'View Results'];

const ADHDAnalysis = () => {
  const classes = useStyles();
  const { id } = useParams();
  const history = useHistory();
  
  const [eegData, setEegData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisCompleted, setAnalysisCompleted] = useState(false);
  const [pollingTimer, setPollingTimer] = useState(null);
  
  // State for snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Feature descriptions for tooltips
  const featureDescriptions = {
    global_theta_beta_ratio: 'Ratio of theta (4-8 Hz) to beta (13-30 Hz) power across all channels. Elevated in ADHD.',
    frontal_theta: 'Theta band power in frontal brain regions. Often elevated in ADHD.',
    central_beta: 'Beta band power in central brain regions. Often reduced in ADHD.'
  };
  
  // Fetch EEG data
  useEffect(() => {
    const fetchEEGData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/eeg/${id}`);
        setEegData(response.data);
        
        // Determine initial step based on analysis status
        if (response.data.svm_analysis) {
          if (response.data.svm_analysis.performed) {
            setActiveStep(2); // View Results
            setAnalysisCompleted(true);
          } else if (response.data.svm_analysis.requested || response.data.svm_analysis.in_progress) {
            setActiveStep(1); // Request Analysis (polling)
            startPolling();
          }
        }
      } catch (err) {
        console.error('Error fetching EEG data:', err);
        setError('Failed to load EEG data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEEGData();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingTimer) {
        clearTimeout(pollingTimer);
      }
    };
  }, [id]);
  
  // Start polling for analysis results
  const startPolling = () => {
    const poll = async () => {
      try {
        const response = await axios.get(`/api/eeg/${id}`);
        setEegData(response.data);
        
        if (response.data.svm_analysis && response.data.svm_analysis.performed) {
          // Analysis completed
          setActiveStep(2);
          setAnalysisCompleted(true);
          
          setSnackbar({
            open: true,
            message: 'Analysis completed successfully',
            severity: 'success'
          });
        } else {
          // Continue polling
          const timer = setTimeout(poll, 5000); // Poll every 5 seconds
          setPollingTimer(timer);
        }
      } catch (err) {
        console.error('Error polling for results:', err);
        // Continue polling even on error
        const timer = setTimeout(poll, 10000); // Longer delay on error
        setPollingTimer(timer);
      }
    };
    
    // Start initial poll
    poll();
  };
  
  // Handle request for ADHD analysis
  const handleRequestAnalysis = async () => {
    try {
      setAnalysisLoading(true);
      
      await axios.post(`/api/eeg/${id}/analyze`);
      
      // Update the EEG data state
      setEegData(prev => ({
        ...prev,
        svm_analysis: {
          ...(prev.svm_analysis || {}),
          requested: true,
          performed: false,
          in_progress: false
        }
      }));
      
      setSnackbar({
        open: true,
        message: 'Analysis request submitted successfully',
        severity: 'success'
      });
      
      // Move to next step
      setActiveStep(1);
      
      // Start polling for results
      startPolling();
    } catch (err) {
      console.error('Error requesting analysis:', err);
      setSnackbar({
        open: true,
        message: 'Failed to request analysis. Please try again.',
        severity: 'error'
      });
    } finally {
      setAnalysisLoading(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbar(prev => ({
      ...prev,
      open: false
    }));
  };
  
  // Prepare chart data
  const getChartData = () => {
    if (!eegData || !eegData.svm_analysis || !eegData.svm_analysis.performed) {
      return null;
    }
    
    // Get probabilities for doughnut chart
    const probabilities = eegData.svm_analysis.details?.probabilities || {};
    
    const doughnutData = {
      labels: Object.keys(probabilities),
      datasets: [
        {
          data: Object.values(probabilities).map(p => p * 100),
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 206, 86, 0.7)',
            'rgba(75, 192, 192, 0.7)',
          ],
          borderWidth: 1,
        },
      ],
    };
    
    // Key features for bar chart
    const keyFeatures = eegData.svm_analysis.details?.key_features || {};
    
    const barData = {
      labels: Object.keys(keyFeatures).map(k => {
        // Format label to be more readable
        const label = k.replace(/_/g, ' ').replace(/global/g, 'global ');
        return label.charAt(0).toUpperCase() + label.slice(1);
      }),
      datasets: [
        {
          label: 'Feature Values',
          data: Object.values(keyFeatures),
          backgroundColor: 'rgba(54, 162, 235, 0.7)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1,
        },
      ],
    };
    
    return {
      doughnutData,
      barData
    };
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0: // Review EEG Data
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    EEG File Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <FileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Filename"
                        secondary={eegData.originalFilename}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Format"
                        secondary={eegData.format.toUpperCase()}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="File Size"
                        secondary={formatFileSize(eegData.size)}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Sample Rate"
                        secondary={`${eegData.metadata?.sampleRate || 'Unknown'} Hz`}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <TimelineIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Duration"
                        secondary={`${eegData.metadata?.duration || 'Unknown'} seconds`}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Subject Information
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Subject ID"
                        secondary={eegData.metadata?.subject?.id || 'Unknown'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Age"
                        secondary={eegData.metadata?.subject?.age || 'Unknown'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Gender"
                        secondary={eegData.metadata?.subject?.gender || 'Unknown'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <PersonIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Group"
                        secondary={eegData.metadata?.subject?.group || 'Control'}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <InfoIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary="Task"
                        secondary={eegData.metadata?.task || 'Unknown'}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Analysis Information
                  </Typography>
                  <Typography variant="body1" paragraph>
                    This analysis will use a Support Vector Machine (SVM) model to classify the EEG data for ADHD indicators. The analysis includes:
                  </Typography>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="EEG frequency band power extraction (delta, theta, alpha, beta, gamma)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Calculation of key ADHD biomarkers (theta/beta ratio, frontal asymmetry)" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="SVM-based classification with probability estimates" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon />
                      </ListItemIcon>
                      <ListItemText primary="Visual representation of key features and results" />
                    </ListItem>
                  </List>
                  
                  <Box mt={2}>
                    <Alert severity="info">
                      <strong>Note:</strong> This analysis is provided for research purposes only and should not be used for clinical diagnosis.
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} className={classes.formButtons}>
              <Box display="flex" justifyContent="space-between">
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  component={RouterLink}
                  to={`/eeg/${id}`}
                >
                  Back to EEG Details
                </Button>
                
                <div className={classes.buttonWrapper}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<RunIcon />}
                    onClick={handleRequestAnalysis}
                    disabled={analysisLoading}
                  >
                    Run ADHD Analysis
                  </Button>
                  {analysisLoading && (
                    <CircularProgress size={24} className={classes.buttonProgress} />
                  )}
                </div>
              </Box>
            </Grid>
          </Grid>
        );
        
      case 1: // Request Analysis (In Progress)
        return (
          <Card className={classes.noAnalysisCard}>
            <CircularProgress size={60} className={classes.noAnalysisIcon} />
            <Typography variant="h5" gutterBottom>
              Analysis in Progress
            </Typography>
            <Typography variant="body1" paragraph>
              We're processing your EEG data. This may take a few minutes.
            </Typography>
            <Typography variant="body2" color="textSecondary" paragraph>
              The page will automatically update when results are ready.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              component={RouterLink}
              to={`/eeg/${id}`}
              style={{ marginTop: 16 }}
            >
              Back to EEG Details
            </Button>
          </Card>
        );
        
      case 2: // View Results
        if (!eegData.svm_analysis || !eegData.svm_analysis.performed) {
          return (
            <Card className={classes.noAnalysisCard}>
              <ErrorIcon className={classes.noAnalysisIcon} color="error" />
              <Typography variant="h5" gutterBottom>
                Analysis Not Available
              </Typography>
              <Typography variant="body1" paragraph>
                The analysis results are not available yet or an error occurred.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RunIcon />}
                onClick={() => {
                  setActiveStep(0);
                }}
              >
                Restart Analysis
              </Button>
            </Card>
          );
        }
        
        if (eegData.svm_analysis.error) {
          return (
            <Card className={classes.noAnalysisCard}>
              <ErrorIcon className={classes.noAnalysisIcon} color="error" />
              <Typography variant="h5" gutterBottom>
                Analysis Error
              </Typography>
              <Typography variant="body1" color="error" paragraph>
                {eegData.svm_analysis.error || 'An error occurred during analysis.'}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<RunIcon />}
                onClick={() => {
                  setActiveStep(0);
                }}
              >
                Retry Analysis
              </Button>
            </Card>
          );
        }
        
        const chartData = getChartData();
        
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card className={classes.resultCard}>
                <CardContent align="center">
                  {eegData.svm_analysis.result === 'ADHD' ? (
                    <Chip
                      label="ADHD Indicators Present"
                      color="primary"
                      size="medium"
                      style={{ padding: '24px 16px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    />
                  ) : (
                    <Chip
                      label="Non-ADHD Pattern"
                      color="secondary" 
                      size="medium"
                      style={{ padding: '24px 16px', fontSize: '1.1rem', fontWeight: 'bold' }}
                    />
                  )}
                  
                  <Box mt={3}>
                    <Typography variant="subtitle1" gutterBottom>
                      Classification Confidence
                    </Typography>
                    <Typography className={classes.confidenceValue}>
                      {(eegData.svm_analysis.confidence * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                  
                  <Divider style={{ margin: '24px 0' }} />
                  
                  <Typography variant="body2" color="textSecondary">
                    Analysis performed on {format(new Date(eegData.svm_analysis.performed_at), 'MMMM d, yyyy')}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Classification Probabilities
                  </Typography>
                  
                  {chartData && (
                    <div className={classes.chartContainer}>
                      <Doughnut
                        data={chartData.doughnutData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const label = context.label || '';
                                  const value = context.raw || 0;
                                  return `${label}: ${value.toFixed(1)}%`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  <Typography variant="body2" color="textSecondary">
                    The chart shows the probability that the EEG pattern belongs to each class.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Key EEG Features
                    <Tooltip title="These features are most relevant for ADHD classification">
                      <HelpIcon className={classes.infoIcon} />
                    </Tooltip>
                  </Typography>
                  
                  {chartData && (
                    <div className={classes.chartContainer}>
                      <Bar
                        data={chartData.barData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const datasetLabel = context.dataset.label || '';
                                  const value = context.raw || 0;
                                  const featureKey = Object.keys(eegData.svm_analysis.details?.key_features || {})[context.dataIndex];
                                  const description = featureDescriptions[featureKey] || '';
                                  return [`${datasetLabel}: ${value.toFixed(2)}`, description];
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </div>
                  )}
                  
                  <Typography variant="body2" color="textSecondary">
                    <strong>Note:</strong> Higher theta/beta ratio is often associated with ADHD.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Interpretation & Context
                  </Typography>
                  
                  <Typography variant="body1" paragraph>
                    {eegData.svm_analysis.result === 'ADHD' ? (
                      <>
                        The EEG pattern shows characteristics commonly associated with ADHD, including:
                        <ul>
                          <li>Elevated theta/beta ratio, which is a common biomarker for ADHD</li>
                          <li>Specific power distribution across frequency bands that aligns with ADHD research literature</li>
                        </ul>
                      </>
                    ) : (
                      <>
                        The EEG pattern does not show the typical characteristics associated with ADHD:
                        <ul>
                          <li>The theta/beta ratio falls within the range typically seen in non-ADHD individuals</li>
                          <li>The power distribution across frequency bands aligns more closely with normative data</li>
                        </ul>
                      </>
                    )}
                  </Typography>
                  
                  <Box mt={2} mb={2}>
                    <Alert severity="warning">
                      <Typography variant="body2">
                        <strong>Important:</strong> This analysis is provided for research purposes only. A proper ADHD diagnosis requires comprehensive clinical assessment by qualified healthcare professionals.
                      </Typography>
                    </Alert>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} className={classes.footer}>
              <Button
                variant="outlined"
                startIcon={<BackIcon />}
                component={RouterLink}
                to={`/eeg/${id}`}
                style={{ marginRight: 16 }}
              >
                Back to EEG Details
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                startIcon={<RunIcon />}
                onClick={() => {
                  setActiveStep(0);
                }}
              >
                Run New Analysis
              </Button>
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };
  
  if (loading) {
    return (
      <Container className={classes.container}>
        <Box display="flex" justifyContent="center" padding={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  if (error || !eegData) {
    return (
      <Container className={classes.container}>
        <Paper className={classes.paper}>
          <Alert severity="error">
            {error || 'Failed to load EEG data'}
          </Alert>
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              component={RouterLink}
              to="/dashboard"
            >
              Return to Dashboard
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }
  
  return (
    <Container className={classes.container}>
      <div className={classes.headerActions}>
        <Typography variant="h4" component="h1" className={classes.title}>
          ADHD Analysis
        </Typography>
      </div>
      
      <Paper className={classes.paper}>
        <Stepper activeStep={activeStep} className={classes.stepper}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
      </Paper>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ADHDAnalysis;