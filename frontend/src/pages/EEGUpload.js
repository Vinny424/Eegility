// src/pages/EEGUpload.js
import React, { useState, useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Divider,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  MenuItem,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Link
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { makeStyles } from '@material-ui/core/styles';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  Cancel as CancelIcon,
  Add as AddIcon,
  Help as HelpIcon
} from '@material-ui/icons';
import { useDropzone } from 'react-dropzone';

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
  dropzone: {
    border: `2px dashed ${theme.palette.primary.main}`,
    borderRadius: theme.shape.borderRadius,
    padding: theme.spacing(4),
    textAlign: 'center',
    cursor: 'pointer',
    marginBottom: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    transition: 'border 0.3s ease-in-out',
    '&:hover': {
      borderColor: theme.palette.primary.dark,
    },
  },
  dropzoneActive: {
    borderColor: theme.palette.success.main,
    backgroundColor: theme.palette.action.hover,
  },
  uploadIcon: {
    fontSize: 48,
    marginBottom: theme.spacing(2),
    color: theme.palette.primary.main,
  },
  filePreview: {
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    backgroundColor: theme.palette.background.default,
    borderRadius: theme.shape.borderRadius,
  },
  fileIcon: {
    marginRight: theme.spacing(1),
    color: theme.palette.primary.main,
  },
  divider: {
    margin: theme.spacing(3, 0),
  },
  formControl: {
    marginBottom: theme.spacing(2),
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  stepper: {
    backgroundColor: 'transparent',
    marginBottom: theme.spacing(3),
  },
  helpIcon: {
    fontSize: 18,
    marginLeft: theme.spacing(1),
    color: theme.palette.text.secondary,
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
  },
}));

const steps = ['Select File', 'Add Metadata', 'Review & Upload'];

const EEGUpload = () => {
  const classes = useStyles();
  const history = useHistory();
  
  // State for stepper
  const [activeStep, setActiveStep] = useState(0);
  
  // State for file upload
  const [file, setFile] = useState(null);
  
  // State for metadata
  const [subjectId, setSubjectId] = useState('');
  const [subjectAge, setSubjectAge] = useState('');
  const [subjectGender, setSubjectGender] = useState('');
  const [subjectGroup, setSubjectGroup] = useState('control');
  const [sessionName, setSessionName] = useState('');
  const [taskName, setTaskName] = useState('');
  const [isBidsCompliant, setIsBidsCompliant] = useState(false);
  const [notes, setNotes] = useState('');
  
  // State for tags
  const [tags, setTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  
  // State for upload process
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Dropzone setup
  const onDrop = useCallback(acceptedFiles => {
    // We only accept one file, so take the first one
    const uploadedFile = acceptedFiles[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setActiveStep(1); // Move to metadata step
    }
  }, []);
  
  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: '.edf,.bdf,.vhdr,.vmrk,.eeg,.set,.fif,.cnt,.npy',
    maxFiles: 1
  });
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle form reset
  const handleReset = () => {
    setFile(null);
    setSubjectId('');
    setSubjectAge('');
    setSubjectGender('');
    setSubjectGroup('control');
    setSessionName('');
    setTaskName('');
    setIsBidsCompliant(false);
    setNotes('');
    setTags([]);
    setNewTag('');
    setActiveStep(0);
    setError('');
    setSuccess(false);
  };
  
  // Handle file upload
  const handleUpload = async () => {
    if (!file) {
      setError('No file selected');
      return;
    }
    
    setUploading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('eegFile', file);
      formData.append('subjectId', subjectId);
      formData.append('subjectAge', subjectAge);
      formData.append('subjectGender', subjectGender);
      formData.append('subjectGroup', subjectGroup);
      formData.append('session', sessionName);
      formData.append('task', taskName);
      formData.append('bidsCompliant', isBidsCompliant);
      formData.append('notes', notes);
      formData.append('tags', tags.join(','));
      
      const response = await axios.post('/api/eeg/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSuccess(true);
      
      // Redirect to the uploaded EEG data detail page
      setTimeout(() => {
        history.push(`/eeg/${response.data.eegData._id}`);
      }, 1500);
      
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };
  
  // Render step content
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Select an EEG file to upload
            </Typography>
            <div
              {...getRootProps()}
              className={`${classes.dropzone} ${isDragActive ? classes.dropzoneActive : ''}`}
            >
              <input {...getInputProps()} />
              <UploadIcon className={classes.uploadIcon} />
              <Typography variant="h6" gutterBottom>
                Drag & Drop EEG File Here
              </Typography>
              <Typography variant="body2" color="textSecondary">
                or click to select a file
              </Typography>
              <Typography variant="caption" color="textSecondary" display="block" style={{ marginTop: 8 }}>
                Supported formats: EDF, BDF, BrainVision (VHDR/VMRK/EEG), EEGLAB (SET), FIF, Neuroscan (CNT), NumPy (NPY)
              </Typography>
            </div>
            
            {file && (
              <Paper variant="outlined" className={classes.filePreview}>
                <Box display="flex" alignItems="center">
                  <FileIcon className={classes.fileIcon} />
                  <Typography variant="body1">
                    {file.name}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" style={{ marginLeft: 8 }}>
                    ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                  </Typography>
                  <Box flexGrow={1} />
                  <IconButton size="small" onClick={() => setFile(null)}>
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Paper>
            )}
          </div>
        );
      case 1:
        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Add Metadata
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subject ID"
                  variant="outlined"
                  fullWidth
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className={classes.formControl}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subject Age"
                  variant="outlined"
                  fullWidth
                  value={subjectAge}
                  onChange={(e) => setSubjectAge(e.target.value)}
                  type="number"
                  className={classes.formControl}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subject Gender"
                  variant="outlined"
                  fullWidth
                  value={subjectGender}
                  onChange={(e) => setSubjectGender(e.target.value)}
                  select
                  className={classes.formControl}
                >
                  <MenuItem value="">
                    <em>Not specified</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Subject Group"
                  variant="outlined"
                  fullWidth
                  value={subjectGroup}
                  onChange={(e) => setSubjectGroup(e.target.value)}
                  select
                  className={classes.formControl}
                >
                  <MenuItem value="control">Control</MenuItem>
                  <MenuItem value="adhd">ADHD</MenuItem>
                  <MenuItem value="asd">ASD</MenuItem>
                  <MenuItem value="epilepsy">Epilepsy</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Session Name"
                  variant="outlined"
                  fullWidth
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className={classes.formControl}
                  placeholder="e.g., baseline, followup"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Task Name"
                  variant="outlined"
                  fullWidth
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className={classes.formControl}
                  placeholder="e.g., rest, oddball"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={isBidsCompliant}
                      onChange={(e) => setIsBidsCompliant(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Box display="flex" alignItems="center">
                      <span>BIDS Compliant</span>
                      <Tooltip title="Brain Imaging Data Structure (BIDS) is a standardized format for organizing neuroimaging data">
                        <HelpIcon className={classes.helpIcon} />
                      </Tooltip>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Grid container alignItems="center" spacing={1}>
                  <Grid item xs>
                    <TextField
                      variant="outlined"
                      size="small"
                      fullWidth
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                  </Grid>
                  <Grid item>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddTag}
                      disabled={!newTag}
                    >
                      Add
                    </Button>
                  </Grid>
                </Grid>
                <Box mt={1}>
                  {tags.map((tag, index) => (
                    <Chip
                      key={index}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      className={classes.chip}
                    />
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Notes"
                  variant="outlined"
                  fullWidth
                  multiline
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={classes.formControl}
                />
              </Grid>
            </Grid>
          </div>
        );
      case 2:
        return (
          <div>
            <Typography variant="h6" gutterBottom>
              Review & Upload
            </Typography>
            <Paper variant="outlined" className={classes.filePreview}>
              <Typography variant="subtitle1" gutterBottom>
                File Information
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Filename"
                    secondary={file?.name}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="File Size"
                    secondary={`${(file?.size / (1024 * 1024)).toFixed(2)} MB`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="File Type"
                    secondary={file?.type || file?.name.split('.').pop().toUpperCase()}
                  />
                </ListItem>
              </List>
              
              <Divider className={classes.divider} />
              
              <Typography variant="subtitle1" gutterBottom>
                Metadata
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Subject ID"
                    secondary={subjectId || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Subject Age"
                    secondary={subjectAge || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Subject Gender"
                    secondary={subjectGender || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Subject Group"
                    secondary={subjectGroup || 'Control'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Session"
                    secondary={sessionName || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Task"
                    secondary={taskName || 'Not specified'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="BIDS Compliant"
                    secondary={isBidsCompliant ? 'Yes' : 'No'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Tags"
                    secondary={
                      tags.length > 0 
                        ? tags.map((tag, index) => (
                            <Chip 
                              key={index}
                              size="small"
                              label={tag}
                              className={classes.chip}
                            />
                          ))
                        : 'None'
                    }
                  />
                </ListItem>
                {notes && (
                  <ListItem>
                    <ListItemText 
                      primary="Notes"
                      secondary={notes}
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
            
            {error && (
              <Alert severity="error" style={{ marginTop: 16 }}>
                {error}
              </Alert>
            )}
            
            {success && (
              <Alert severity="success" style={{ marginTop: 16 }}>
                File uploaded successfully! Redirecting to file details...
              </Alert>
            )}
          </div>
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container maxWidth="md" className={classes.container}>
      <Paper className={classes.paper}>
        <Typography variant="h4" component="h1" className={classes.title}>
          Upload EEG Data
        </Typography>
        
        <Stepper activeStep={activeStep} className={classes.stepper}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        {getStepContent(activeStep)}
        
        <div className={classes.formButtons}>
          {activeStep !== 0 && (
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={uploading}
            >
              Back
            </Button>
          )}
          
          {activeStep === steps.length - 1 ? (
            <div className={classes.buttonWrapper}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<UploadIcon />}
                onClick={handleUpload}
                disabled={uploading || success || !file || !subjectId}
              >
                Upload
              </Button>
              {uploading && <CircularProgress size={24} className={classes.buttonProgress} />}
            </div>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !file) ||
                (activeStep === 1 && !subjectId)
              }
            >
              Next
            </Button>
          )}
        </div>
      </Paper>
    </Container>
  );
};

export default EEGUpload;