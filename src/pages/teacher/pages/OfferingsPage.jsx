import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Tab,
  Tabs
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  AttachMoney as MoneyIcon,
  ShoppingCart as ExpenseIcon,
  History as HistoryIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { handleBackNavigation } from '../../../utils/navigation';
import { notifyError, notifySuccess } from '../../../services/notificationService';

const OfferingsPage = () => {
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
  
  const [expenses, setExpenses] = useState([]);

  useEffect(() => {
    setLoading(true);
    
    const recordsQuery = query(
      collection(db, 'financial_records'),
      where('place', '==', selectedPlace)
    );

    const unsubscribe = onSnapshot(recordsQuery, (snapshot) => {
      try {
        const allRecords = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        let totalOfferings = 0;
        let totalExpenses = 0;
        const expensesData = [];

        allRecords.forEach(record => {
          const amt = parseFloat(record.amount) || 0;
          if (record.type === 'OFFERING') {
            totalOfferings += amt;
          } else if (record.type === 'EXPENSE') {
            totalExpenses += amt;
            expensesData.push(record);
          }
        });

        const sortedRecords = allRecords.sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || a.timestamp || a.createdAt?.toDate?.() || 0;
          const bTime = b.timestamp?.toDate?.() || b.timestamp || b.createdAt?.toDate?.() || 0;
          return bTime - aTime;
        });

        setExpenses(expensesData);
        setBalance({
          totalOfferings,
          totalExpenses,
          balance: totalOfferings - totalExpenses
        });
        setRecords(sortedRecords);
        setLoading(false);
      } catch (error) {
        console.error('Error processing finance snapshot:', error);
        setLoading(false);
      }
    }, (error) => {
      console.error('Snapshot listener error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedPlace]);

  const handleSubmitOffering = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!offeringForm.amount || !offeringForm.reason) {
      notifyError('Missing fields', 'Please fill in all fields.');
      return;
    }

    try {
      setLoading(true);
      
      // Fetch name directly from Firestore database
      let creatorName = 'Teacher';
      if (currentUser?.uid) {
        try {
          const teacherDoc = await getDoc(doc(db, 'teachers', currentUser.uid));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            creatorName = teacherData.name || currentUser?.name || currentUser?.email || 'Teacher';
          } else {
            creatorName = currentUser?.name || currentUser?.email || 'Teacher';
          }
        } catch (err) {
          console.error('Error fetching teacher name:', err);
          creatorName = currentUser?.name || currentUser?.email || 'Teacher';
        }
      }
      
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
      
      // Fetch name directly from Firestore database
      let creatorName = 'Teacher';
      if (currentUser?.uid) {
        try {
          const teacherDoc = await getDoc(doc(db, 'teachers', currentUser.uid));
          if (teacherDoc.exists()) {
            const teacherData = teacherDoc.data();
            creatorName = teacherData.name || currentUser?.name || currentUser?.email || 'Teacher';
          } else {
            creatorName = currentUser?.name || currentUser?.email || 'Teacher';
          }
        } catch (err) {
          console.error('Error fetching teacher name:', err);
          creatorName = currentUser?.name || currentUser?.email || 'Teacher';
        }
      }
      
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
      notifySuccess('Expense submitted', 'Expense recorded successfully.');
    } catch (error) {
      console.error('Error saving expense:', error);
      notifyError('Expense failed', error.message || 'Failed to save expense.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Paper elevation={2} sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button startIcon={<BackIcon />} onClick={handleBack}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Offerings
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Place</InputLabel>
          <Select
            value={selectedPlace}
            onChange={(e) => setSelectedPlace(e.target.value)}
            label="Place"
          >
            {places.map(place => (
              <MenuItem key={place} value={place}>{place}</MenuItem>
            ))}
          </Select>
        </FormControl>

        <Card sx={{ bgcolor: 'primary.main', color: 'primary', mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Balance Summary - {selectedPlace}</Typography>
            <Typography variant="body2">Total Offerings: ₹{balance.totalOfferings.toFixed(2)}</Typography>
            <Typography variant="body2">Total Expenses: ₹{balance.totalExpenses.toFixed(2)}</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
              Balance: ₹{balance.balance.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Tabs 
          value={selectedTab} 
          onChange={(e, newValue) => setSelectedTab(newValue)}
          sx={{
            '& .MuiTab-root': {
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              minHeight: 64,
              fontSize: '0.95rem',
              '&.Mui-selected': {
                fontWeight: 700,
              },
            },
            '& .MuiTabs-indicator': {
              height: 4,
              borderRadius: '4px 4px 0 0',
              backgroundColor: selectedTab === 0 ? '#2e7d32' : selectedTab === 1 ? '#d32f2f' : '#1976d2',
            },
          }}
        >
          <Tab 
            label="Offerings" 
            icon={<MoneyIcon />} 
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                color: '#2e7d32',
              },
            }}
          />
          <Tab 
            label="Expenses" 
            icon={<ExpenseIcon />} 
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                color: '#d32f2f',
              },
            }}
          />
          <Tab 
            label="History" 
            icon={<HistoryIcon />} 
            iconPosition="start"
            sx={{
              '&.Mui-selected': {
                color: '#1976d2',
              },
            }}
          />
        </Tabs>
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading && selectedTab !== 2 ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : selectedTab === 0 ? (
          <Paper sx={{ p: 3 }}>
            <form onSubmit={handleSubmitOffering}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={offeringForm.amount}
                onChange={(e) => setOfferingForm({ ...offeringForm, amount: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason"
                value={offeringForm.reason}
                onChange={(e) => setOfferingForm({ ...offeringForm, reason: e.target.value })}
                required
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" fullWidth disabled={loading}>
                {loading ? 'Recording...' : 'Record Offering'}
              </Button>
            </form>
          </Paper>
        ) : selectedTab === 1 ? (
          <Paper sx={{ p: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              Available Balance: ₹{balance.balance.toFixed(2)}
            </Alert>
            <form onSubmit={handleSubmitExpense}>
              <TextField
                fullWidth
                label="Amount (₹)"
                type="number"
                value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                required
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Reason"
                value={expenseForm.reason}
                onChange={(e) => setExpenseForm({ ...expenseForm, reason: e.target.value })}
                required
                multiline
                rows={3}
                sx={{ mb: 2 }}
              />
              <Button type="submit" variant="contained" color="error" fullWidth disabled={loading}>
                {loading ? 'Recording...' : 'Record Expense'}
              </Button>
            </form>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {records.length === 0 ? (
              <Typography align="center" color="text.secondary" sx={{ py: 4 }}>
                No records found
              </Typography>
            ) : (
              records.map((record) => (
                <Card key={record.id} elevation={1} sx={{ borderRadius: 2 }}>
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
                    <Typography variant="h6" fontWeight="900" sx={{ mb: 1, color: record.type === 'OFFERING' ? '#2e7d32' : '#d32f2f' }}>
                      ₹{parseFloat(record.amount || 0).toFixed(2)}
                    </Typography>
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
        )}
      </Box>
    </Box>
  );
};

export default OfferingsPage;

