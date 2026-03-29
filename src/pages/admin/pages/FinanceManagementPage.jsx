import React, { useState, useEffect } from 'react';
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
  CircularProgress,
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
} from 'firebase/firestore';
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
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState([]);
  const [balance, setBalance] = useState({ totalOfferings: 0, totalExpenses: 0, balance: 0 });
  
  const places = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];
  
  const [offeringForm, setOfferingForm] = useState({
    amount: '',
    reason: ''
  });
  
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    reason: ''
  });

  useEffect(() => {
    fetchBalanceAndRecords();
  }, [selectedPlace]);

  const fetchBalanceAndRecords = async () => {
    try {
      setLoading(true);
      
      // Fetch offerings
      const offeringsQuery = query(
        collection(db, 'financial_records'),
        where('place', '==', selectedPlace),
        where('type', '==', 'OFFERING')
      );
      const offeringsSnapshot = await getDocs(offeringsQuery);
      const totalOfferings = offeringsSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);
      
      // Fetch expenses
      const expensesQuery = query(
        collection(db, 'financial_records'),
        where('place', '==', selectedPlace),
        where('type', '==', 'EXPENSE')
      );
      const expensesSnapshot = await getDocs(expensesQuery);
      const totalExpenses = expensesSnapshot.docs.reduce((sum, doc) => {
        return sum + (doc.data().amount || 0);
      }, 0);
      
      // Fetch all records for history
      // Try with orderBy first, fallback to without if index is missing
      let recordsData = [];
      try {
        const allRecordsQuery = query(
          collection(db, 'financial_records'),
          where('place', '==', selectedPlace),
          orderBy('timestamp', 'desc')
        );
        const allRecordsSnapshot = await getDocs(allRecordsQuery);
        recordsData = allRecordsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (indexError) {
        // Fallback: fetch without orderBy and sort in memory
        if (indexError.message?.includes('index')) {
          console.warn('Composite index missing, using fallback query');
          const fallbackQuery = query(
            collection(db, 'financial_records'),
            where('place', '==', selectedPlace)
          );
          const fallbackSnapshot = await getDocs(fallbackQuery);
          recordsData = fallbackSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })).sort((a, b) => {
            const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
            const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
            return bTime - aTime;
          });
        } else {
          throw indexError;
        }
      }
      
      setBalance({
        totalOfferings,
        totalExpenses,
        balance: totalOfferings - totalExpenses
      });
      setRecords(recordsData);
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOffering = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!offeringForm.amount || !offeringForm.reason) {
      notifyError('Missing fields', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      
      // For admins, use email as name (since admin emails are hardcoded)
      const creatorName = currentUser?.email || currentUser?.name || 'Admin';
      
      await addDoc(collection(db, 'financial_records'), {
        type: 'OFFERING',
        place: selectedPlace,
        amount: String(offeringForm.amount),
        reason: offeringForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      
      setOfferingForm({ amount: '', reason: '' });
      fetchBalanceAndRecords();
      notifySuccess('Offering submitted', 'Offering recorded successfully.');
    } catch (error) {
      console.error('Error saving offering:', error);
      notifyError('Offering failed', error.message || 'Failed to save offering.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!expenseForm.amount || !expenseForm.reason) {
      notifyError('Missing fields', 'Please fill in all fields.');
      return;
    }

    const expenseAmount = parseFloat(expenseForm.amount);
    if (expenseAmount > balance.balance) {
      notifyError('Insufficient funds', `Available: ₹${balance.balance.toFixed(2)}`);
      return;
    }

    try {
      setLoading(true);
      
      // For admins, use email as name (since admin emails are hardcoded)
      const creatorName = currentUser?.email || currentUser?.name || 'Admin';
      
      await addDoc(collection(db, 'financial_records'), {
        type: 'EXPENSE',
        place: selectedPlace,
        amount: String(expenseForm.amount),
        reason: expenseForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      
      setExpenseForm({ amount: '', reason: '' });
      fetchBalanceAndRecords();
      notifySuccess('Expense submitted', 'Expense recorded successfully.');
    } catch (error) {
      console.error('Error saving expense:', error);
      notifyError('Expense failed', error.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this record?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteDoc(doc(db, 'financial_records', recordId));
      fetchBalanceAndRecords();
      notifySuccess('Deleted', 'Record deleted successfully.');
    } catch (error) {
      console.error('Error deleting record:', error);
      notifyError('Delete failed', error.message || 'Failed to delete record.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncLegacyRecords = async () => {
    if (!window.confirm('Sync legacy records? This will assign "Admin (Legacy)" to all older records that have "Unknown" authors.')) {
      return;
    }
    
    try {
      setLoading(true);
      const snapshot = await getDocs(collection(db, 'financial_records'));
      let updateCount = 0;
      
      const promises = [];
      snapshot.forEach((document) => {
        const data = document.data();
        const hasCreator = data.createdBy || data.createdByName || data.recordedBy || data.uploadedBy || data.userName || data.name || data.createdByUid;
        
        if (!hasCreator) {
          promises.push(updateDoc(doc(db, 'financial_records', document.id), {
            createdBy: 'Admin (Legacy)'
          }));
          updateCount++;
        }
      });
      
      if (promises.length > 0) {
        await Promise.all(promises);
        notifySuccess('Sync Complete', `Successfully updated ${updateCount} legacy records.`);
        fetchBalanceAndRecords();
      } else {
        notifySuccess('Up to date', 'No legacy records found to sync.');
      }
    } catch (error) {
      console.error('Error syncing records:', error);
      notifyError('Sync Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#f5f7fa', pb: 4 }}>
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

        <Card sx={{ 
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
              ₹{balance.balance.toFixed(2)}
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', pt: 2 }}>
               <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Offerings</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>₹{balance.totalOfferings.toFixed(2)}</Typography>
               </Box>
               <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>Total Expenses</Typography>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>₹{balance.totalExpenses.toFixed(2)}</Typography>
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
        {loading && selectedTab !== 2 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
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
              Available Balance: <strong>₹{balance.balance.toFixed(2)}</strong>
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
              <Button 
                variant="outlined" 
                color="secondary" 
                size="small" 
                onClick={handleSyncLegacyRecords}
                startIcon={<HistoryIcon />}
              >
                Sync Legacy Records
              </Button>
            </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {records.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No records found
              </Typography>
            ) : (
              records.map((record) => (
                <Card key={record.id} elevation={1} sx={{ borderRadius: 2, border: '1px solid #eee' }}>
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
                        label={record.type}
                        color={record.type === 'OFFERING' ? 'success' : 'error'}
                        size="small"
                        sx={{ height: 20, fontSize: '0.7rem', fontWeight: 'bold' }}
                      />
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                       <Typography variant="h6" fontWeight="900" sx={{ color: record.type === 'OFFERING' ? '#2e7d32' : '#d32f2f' }}>
                         ₹{parseFloat(record.amount || 0).toFixed(2)}
                       </Typography>
                       <IconButton size="small" color="error" onClick={() => handleDeleteRecord(record.id)} sx={{ bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, width: 28, height: 28 }}>
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

