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
      const expensesData = expensesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      const totalExpenses = expensesData.reduce((sum, record) => {
        return sum + (parseFloat(record.amount) || 0);
      }, 0);
      
      setExpenses(expensesData);
      
      // Fetch all records for history
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
    if (!offeringForm.amount || !offeringForm.reason) {
      alert('Please fill in all fields');
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
        amount: parseFloat(offeringForm.amount),
        reason: offeringForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      
      setOfferingForm({ amount: '', reason: '' });
      fetchBalanceAndRecords();
      alert('Offering recorded successfully!');
    } catch (error) {
      console.error('Error saving offering:', error);
      alert('Failed to save offering: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || !expenseForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    const expenseAmount = parseFloat(expenseForm.amount);
    if (expenseAmount > balance.balance) {
      alert(`Insufficient funds! Available: ₹${balance.balance.toFixed(2)}`);
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
        amount: expenseAmount,
        reason: expenseForm.reason,
        items: [],
        timestamp: serverTimestamp(),
        createdBy: creatorName,
        createdByUid: currentUser?.uid || null,
        createdAt: serverTimestamp()
      });
      
      setExpenseForm({ amount: '', reason: '' });
      fetchBalanceAndRecords();
      alert('Expense recorded successfully!');
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense: ' + error.message);
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
              <Button type="submit" variant="contained" fullWidth>
                Record Offering
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
              <Button type="submit" variant="contained" color="error" fullWidth>
                Record Expense
              </Button>
            </form>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell><strong>Recorded By</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
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
                                return format(date, 'yyyy-MM-dd HH:mm');
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
                                return format(date, 'yyyy-MM-dd HH:mm');
                              }
                            }
                            return 'N/A';
                          } catch (error) {
                            console.error('Error formatting date:', error, record);
                            return 'N/A';
                          }
                        })()}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={record.type}
                          color={record.type === 'OFFERING' ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>₹{record.amount?.toFixed(2) || '0.00'}</TableCell>
                      <TableCell>{record.reason || '-'}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="medium">
                          {(() => {
                            // Try multiple possible field names for creator
                            const creator = record.createdBy || 
                                          record.createdByName || 
                                          record.recordedBy || 
                                          record.uploadedBy ||
                                          record.userName ||
                                          record.name ||
                                          (record.createdByUid ? `User ${record.createdByUid.substring(0, 8)}` : null);
                            return creator || 'Unknown';
                          })()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default OfferingsPage;

