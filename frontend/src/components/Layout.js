import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Divider,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Inventory as InventoryIcon,
  ShoppingCart as SalesIcon,
  People as CustomersIcon,
  Analytics as ReportsIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Notifications,
  Menu as MenuIcon,
  Store,
  Person,
  ExitToApp,
} from '@mui/icons-material';

const drawerWidth = 280;

const Layout = ({ children, user, onLogout, currentPage, onPageChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, page: 'dashboard' },
    { text: 'POS Terminal', icon: <Store />, page: 'pos' },
    { text: 'Products', icon: <InventoryIcon />, page: 'products' },
    { text: 'Sales', icon: <SalesIcon />, page: 'sales' },
    { text: 'Customers', icon: <CustomersIcon />, page: 'customers' },
    { text: 'Reports', icon: <ReportsIcon />, page: 'reports' },
    { text: 'Users', icon: <Person />, page: 'users', roles: ['admin'] },
    { text: 'Debug', icon: <SettingsIcon />, page: 'debug', roles: ['admin'] },
    { text: 'Settings', icon: <SettingsIcon />, page: 'settings' },
  ];

  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user.role)
  );

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ 
        p: 3, 
        textAlign: 'center', 
        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)', 
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        },
      }}>
        <Store sx={{ fontSize: 48, mb: 1, position: 'relative', zIndex: 1 }} />
        <Typography variant="h5" fontWeight="bold" sx={{ position: 'relative', zIndex: 1 }}>
          ModernPOS
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, position: 'relative', zIndex: 1 }}>
          Business Management Suite
        </Typography>
      </Box>
      
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {filteredMenuItems.map((item) => (
          <ListItem
            key={item.text}
            button
            onClick={() => onPageChange(item.page)}
            sx={{
              mb: 1,
              borderRadius: 3,
              transition: 'all 0.2s ease-in-out',
              position: 'relative',
              overflow: 'hidden',
              bgcolor: currentPage === item.page ? 'primary.main' : 'transparent',
              color: currentPage === item.page ? 'white' : 'text.primary',
              '&:hover': { 
                bgcolor: currentPage === item.page ? 'primary.dark' : 'grey.100',
                transform: 'translateX(4px)',
                boxShadow: currentPage === item.page 
                  ? '0 4px 12px rgba(99, 102, 241, 0.4)'
                  : '0 2px 8px rgba(0, 0, 0, 0.1)',
              },
              '&::before': currentPage === item.page ? {
                content: '""',
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: 4,
                bgcolor: 'secondary.main',
                borderRadius: '0 2px 2px 0',
              } : {},
            }}
          >
            <ListItemIcon
              sx={{
                color: currentPage === item.page ? 'white' : 'text.secondary',
                minWidth: 44,
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              sx={{
                '& .MuiListItemText-primary': {
                  fontWeight: currentPage === item.page ? 600 : 500,
                  fontSize: '0.875rem',
                },
              }}
            />
          </ListItem>
        ))}
      </List>
      
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'grey.200' }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
          v2.1.0 • © 2024 ModernPOS
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          color: 'text.primary',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { sm: 'none' },
              bgcolor: 'grey.100',
              '&:hover': { bgcolor: 'grey.200' },
            }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" fontWeight="bold" sx={{ mb: 0.5 }}>
              {menuItems.find(item => item.page === currentPage)?.text || 'Dashboard'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Welcome back, {user.name}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton 
              sx={{ 
                bgcolor: 'grey.100',
                '&:hover': { bgcolor: 'grey.200' },
                position: 'relative',
              }}
            >
              <Badge 
                badgeContent={3} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.75rem',
                    minWidth: 20,
                    height: 20,
                  }
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>
            
            <IconButton 
              onClick={handleProfileMenuOpen}
              sx={{ 
                p: 0.5,
                ml: 1,
                border: '2px solid',
                borderColor: 'primary.main',
                '&:hover': { 
                  borderColor: 'primary.dark',
                  transform: 'scale(1.05)',
                },
                transition: 'all 0.2s ease-in-out',
              }}
            >
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: 'primary.main',
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                }}
              >
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 240,
            borderRadius: 3,
            boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
            border: '1px solid',
            borderColor: 'grey.200',
          }
        }}
      >
        <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: '12px 12px 0 0' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 48, 
                height: 48, 
                mr: 2,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                fontWeight: 'bold',
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="subtitle1" fontWeight="bold">
                {user.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Chip
            label={user.role.toUpperCase()}
            size="small"
            color="primary"
            sx={{ fontWeight: 'bold', fontSize: '0.7rem' }}
          />
        </Box>
        
        <Box sx={{ p: 1 }}>
          <MenuItem 
            onClick={handleProfileMenuClose}
            sx={{ 
              borderRadius: 2, 
              mb: 0.5,
              '&:hover': { bgcolor: 'primary.50' },
            }}
          >
            <ListItemIcon>
              <AccountCircle fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </MenuItem>
          <MenuItem 
            onClick={handleProfileMenuClose}
            sx={{ 
              borderRadius: 2, 
              mb: 0.5,
              '&:hover': { bgcolor: 'primary.50' },
            }}
          >
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </MenuItem>
          <Divider sx={{ my: 1 }} />
          <MenuItem 
            onClick={onLogout}
            sx={{ 
              borderRadius: 2,
              color: 'error.main',
              '&:hover': { bgcolor: 'error.50' },
            }}
          >
            <ListItemIcon>
              <ExitToApp fontSize="small" sx={{ color: 'error.main' }} />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </MenuItem>
        </Box>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          bgcolor: 'background.default',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: { sm: `${drawerWidth}px`, xs: 0 },
            right: 0,
            height: '40vh',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
            zIndex: -1,
          },
        }}
      >
        <Toolbar sx={{ minHeight: '70px !important' }} />
        <Box sx={{ p: 3, position: 'relative', zIndex: 1 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;