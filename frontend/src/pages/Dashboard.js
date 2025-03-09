// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Typography,
  Grid,
  Paper,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Link,
  IconButton,
  Divider,
  CircularProgress,
  Tooltip,
  Card,
  CardContent,
  TextField,
  InputAdornment
} from '@material-ui/core';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  CloudDownload as DownloadIcon,
  Assignment as AnalysisIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles((theme) => ({
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  title: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3),
    marginBottom: theme.spacing(3),
  },
  table: {
    minWidth: 650,
  },
  tableContainer: {
    marginTop: theme.spacing(2),
  },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  iconButton: {
    padding: theme.spacing(1),
  },
  noData: {
    textAlign: 'center',
    padding: theme.spacing(4),
  },
  cardIcon: {
    fontSize: 40,
    color: theme.palette.primary.main,
  },
  cardValue: {
    fontSize: '2rem',
    fontWeight: 'bold',
  },
  searchField: {
    marginBottom: theme.spacing(2),
  },
  statusSuccess: {
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  statusPending: {
    backgroundColor: theme.palette.warning.light,
    color: theme.palette.warning.contrastText,
  },
  statusError: {
    backgroundColor: theme.palette.error.light,
    color: theme.palette.error.contrastText,
  }
}));

const Dashboard = () => {
  const classes = useStyles();
  const { currentUser } = useAuth();
  
  const [eegData, setEegData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalAnalyses: 0,
    totalSize: 0
  });
  
  useEffect(() => {
    const fetchEEGData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/eeg/list');
        setEegData(response.data);
        
        // Calculate statistics
        const totalFiles = response.data.length;
        const totalAnalyses = response.data.filter(file => 
          file.svm_analysis && file.svm_analysis.performed
        ).length;
        const totalSize = response.data.reduce((sum, file) => sum + file.size, 0);
        
        setStats({
          totalFiles,
          totalAnalyses,
          totalSize
        });
        
      } catch (err) {
        console.error('Error fetching EEG data:', err);
        setError('Failed to load EEG data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchEEGData();
  }, []);
  
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this EEG data?')) {
      try {
        await axios.delete(`/api/eeg/${id}`);
        // Remove the deleted item from state
        setEegData(eegData.filter(item => item._id !== id));
        // Update stats
        setStats(prev => ({
          ...prev,
          totalFiles: prev.totalFiles - 1
        }));
      } catch (err) {
        console.error('Error deleting EEG data:', err);
        alert('Failed to delete EEG data. Please try again.');
      }
    }
  };
  
  const handleDownload = async (id) => {
    try {
      // Use direct URL to trigger browser download
      window.open(`/api/eeg/${id}/download`, '_blank');
    } catch (err) {
      console.error('Error downloading EEG file:', err);
      alert('Failed to download file. Please try again.');
    }
  };
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  const getAnalysisStatusChip = (item) => {
    if (!item.svm_analysis) {
      return (
        <Chip
          size="small"
          label="Not Analyzed"
          variant="outlined"
        />
      );
    }
    
    if (item.svm_analysis.in_progress) {
      return (
        <Chip
          size="small"
          icon={<PendingIcon />}
          label="In Progress"
          className={classes.statusPending}
        />
      );
    }
    
    if (item.svm_analysis.performed) {
      if (item.svm_analysis.error) {
        return (
          <Chip
            size="small"
            icon={<ErrorIcon />}
            label="Error"
            className={classes.statusError}
          />
        );
      }
      
      return (
        <Chip
          size="small"
          icon={<CheckIcon />}
          label={item.svm_analysis.result || "Completed"}
          className={classes.statusSuccess}
        />
      );
    }
    
    if (item.svm_analysis.requested) {
      return (
        <Chip
          size="small"
          icon={<PendingIcon />}
          label="Requested"
          className={classes.statusPending}
        />
      );
    }
    
    return (
      <Chip
        size="small"
        label="Not Analyzed"
        variant="outlined"
      />
    );
  };
  
  const filteredData = eegData.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    return (
      item.originalFilename.toLowerCase().includes(searchLower) ||
      item.metadata?.subject?.id?.toLowerCase().includes(searchLower) ||
      item.format.toLowerCase().includes(searchLower) ||
      (item.metadata?.task || '').toLowerCase().includes(searchLower)
    );
  });
  
  return (
    <Container maxWidth="lg" className={classes.container}>
      <div className={classes.headerActions}>
        <Typography variant="h4" component="h1" className={classes.title}>
          EEG Data Dashboard
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          component={RouterLink}
          to="/upload"
        >
          Upload New EEG
        </Button>
      </div>
      
      {/* Stats Cards */}
      <Grid container spacing={3} style={{ marginBottom: '24px' }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <Typography color="textSecondary" gutterBottom>
                Total EEG Files
              </Typography>
              <Typography className={classes.cardValue} color="primary">
                {stats.totalFiles}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <Typography color="textSecondary" gutterBottom>
                Completed Analyses
              </Typography>
              <Typography className={classes.cardValue} color="primary">
                {stats.totalAnalyses}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent align="center">
              <Typography color="textSecondary" gutterBottom>
                Total Storage Used
              </Typography>
              <Typography className={classes.cardValue} color="primary">
                {formatFileSize(stats.totalSize)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Paper className={classes.paper}>
        <Typography variant="h6" gutterBottom>
          Your EEG Files
        </Typography>
        
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by filename, subject ID, format, or task..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={classes.searchField}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {loading ? (
          <Box display="flex" justifyContent="center" padding={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box className={classes.noData}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : filteredData.length === 0 ? (
          <Box className={classes.noData}>
            {searchQuery ? (
              <Typography>No results found for "{searchQuery}"</Typography>
            ) : (
              <>
                <Typography>No EEG files uploaded yet</Typography>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  component={RouterLink}
                  to="/upload"
                  style={{ marginTop: '16px' }}
                >
                  Upload Your First EEG
                </Button>
              </>
            )}
          </Box>
        ) : (
          <TableContainer className={classes.tableContainer}>
            <Table className={classes.table} size="medium">
              <TableHead>
                <TableRow>
                  <TableCell>Filename</TableCell>
                  <TableCell>Subject ID</TableCell>
                  <TableCell>Upload Date</TableCell>
                  <TableCell>Format</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Analysis Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item._id}>
                    <TableCell component="th" scope="row">
                      <Link component={RouterLink} to={`/eeg/${item._id}`}>
                        {item.originalFilename}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {item.metadata?.subject?.id || 'Unknown'}
                    </TableCell>
                    <TableCell>
                      {format(new Date(item.uploadDate), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={item.format.toUpperCase()}
                        className={classes.chip}
                      />
                    </TableCell>
                    <TableCell>{formatFileSize(item.size)}</TableCell>
                    <TableCell>
                      {getAnalysisStatusChip(item)}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton
                          className={classes.iconButton}
                          component={RouterLink}
                          to={`/eeg/${item._id}`}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download">
                        <IconButton
                          className={classes.iconButton}
                          onClick={() => handleDownload(item._id)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Run Analysis">
                        <IconButton
                          className={classes.iconButton}
                          component={RouterLink}
                          to={`/analysis/${item._id}`}
                        >
                          <AnalysisIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          className={classes.iconButton}
                          onClick={() => handleDelete(item._id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
};

export default Dashboard;