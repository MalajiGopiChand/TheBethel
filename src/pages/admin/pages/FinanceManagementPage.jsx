import useFinanceRecords from '../../../hooks/useFinanceRecords';
import SchoolLoader from '../../../components/SchoolLoader';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  AppBar,
  Toolbar,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tab,
  Tabs,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  Chip,
  IconButton
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ExpenseIcon,
  History as HistoryIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "../../../services/notifyingFirestore";
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { notifyError, notifySuccess } from '../../../services/notificationService';

const FinanceManagementPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const handleBack = () => {
    handleBackNavigation(navigate, currentUser);
  };
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPlace, setSelectedPlace] = useState('Kandrika');
  const [submitting, setLoading] = useState(false);
  const finance = useFinanceRecords(selectedPlace);
  const { records, balance } = finance;
  const loading = submitting || finance.loading;
  
  const places = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];
  
  const [offeringForm, setOfferingForm] = useState({
    amount: '',
    reason: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    reason: ''
  });

  const handleSubmitOffering = async (e) => {
    e.preventDefault();
    if (loading || finance.error || !currentUser?.uid) return;
    const amountValue = Number(offeringForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      notifyError('Invalid amount', 'Please enter a valid number.');
      return;
    }

    try {
      setLoading(true);
      
      // For admins, use email as name (since admin emails are hardcoded)
      const creatorName = currentUser?.email || currentUser?.name || 'Admin';
      
      const payload = {
        type: 'offering',
        place: selectedPlace,
        amount: amountValue,
        reason: offeringForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        recordedBy: currentUser?.uid || 'admin-manual',
        date: format(new Date(), 'yyyy-MM-dd'),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      };


      const docRef = await addDoc(collection(db, 'offerings'), payload);
      
      setOfferingForm({ amount: '', reason: '' });
      notifySuccess('Offering submitted', 'Offering recorded successfully.');
    } catch (error) {
      console.error('CRITICAL: Admin offering write failed:', error);
      window.alert('CRITICAL ERROR: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (loading || finance.error || !currentUser?.uid) return;
    const amountValue = Number(expenseForm.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      notifyError('Invalid amount', 'Please enter a valid number.');
      return;
    }

    if (amountValue > balance.balance) {
      notifyError('Insufficient funds', `Available: ₹${balance.balance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      
      // For admins, use email as name (since admin emails are hardcoded)
      const creatorName = currentUser?.email || currentUser?.name || 'Admin';
      
      const payload = {
        type: 'expense',
        place: selectedPlace,
        amount: amountValue,
        reason: expenseForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        recordedBy: currentUser?.uid || 'admin-manual',
        date: format(new Date(), 'yyyy-MM-dd'),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'expenses'), payload);
      
      setExpenseForm({ amount: '', reason: '' });
      notifySuccess('Expense submitted', 'Expense recorded successfully.');
    } catch (error) {
      console.error('CRITICAL ERROR:', error);
      window.alert('CRITICAL ERROR: ' + (error.message || 'Unknown error'));
      notifyError('Expense failed', error.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (record) => {
    if (loading || record.sourceCollection === 'financial_records') return;
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      setLoading(true);
      const collectionName = record.sourceCollection;
      await deleteDoc(doc(db, collectionName, record.id));
      notifySuccess('Deleted', 'Record deleted successfully.');
    } catch (error) {
      console.error('Error deleting record:', error);
      notifyError('Delete failed', error.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="admin-page" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa', pb: 4 }}>
      {finance.error && <Alert severity="error" action={<Button color="inherit" onClick={finance.retry}>Retry</Button>}>{finance.error}</Alert>}
      {/* Glass Header (Sticky) */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.92)',
          backgroundImage: 'none',
          borderBottom: `1px solid rgba(0,0,0,0.08)`,
          backdropFilter: 'blur(22px)',
          zIndex: 1000
        }}
      >
        <Toolbar sx={{ py: 1, px: { xs: 1, sm: 2 } }}>
           <IconButton onClick={handleBack} sx={{ mr: 1, color: '#000', bgcolor: 'rgba(0,0,0,0.04)' }}>
              <BackIcon />
           </IconButton>
           <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', color: '#000', letterSpacing: '-0.03em', fontSize: { xs: '1.2rem', sm: '1.25rem' } }}>
              Finances
           </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1.5, sm: 3 } }}>
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="place-select-label">Location</InputLabel>
          <Select
              disabled={submitting}
            labelId="place-select-label"
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            label="Location"
            sx={{ bgcolor: 'white', borderRadius: 2 }}
          >
            {places.map(place => (
              <MenuItem key={place} value={place}>{place}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Card className="finance-balance-card" sx={{
          background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', 
          color: 'white', 
          mb: 3,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(30, 60, 114, 0.2)'
        }}>
          <CardContent sx={{ position: 'relative', overflow: 'hidden', p: 3 }}>
            <Box sx={{ position: 'absolute', top: -20, right: -20, opacity: 0.1 }}>
              <MoneyIcon sx={{ fontSize: 150 }} />
            </Box>
            
            <Typography variant="subtitle2" sx={{ opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1, mb: 1 }}>
               {selectedPlace} Summary
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: '900', mb: 3, wordBreak: 'break-word' }}>
              {finance.error ? 'Unavailable' : finance.loading ? 'Preparing…' : `₹${balance.balance.toFixed(2)}`}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 2 }}>
               <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Offerings</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{finance.error ? 'Unavailable' : finance.loading ? 'Preparing…' : `₹${balance.totalOfferings.toFixed(2)}`}</Typography>
               </Box>
               <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{finance.error ? 'Unavailable' : finance.loading ? 'Preparing…' : `₹${balance.totalExpenses.toFixed(2)}`}</Typography>
               </Box>
            </Box>
          </CardContent>
        </Card>

        <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>

        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          variant="fullWidth"
          sx={{
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              py: 2,
              '&.Mui-selected': { fontWeight: 700 }
            },
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: '3px 3px 0 0',
              backgroundColor: selectedTab === 0 ? '#2e7d32' : selectedTab === 1 ? '#d32f2f' : '#1976d2',
            },
          }}
        >
          <Tab 
            label="Offerings" 
            sx={{ '&.Mui-selected': { color: '#2e7d32' } }}
          />
          <Tab 
            label="Expenses" 
            sx={{ '&.Mui-selected': { color: '#d32f2f' } }}
          />
          <Tab 
            label="History" 
            sx={{ '&.Mui-selected': { color: '#1976d2' } }}
          />
        </Tabs>

        <Box sx={{ pt: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <SchoolLoader />
          </Box>
        ) : selectedTab === 0 ? (
          <Box>
            <form onSubmit={handleSubmitOffering}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={offeringForm.amount}
                onChange={(e) => setOfferingForm({ ...offeringForm, amount: e.target.value })}
                required
                sx={{ mb: 2, bgcolor: 'white' }}
              />
              <TextField
                fullWidth
                label="Reason"
                value={offeringForm.reason}
                onChange={(e) => setOfferingForm({ ...offeringForm, reason: e.target.value })}
                required
                multiline
                rows={3}
                sx={{ mb: 3, bgcolor: 'white' }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 2, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}>
                {loading ? 'Recording...' : 'Record Offering'}
              </Button>
            </form>
          </Box>
        ) : selectedTab === 1 ? (
          <Box>
            <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
              Available Balance: <strong>{finance.error ? 'Unavailable' : finance.loading ? 'Preparing…' : `₹${balance.balance.toFixed(2)}`}</strong>
            </Alert>
            <form onSubmit={handleSubmitExpense}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
                sx={{ mb: 2, bgcolor: 'white' }}
              />
              <TextField
                fullWidth
                label="Reason"
                value={expenseForm.reason}
                onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                required
                multiline
                rows={3}
                sx={{ mb: 3, bgcolor: 'white' }}
              />
              <Button type="submit" variant="contained" color="error" fullWidth size="large" disabled={loading} sx={{ py: 1.5, borderRadius: 2 }}>
                {loading ? 'Recording...' : 'Record Expense'}
              </Button>
            </form>
          </Box>
        ) : (
          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {records.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No records found
              </Typography>
            ) : (
              records.map((record) => (
                <Card key={`${record.sourceCollection}:${record.id}`} elevation={1} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
                  <CardContent sx={{ p: '16px !important' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="caption" color="text.secondary" fontWeight="medium">
                        {(() => {
                          try {
                            // Handle Firestore timestamp
                            if (record.timestamp) {
                              let date;
                              if (record.timestamp.toDate && typeof record.timestamp.toDate === 'function') {
                                date = record.timestamp.toDate();
                              } else if (record.timestamp.seconds) {
                                date = new Date(record.timestamp.seconds * 1000);
                              } else if (record.timestamp instanceof Date) {
                                date = record.timestamp;
                              } else if (typeof record.timestamp === 'number') {
                                date = new Date(record.timestamp);
                              } else if (record.timestamp._seconds) {
                                date = new Date(record.timestamp._seconds * 1000);
                              }
                              
                              if (date && !isNaN(date.getTime())) {
                                return format(date, 'MMM dd, yyyy • hh:mm a');
                              }
                            }
                            // Fallback to createdAt
                            if (record.createdAt) {
                              let date;
                              if (record.createdAt.toDate && typeof record.createdAt.toDate === 'function') {
                                date = record.createdAt.toDate();
                              } else if (record.createdAt.seconds) {
                                date = new Date(record.createdAt.seconds * 1000);
                              } else if (record.createdAt instanceof Date) {
                                date = record.createdAt;
                              } else if (typeof record.createdAt === 'number') {
                                date = new Date(record.createdAt);
                              }
                              
                              if (date && !isNaN(date.getTime())) {
                                return format(date, 'MMM dd, yyyy • hh:mm a');
                              }
                            }
                            return 'N/A';
                          } catch (error) {
                            return 'N/A';
                          }
                        })()}
                      </Typography>
                      <Chip
                        label={record.type ? record.type.toUpperCase() : ''}
                        color={record.type && record.type.toUpperCase() === 'OFFERING' ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                       <Typography variant="h6" fontWeight="900" sx={{ color: (record.type && record.type.toUpperCase() === 'OFFERING') ? '#2e7d32' : '#d32f2f' }}>
                         ₹{parseFloat(record.amount || 0).toFixed(2)}
                       </Typography>
                       <IconButton size="small" color="error" disabled={record.sourceCollection === 'financial_records'} onClick={() => handleDeleteRecord(record)} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 28, height: 28 }}>
                         <DeleteIcon sx={{ fontSize: 16 }} />
                       </IconButton>
                    </Box>
                    <Typography variant="body2" sx={{ mb: 1.5, color: 'text.primary', bgcolor: 'rgba(0,0,0,0.03)', p: 1, borderRadius: 1 }}>
                      {record.reason || 'No reason provided'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                      Recorded by: {(() => {
                        const creator = record.createdBy || 
                                      record.createdByName || 
                                      record.recordedBy || 
                                      record.uploadedBy ||
                                      record.userName ||
                                      record.name ||
                                      (record.createdByUid ? `User ${record.createdByUid.substring(0, 8)}` : null);
                        return creator || 'Admin (Legacy)';
                      })()}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Box>
          </Box>
        )}
        </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default FinanceManagementPage;

