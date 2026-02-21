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
  Chip
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
  addDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';

const FinanceManagementPage = () => {
  const navigate = useNavigate();
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
    if (!offeringForm.amount || !offeringForm.reason) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await addDoc(collection(db, 'financial_records'), {
        type: 'OFFERING',
        place: selectedPlace,
        amount: parseFloat(offeringForm.amount),
        reason: offeringForm.reason,
        items: [],
        timestamp: serverTimestamp()
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
      await addDoc(collection(db, 'financial_records'), {
        type: 'EXPENSE',
        place: selectedPlace,
        amount: expenseAmount,
        reason: expenseForm.reason,
        items: [],
        timestamp: serverTimestamp()
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
          <Button startIcon={<BackIcon />} onClick={() => navigate(-1)}>
            Back
          </Button>
          <Typography variant="h5" sx={{ flexGrow: 1, textAlign: 'center', fontWeight: 'bold' }}>
            Finance Management
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

        <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mb: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Balance Summary - {selectedPlace}</Typography>
            <Typography variant="body2">Total Offerings: ₹{balance.totalOfferings.toFixed(2)}</Typography>
            <Typography variant="body2">Total Expenses: ₹{balance.totalExpenses.toFixed(2)}</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold' }}>
              Balance: ₹{balance.balance.toFixed(2)}
            </Typography>
          </CardContent>
        </Card>

        <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
          <Tab label="Offerings" icon={<MoneyIcon />} />
          <Tab label="Expenses" icon={<ExpenseIcon />} />
          <Tab label="History" icon={<HistoryIcon />} />
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
                </TableRow>
              </TableHead>
              <TableBody>
                {records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {(() => {
                          if (!record.timestamp) return 'N/A';
                          let date;
                          if (typeof record.timestamp.toDate === 'function') {
                            date = record.timestamp.toDate();
                          } else if (record.timestamp instanceof Date) {
                            date = record.timestamp;
                          }
                          return date ? format(date, 'yyyy-MM-dd HH:mm') : 'N/A';
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

export default FinanceManagementPage;

