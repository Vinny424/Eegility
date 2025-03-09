// src/components/NavBar.js
import React, { useState } from 'react';
import { Link as RouterLink, useHistory } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Hidden,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Container,
  useTheme,
  useMediaQuery
} from '@material-ui/core';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  CloudUpload as UploadIcon,
  Psychology as BrainIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  AccountCircle
} from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import { useAuth } from '../contexts/AuthContext';

const useStyles = makeStyles((theme) => ({
  title: {
    flexGrow: 1,
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
  },
  titleLink: {
    color: 'inherit',
    textDecoration: 'none',
  },
  logo: {
    marginRight: theme.spacing(1),
    height: 32,
  },
  navButton: {
    marginLeft: theme.spacing(1),
  },
  drawer: {
    width: 240,
  },
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
  },
  menuButton: {
    marginRight: theme.spacing(2),
  },
  avatar: {
    width: theme.spacing(4),
    height: theme.spacing(4),
    marginLeft: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  drawerHeader: {
    padding: theme.spacing(2),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  drawerAvatar: {
    width: theme.spacing(8),
    height: theme.spacing(8),
    marginBottom: theme.spacing(1),
    backgroundColor: theme.palette.primary.main,
  },
  drawerUsername: {
    fontWeight: 'bold',
  },
  drawerEmail: {
    color: theme.palette.text.secondary,
    fontSize: '0.875rem',
  },
  activeListItem: {
    backgroundColor: theme.palette.action.selected,
  }
}));

const NavBar = () => {
  const classes = useStyles();
  const history = useHistory();
  const { currentUser, logout } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State for drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // State for user menu
  const [anchorEl, setAnchorEl] = useState(null);
  const menuOpen = Boolean(anchorEl);
  
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };
  
  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    history.push('/login');
    handleMenuClose();
  };
  
  const handleProfileClick = () => {
    history.push('/profile');
    handleMenuClose();
  };
  
  const navItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Upload EEG',
      icon: <UploadIcon />,
      path: '/upload',
    },
  ];
  
  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };
  
  const drawer = (
    <div className={classes.drawer}>
      <div className={classes.drawerHeader}>
        <Avatar className={classes.drawerAvatar}>
          {getInitials(currentUser?.username)}
        </Avatar>
        <Typography variant="subtitle1" className={classes.drawerUsername}>
          {currentUser?.username || 'User'}
        </Typography>
        <Typography variant="body2" className={classes.drawerEmail}>
          {currentUser?.email || 'user@example.com'}
        </Typography>
      </div>
      <Divider />
      <List>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={RouterLink}
            to={item.path}
            onClick={() => setDrawerOpen(false)}
            className={history.location.pathname === item.path ? classes.activeListItem : ''}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem
          button
          component={RouterLink}
          to="/profile"
          onClick={() => setDrawerOpen(false)}
          className={history.location.pathname === '/profile' ? classes.activeListItem : ''}
        >
          <ListItemIcon><PersonIcon /></ListItemIcon>
          <ListItemText primary="Profile" />
        </ListItem>
        <ListItem button onClick={handleLogout}>
          <ListItemIcon><LogoutIcon /></ListItemIcon>
          <ListItemText primary="Logout" />
        </ListItem>
      </List>
    </div>
  );
  
  return (
    <>
      <AppBar position="sticky" className={classes.appBar}>
        <Container>
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={handleDrawerToggle}
                className={classes.menuButton}
              >
                <MenuIcon />
              </IconButton>
            )}
            
            <Typography variant="h6" className={classes.title}>
              <RouterLink to="/dashboard" className={classes.titleLink}>
                <Box display="flex" alignItems="center">
                  <BrainIcon className={classes.logo} />
                  EEG BIDS DB
                </Box>
              </RouterLink>
            </Typography>
            
            <Hidden smDown>
              {navItems.map((item) => (
                <Button
                  key={item.text}
                  color="inherit"
                  component={RouterLink}
                  to={item.path}
                  className={classes.navButton}
                  startIcon={item.icon}
                >
                  {item.text}
                </Button>
              ))}
            </Hidden>
            
            <IconButton
              edge="end"
              color="inherit"
              aria-label="account"
              aria-controls="user-menu"
              aria-haspopup="true"
              onClick={handleMenuOpen}
            >
              <Avatar className={classes.avatar}>
                {getInitials(currentUser?.username)}
              </Avatar>
            </IconButton>
            
            <Menu
              id="user-menu"
              anchorEl={anchorEl}
              keepMounted
              open={menuOpen}
              onClose={handleMenuClose}
              PaperProps={{
                elevation: 3,
                style: {
                  minWidth: 200,
                },
              }}
            >
              <MenuItem onClick={handleProfileClick}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                Profile
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItem>
            </Menu>
          </Toolbar>
        </Container>
      </AppBar>
      
      <Hidden mdUp>
        <Drawer
          variant="temporary"
          anchor="left"
          open={drawerOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
        >
          {drawer}
        </Drawer>
      </Hidden>
    </>
  );
};

export default NavBar;