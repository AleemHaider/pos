import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Box,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  Person,
  AdminPanelSettings,
  Store,
  SupervisorAccount,
  Email,
  Phone,
  Badge,
  Security,
  People,
  PersonAdd,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { usersAPI } from '../services/api';
import toast from 'react-hot-toast';

const UserManagement = ({ currentUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier',
    isActive: true,
    phone: '',
    department: '',
    employeeId: '',
    permissions: {
      canManageProducts: false,
      canManageUsers: false,
      canViewReports: false,
      canProcessRefunds: false,
      canManageInventory: false,
    },
  });

  const roles = [
    { value: 'admin', label: 'Administrator', icon: <AdminPanelSettings />, color: 'error' },
    { value: 'manager', label: 'Manager', icon: <SupervisorAccount />, color: 'warning' },
    { value: 'cashier', label: 'Cashier', icon: <Store />, color: 'info' },
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      // Ensure we always have an array
      const usersData = response.data?.users || response.data || [];
      console.log('Users loaded:', usersData);
      setUsers(Array.isArray(usersData) ? usersData : []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Error loading users');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setSelectedUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't pre-fill password for security
        role: user.role || 'cashier',
        isActive: user.isActive !== false,
        phone: user.phone || '',
        department: user.department || '',
        employeeId: user.employeeId || '',
        permissions: {
          canManageProducts: user.permissions?.canManageProducts || false,
          canManageUsers: user.permissions?.canManageUsers || false,
          canViewReports: user.permissions?.canViewReports || false,
          canProcessRefunds: user.permissions?.canProcessRefunds || false,
          canManageInventory: user.permissions?.canManageInventory || false,
        },
      });
    } else {
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'cashier',
        isActive: true,
        phone: '',
        department: '',
        employeeId: '',
        permissions: {
          canManageProducts: false,
          canManageUsers: false,
          canViewReports: false,
          canProcessRefunds: false,
          canManageInventory: false,
        },
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('permissions.')) {
      const permissionName = name.split('.')[1];
      setFormData({
        ...formData,
        permissions: {
          ...formData.permissions,
          [permissionName]: checked,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }

    if (!selectedUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    setLoading(true);
    try {
      const userData = { ...formData };
      
      // Don't send empty password for updates
      if (selectedUser && !userData.password) {
        delete userData.password;
      }

      if (selectedUser) {
        await usersAPI.update(selectedUser._id, userData);
        toast.success('User updated successfully');
      } else {
        // Generate employee ID if not provided
        if (!userData.employeeId) {
          userData.employeeId = `EMP-${Date.now()}`;
        }
        await usersAPI.create(userData);
        toast.success('User created successfully');
      }
      loadUsers();
      handleCloseDialog();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    
    // Prevent self-deletion
    if (selectedUser._id === currentUser._id) {
      toast.error('You cannot delete your own account');
      return;
    }

    setLoading(true);
    try {
      await usersAPI.delete(selectedUser._id);
      toast.success('User deleted successfully');
      loadUsers();
      setDeleteDialog(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error('Error deleting user');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (user) => {
    if (user._id === currentUser._id) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    try {
      await usersAPI.update(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
      loadUsers();
    } catch (error) {
      toast.error('Error updating user status');
    }
  };

  const getRoleInfo = (role) => {
    return roles.find(r => r.value === role) || roles[2]; // Default to cashier
  };

  // Ensure users is always an array before filtering
  const safeUsers = Array.isArray(users) ? users : [];
  const filteredUsers = safeUsers.filter(user => {
    if (!user || !user.name || !user.email) return false;
    
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.employeeId && user.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    const matchesStatus = statusFilter === '' || 
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const totalUsers = safeUsers.length;
  const activeUsers = safeUsers.filter(u => u && u.isActive).length;
  const adminUsers = safeUsers.filter(u => u && u.role === 'admin').length;
  const managerUsers = safeUsers.filter(u => u && u.role === 'manager').length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system users, roles, and permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          size="large"
          disabled={currentUser.role !== 'admin'}
        >
          Add User
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  <People />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {totalUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'success.main', mr: 2 }}>
                  <CheckCircle />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {activeUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'error.main', mr: 2 }}>
                  <AdminPanelSettings />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {adminUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administrators
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'warning.main', mr: 2 }}>
                  <SupervisorAccount />
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    {managerUsers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Managers
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Role-based Access Warning */}
      {currentUser.role !== 'admin' && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You have read-only access to user management. Only administrators can create, edit, or delete users.
        </Alert>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search users by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  label="Role"
                >
                  <MenuItem value="">All Roles</MenuItem>
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      {role.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearchTerm('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Employee ID</TableCell>
                <TableCell>Department</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => {
                const roleInfo = getRoleInfo(user.role);
                const isCurrentUser = user._id === currentUser._id;
                
                return (
                  <TableRow key={user._id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar sx={{ mr: 2, bgcolor: roleInfo.color + '.light' }}>
                          {roleInfo.icon}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {user.name}
                            {isCurrentUser && (
                              <Chip
                                label="You"
                                size="small"
                                color="primary"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Joined {new Date(user.createdAt).toLocaleDateString()}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                          <Typography variant="body2">{user.email}</Typography>
                        </Box>
                        {user.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Phone sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2">{user.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={roleInfo.label}
                        color={roleInfo.color}
                        size="small"
                        icon={roleInfo.icon}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Badge sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                        <Typography variant="body2" fontFamily="monospace">
                          {user.employeeId || 'N/A'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2">
                        {user.department || 'Not assigned'}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={user.isActive ? 'Active' : 'Inactive'}
                          color={user.isActive ? 'success' : 'default'}
                          size="small"
                          icon={user.isActive ? <CheckCircle /> : <Block />}
                        />
                        {currentUser.role === 'admin' && !isCurrentUser && (
                          <Switch
                            checked={user.isActive}
                            onChange={() => toggleUserStatus(user)}
                            size="small"
                            color="success"
                          />
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell align="right">
                      <IconButton
                        onClick={(e) => {
                          setMenuAnchor(e.currentTarget);
                          setSelectedUser(user);
                        }}
                        disabled={currentUser.role !== 'admin' && !isCurrentUser}
                      >
                        <MoreVert />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            handleOpenDialog(selectedUser);
            setMenuAnchor(null);
          }}
          disabled={currentUser.role !== 'admin' && selectedUser?._id !== currentUser._id}
        >
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            setDeleteDialog(true);
            setMenuAnchor(null);
          }}
          sx={{ color: 'error.main' }}
          disabled={currentUser.role !== 'admin' || selectedUser?._id === currentUser._id}
        >
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* User Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Basic Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Basic Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Full Name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            {!selectedUser && (
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  helperText="Minimum 6 characters"
                />
              </Grid>
            )}
            
            <Grid item xs={12} md={selectedUser ? 6 : 6}>
              <TextField
                fullWidth
                label="Phone Number"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>

            {/* Work Information */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Work Information
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth required>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Role"
                  disabled={currentUser.role !== 'admin'}
                >
                  {roles.map((role) => (
                    <MenuItem key={role.value} value={role.value}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {role.icon}
                        <Typography sx={{ ml: 1 }}>{role.label}</Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Employee ID"
                name="employeeId"
                value={formData.employeeId}
                onChange={handleInputChange}
                helperText="Leave empty to auto-generate"
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Department"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder="e.g., Sales, Operations"
              />
            </Grid>

            {/* Permissions */}
            {formData.role !== 'admin' && (
              <>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                    Permissions
                  </Typography>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.permissions.canManageProducts}
                        onChange={handleInputChange}
                        name="permissions.canManageProducts"
                        disabled={currentUser.role !== 'admin'}
                      />
                    }
                    label="Manage Products & Inventory"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.permissions.canViewReports}
                        onChange={handleInputChange}
                        name="permissions.canViewReports"
                        disabled={currentUser.role !== 'admin'}
                      />
                    }
                    label="View Reports & Analytics"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.permissions.canProcessRefunds}
                        onChange={handleInputChange}
                        name="permissions.canProcessRefunds"
                        disabled={currentUser.role !== 'admin'}
                      />
                    }
                    label="Process Refunds & Returns"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.permissions.canManageUsers}
                        onChange={handleInputChange}
                        name="permissions.canManageUsers"
                        disabled={currentUser.role !== 'admin'}
                      />
                    }
                    label="Manage Users (Limited)"
                  />
                </Grid>
              </>
            )}

            {/* Account Status */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2, mb: 1 }}>
                Account Status
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleInputChange}
                    name="isActive"
                    disabled={currentUser.role !== 'admin'}
                  />
                }
                label="Account Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || (currentUser.role !== 'admin' && !selectedUser)}
          >
            {loading ? 'Saving...' : (selectedUser ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)}>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedUser?.name}"? This action cannot be undone.
          </Typography>
          {selectedUser?._id === currentUser._id && (
            <Alert severity="error" sx={{ mt: 2 }}>
              You cannot delete your own account.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={loading || selectedUser?._id === currentUser._id}
          >
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;