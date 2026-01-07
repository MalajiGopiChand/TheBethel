import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Paper, Typography, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, FormControl,
  InputLabel, Select, MenuItem, CircularProgress, Alert, Chip,
  Grid, IconButton, Menu, MenuItem as ContextMenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, List, ListItem, 
  ListItemText, ListItemSecondaryAction, Fade, Grow, Zoom,
  InputAdornment, Avatar, useTheme, Card, CardContent
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AttachMoney as DollarIcon,
  Search as SearchIcon,
  MoreVert as MoreIcon,
  FileDownload as ExportIcon,
  Edit as EditIcon,
  Build as FixIcon,
  TrendingUp as TrendingUpIcon,
  History as HistoryIcon,
  AccountBalanceWallet as WalletIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { db, auth } from '../../../config/firebase'; // Ensure path is correct

const adminEmails = ["gop1@gmail.com", "premkumartenali@gmail.com", "admin@gmail.com"];

const DollarHistoryPage = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Data States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedPlace, setSelectedPlace] = useState('All');
  
  // Menu/Dialog States
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedReward, setSelectedReward] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editAmount, setEditAmount] = useState('');

  // Balance Manager States
  const [balanceDialogOpen, setBalanceDialogOpen] = useState(false);
  const [balanceSearch, setBalanceSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState(null);
  const [newTotalBalance, setNewTotalBalance] = useState('');

  const userEmail = auth.currentUser?.email || "";
  const isAdmin = adminEmails.includes(userEmail);

  // 1. Fetch Students
  useEffect(() => {
    setLoading(true);
    const q = query(collection(db, 'students'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loaded = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "Unknown",
          classType: data.classType || "Beginner",
          location: data.place || data.location || "Kandrika", 
          rewards: Array.isArray(data.rewards) ? data.rewards : [],
          dollarPoints: data.dollarPoints || 0
        };
      });
      setStudents(loaded.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
      console.error("Firebase Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Flatten Rewards for Table
  const allRewardsList = useMemo(() => {
    const list = [];
    students.forEach(student => {
      if (student.rewards.length > 0) {
        student.rewards.forEach((reward, index) => {
          list.push({
            uniqueId: `${student.id}_${index}`,
            studentDocId: student.id,
            rewardIndex: index,
            studentName: student.name,
            classType: student.classType,
            location: student.location,
            date: reward.date || "No Date",
            dollars: Number(reward.dollars) || 0,
            reason: reward.reason || "No Reason",
            teacher: reward.teacher || "Unknown"
          });
        });
      }
    });
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }, [students]);

  // 3. Filter Logic
  const filteredData = allRewardsList.filter(item => {
    const search = searchQuery.toLowerCase();
    const matchesSearch = item.studentName.toLowerCase().includes(search) ||
                          item.reason.toLowerCase().includes(search);
    const matchesClass = selectedClass === "All" || item.classType === selectedClass;
    const matchesPlace = selectedPlace === "All" ? true :
                         selectedPlace === "Other" ? !["Kandrika", "Krishna Lanka", "Gandhiji Conly"].includes(item.location) :
                         item.location === selectedPlace;
    return matchesSearch && matchesClass && matchesPlace;
  });

  const totalFilteredDollars = filteredData.reduce((sum, r) => sum + r.dollars, 0);

  // --- Actions ---

  const handleHistoryUpdate = async () => {
    if (!selectedReward || !editAmount) return;
    try {
      const studentRef = doc(db, 'students', selectedReward.studentDocId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const data = snap.data();
        const rewards = [...(data.rewards || [])];
        if (rewards[selectedReward.rewardIndex]) {
          rewards[selectedReward.rewardIndex].dollars = Number(editAmount);
          const newTotal = rewards.reduce((sum, r) => sum + (Number(r.dollars) || 0), 0);
          await updateDoc(studentRef, { rewards, dollarPoints: newTotal });
          setEditDialogOpen(false);
          setAnchorEl(null);
        }
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleHistoryDelete = async () => {
    if (!window.confirm("Delete this entry?")) return;
    try {
      const studentRef = doc(db, 'students', selectedReward.studentDocId);
      const snap = await getDoc(studentRef);
      if (snap.exists()) {
        const data = snap.data();
        const rewards = [...(data.rewards || [])];
        rewards.splice(selectedReward.rewardIndex, 1);
        const newTotal = rewards.reduce((sum, r) => sum + (Number(r.dollars) || 0), 0);
        await updateDoc(studentRef, { rewards, dollarPoints: newTotal });
        setAnchorEl(null);
      }
    } catch (e) { alert("Error: " + e.message); }
  };

  const handleForceBalanceUpdate = async () => {
    if (!editingStudent) return;
    const amount = parseInt(newTotalBalance);
    if (isNaN(amount)) return alert("Please enter a valid number");

    try {
      await updateDoc(doc(db, 'students', editingStudent.id), {
        dollarPoints: amount
      });
      setEditingStudent(null);
      setNewTotalBalance('');
    } catch (e) {
      alert("Error updating balance: " + e.message);
    }
  };

  const exportCSV = () => {
    const headers = ["Date", "Name", "Class", "Place", "Dollars", "Reason", "Teacher"];
    const rows = filteredData.map(r => [r.date, r.studentName, r.classType, r.location, r.dollars, `"${r.reason}"`, r.teacher]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = "history.csv";
    link.click();
  };

  // Helper Component for Stat Cards
  const StatCard = ({ title, value, icon, color, delay }) => (
    <Grow in={true} timeout={delay}>
      <Card sx={{ height: '100%', borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.05)' }}>
        <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, mr: 2 }}>
            {icon}
          </Avatar>
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', fontSize: '0.75rem' }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight="800" sx={{ color: 'text.primary' }}>
              {value}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Grow>
  );

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f4f6f8', pb: 4 }}>
      
      {/* 1. Header */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 2, 
          mb: 3, 
          bgcolor: 'white', 
          borderBottom: '1px solid rgba(0,0,0,0.1)',
          position: 'sticky',
          top: 0,
          zIndex: 100
        }}
      >
        <Box sx={{ maxWidth: 1200, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton onClick={() => navigate(-1)} sx={{ mr: 2, bgcolor: 'grey.100' }}><BackIcon /></IconButton>
            <Typography variant="h5" fontWeight="900" sx={{ background: 'linear-gradient(45deg, #2E7D32, #4CAF50)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Transaction History
            </Typography>
          </Box>
          
          {isAdmin && (
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<FixIcon />}
              onClick={() => setBalanceDialogOpen(true)}
              sx={{ borderRadius: 2, fontWeight: 'bold', textTransform: 'none', boxShadow: '0 4px 12px rgba(156, 39, 176, 0.3)' }}
            >
              Fix Balances
            </Button>
          )}
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1200, mx: 'auto', px: 2 }}>
        
        {/* 2. Stats Row */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Total Distributed" 
              value={`$${totalFilteredDollars}`} 
              icon={<TrendingUpIcon />} 
              color={theme.palette.success.main} 
              delay={300}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Transactions" 
              value={filteredData.length} 
              icon={<HistoryIcon />} 
              color={theme.palette.primary.main} 
              delay={500}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard 
              title="Active Students" 
              value={students.length} 
              icon={<WalletIcon />} 
              color={theme.palette.warning.main} 
              delay={700}
            />
          </Grid>
        </Grid>

        {/* 3. Filters & Search */}
        <Paper sx={{ p: 2, mb: 3, borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }} elevation={0}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField 
                fullWidth 
                placeholder="Search by Student Name or Reason..." 
                size="small" 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)} 
                InputProps={{ 
                  startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
                  sx: { borderRadius: 2, bgcolor: '#f9f9f9' }
                }} 
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Class</InputLabel>
                <Select value={selectedClass} label="Class" onChange={(e) => setSelectedClass(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="All">All Classes</MenuItem>
                  <MenuItem value="Beginner">Beginner</MenuItem>
                  <MenuItem value="Primary">Primary</MenuItem>
                  <MenuItem value="Secondary">Secondary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Location</InputLabel>
                <Select value={selectedPlace} label="Location" onChange={(e) => setSelectedPlace(e.target.value)} sx={{ borderRadius: 2 }}>
                  <MenuItem value="All">All Locations</MenuItem>
                  <MenuItem value="Kandrika">Kandrika</MenuItem>
                  <MenuItem value="Krishna Lanka">Krishna Lanka</MenuItem>
                  <MenuItem value="Gandhiji Conly">Gandhiji Conly</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {isAdmin && (
              <Grid item xs={12} md={3}>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  startIcon={<ExportIcon />} 
                  onClick={exportCSV}
                  sx={{ borderRadius: 2, textTransform: 'none', height: 40 }}
                >
                  Export Data
                </Button>
              </Grid>
            )}
          </Grid>
        </Paper>

        {/* 4. Data Table */}
        <Fade in={!loading}>
          <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)', overflow: 'hidden' }}>
            {loading ? (
               <Box p={8} display="flex" justifyContent="center"><CircularProgress /></Box>
            ) : filteredData.length === 0 ? (
               <Box p={6} textAlign="center">
                 <Typography variant="h6" color="text.secondary">No records found matching your filters.</Typography>
               </Box>
            ) : (
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Student</TableCell>
                    <TableCell sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Reason</TableCell>
                    <TableCell sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Teacher</TableCell>
                    {isAdmin && <TableCell align="right" sx={{ bgcolor: '#fcfcfc', fontWeight: 'bold' }}>Actions</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredData.map((row) => (
                    <TableRow key={row.uniqueId} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.secondary' }}>{row.date}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">{row.studentName}</Typography>
                          <Box display="flex" gap={1} mt={0.5}>
                            <Chip label={row.classType} size="small" sx={{ height: 20, fontSize: '0.65rem', bgcolor: 'grey.100' }} />
                            <Chip label={row.location} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem' }} />
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          icon={<DollarIcon style={{ color: 'white' }} />} 
                          label={row.dollars} 
                          size="small" 
                          sx={{ bgcolor: '#4CAF50', color: 'white', fontWeight: 'bold', minWidth: 60 }} 
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200 }}>
                        <Typography variant="body2" noWrap title={row.reason}>{row.reason}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={row.teacher} size="small" variant="outlined" avatar={<Avatar sx={{ width: 16, height: 16, fontSize: '0.6rem' }}>{row.teacher[0]}</Avatar>} />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <IconButton size="small" onClick={(e) => { setAnchorEl(e.currentTarget); setSelectedReward(row); }}>
                            <MoreIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </Fade>
      </Box>

      {/* --- DIALOGS --- */}

      {/* Edit Entry Dialog */}
      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)} PaperProps={{ sx: { borderRadius: 2, boxShadow: 4 } }}>
        <ContextMenuItem onClick={() => { setEditAmount(selectedReward.dollars); setEditDialogOpen(true); }}>
          <EditIcon fontSize="small" sx={{ mr: 1.5, color: 'text.secondary' }} /> Edit Amount
        </ContextMenuItem>
        <ContextMenuItem onClick={handleHistoryDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1.5 }} /> Delete Entry
        </ContextMenuItem>
      </Menu>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>Edit Transaction</DialogTitle>
        <DialogContent>
          <TextField 
            fullWidth 
            autoFocus
            type="number" 
            label="Amount ($)" 
            value={editAmount} 
            onChange={(e) => setEditAmount(e.target.value)} 
            sx={{ mt: 1 }} 
            InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleHistoryUpdate} variant="contained" color="primary">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Balance Manager Dialog */}
      <Dialog 
        open={balanceDialogOpen} 
        onClose={() => setBalanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
          <Box display="flex" alignItems="center" gap={1}>
            <FixIcon color="secondary" /> Manage Balances
          </Box>
          <IconButton onClick={() => setBalanceDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, bgcolor: '#f9f9f9' }}>
            <Alert severity="info" icon={<FixIcon />} sx={{ mb: 3, borderRadius: 2 }}>
                Use this tool to manually override a student's total balance if it doesn't match their history.
            </Alert>
            
            <Paper elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0', borderRadius: 2 }}>
                <TextField 
                    fullWidth 
                    placeholder="Search student to fix..." 
                    size="small"
                    value={balanceSearch}
                    onChange={(e) => setBalanceSearch(e.target.value)}
                    InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
                />
            </Paper>

            <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'white', borderRadius: 2, border: '1px solid #e0e0e0' }}>
                {students
                    .filter(s => s.name.toLowerCase().includes(balanceSearch.toLowerCase()))
                    .slice(0, 10) // Limit results for performance
                    .map(student => (
                    <ListItem key={student.id} divider>
                        <ListItemText 
                            primary={student.name} 
                            primaryTypographyProps={{ fontWeight: 'bold' }}
                            secondary={`${student.classType} • Current: $${student.dollarPoints}`} 
                        />
                        <ListItemSecondaryAction>
                            <Button 
                                variant="outlined" 
                                size="small" 
                                startIcon={<EditIcon />} 
                                onClick={() => { setEditingStudent(student); setNewTotalBalance(student.dollarPoints); }}
                            >
                                Edit
                            </Button>
                        </ListItemSecondaryAction>
                    </ListItem>
                ))}
                {students.filter(s => s.name.toLowerCase().includes(balanceSearch.toLowerCase())).length === 0 && (
                    <ListItem><ListItemText secondary="No students found" sx={{ textAlign: 'center' }} /></ListItem>
                )}
            </List>

            {/* Editing Panel (Slides in) */}
            <Grow in={Boolean(editingStudent)}>
                {editingStudent ? (
                    <Paper sx={{ mt: 2, p: 2, bgcolor: 'white', border: '1px solid #2196f3', borderRadius: 2 }}>
                        <Typography variant="subtitle2" gutterBottom color="primary">
                            Set New Balance for: <b>{editingStudent.name}</b>
                        </Typography>
                        <Grid container spacing={1} alignItems="center">
                            <Grid item xs={8}>
                                <TextField 
                                    fullWidth 
                                    size="small" 
                                    type="number" 
                                    label="Total Balance ($)" 
                                    value={newTotalBalance} 
                                    onChange={(e) => setNewTotalBalance(e.target.value)} 
                                />
                            </Grid>
                            <Grid item xs={4}>
                                <Button variant="contained" fullWidth onClick={handleForceBalanceUpdate} startIcon={<SaveIcon />}>
                                    Save
                                </Button>
                            </Grid>
                        </Grid>
                    </Paper>
                ) : <Box />}
            </Grow>
        </DialogContent>
      </Dialog>

    </Box>
  );
};

export default DollarHistoryPage;