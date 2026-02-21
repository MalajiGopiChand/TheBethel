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
  Grid
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Add as AddIcon,
  AccountBalanceWallet as OfferingIcon
} from '@mui/icons-material';
import {
  collection,
  addDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';
import { format } from 'date-fns';
import { db } from '../../../config/firebase';
import { useAuth } from '../../../contexts/AuthContext';

const OfferingsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [offerings, setOfferings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState('All');
  const [formData, setFormData] = useState({
    amount: '',
    reason: ''
  });
  const [saving, setSaving] = useState(false);
  const [balance, setBalance] = useState({ totalOfferings: 0, totalExpenses: 0, balance: 0 });

  const places = ['All', 'Kandrika', 'Krishna Lanka', 'Gandhiji Conly', 'Other'];

  useEffect(() => {
    // Keep teacher offerings page in sync with admin finance by reading financial_records.
    setLoading(true);
    const recordsQuery = selectedPlace === 'All'
      ? query(collection(db, 'financial_records'))
      : query(
          collection(db, 'financial_records'),
          where('place', '==', selectedPlace)
        );

    const unsubscribeRecords = onSnapshot(recordsQuery, (snapshot) => {
      const allRecords = snapshot.docs
        .map((docRef) => ({
          id: docRef.id,
          ...docRef.data()
        }))
        .sort((a, b) => {
          const aTime = a.timestamp?.toDate?.() || a.timestamp || 0;
          const bTime = b.timestamp?.toDate?.() || b.timestamp || 0;
          return bTime - aTime;
        });

      const offeringRecords = allRecords.filter((record) => record.type === 'OFFERING');
      const expenseRecords = allRecords.filter((record) => record.type === 'EXPENSE');

      const totalOfferings = offeringRecords.reduce(
        (sum, record) => sum + (parseFloat(record.amount) || 0),
        0
      );
      const totalExpenses = expenseRecords.reduce(
        (sum, record) => sum + (parseFloat(record.amount) || 0),
        0
      );

      setOfferings(offeringRecords);
      setBalance({
        totalOfferings,
        totalExpenses,
        balance: totalOfferings - totalExpenses
      });
      setLoading(false);
    }, (error) => {
      console.error('Error fetching offerings:', error);
      setLoading(false);
    });

    return () => unsubscribeRecords();
  }, [selectedPlace]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPlace === 'All') {
      alert('Please choose a specific place before adding offering.');
      return;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      await addDoc(collection(db, 'financial_records'), {
        type: 'OFFERING',
        amount: parseFloat(formData.amount),
        reason: formData.reason || 'Offering',
        place: selectedPlace,
        createdBy: currentUser?.name || 'Teacher',
        createdByUid: currentUser?.uid || null,
        items: [],
        timestamp: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      setFormData({ amount: '', reason: '' });
      alert('Offering recorded successfully!');
    } catch (error) {
      console.error('Error saving offering:', error);
      alert('Failed to save offering: ' + error.message);
    } finally {
      setSaving(false);
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
            Offerings
          </Typography>
          <Box sx={{ width: 100 }} />
        </Box>

        <FormControl sx={{ minWidth: 200, mb: 2 }}>
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
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Offerings</Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  ${balance.totalOfferings.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Total Expenses</Typography>
                <Typography variant="h5" fontWeight="bold" color="error.main">
                  ${balance.totalExpenses.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">Balance</Typography>
                <Typography variant="h5" fontWeight="bold" color="primary.main">
                  ${balance.balance.toFixed(2)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <OfferingIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              Add Offering
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Reason (Optional)"
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="e.g., Sunday Offering"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={20} /> : <AddIcon />}
                  >
                    {saving ? 'Saving...' : 'Add Offering'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : offerings.length === 0 ? (
          <Alert severity="info">No offerings recorded yet.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Date</strong></TableCell>
                  <TableCell><strong>Place</strong></TableCell>
                  <TableCell><strong>Amount</strong></TableCell>
                  <TableCell><strong>Reason</strong></TableCell>
                  <TableCell><strong>Recorded By</strong></TableCell>
                  <TableCell><strong>Updated</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {offerings.map((offering) => (
                  <TableRow key={offering.id}>
                    <TableCell>
                      {(() => {
                        if (!offering.timestamp) return 'N/A';
                        let date;
                        if (typeof offering.timestamp.toDate === 'function') {
                          date = offering.timestamp.toDate();
                        } else if (offering.timestamp instanceof Date) {
                          date = offering.timestamp;
                        }
                        return date ? format(date, 'MMM dd, yyyy HH:mm') : 'N/A';
                      })()}
                    </TableCell>
                    <TableCell>
                      {offering.place || '-'}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`$${parseFloat(offering.amount).toFixed(2)}`}
                        color="success"
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{offering.reason || '-'}</TableCell>
                    <TableCell>{offering.createdBy || '-'}</TableCell>
                    <TableCell>
                      {(() => {
                        const updateTime = offering.updatedAt || offering.timestamp;
                        if (!updateTime) return 'N/A';
                        let date;
                        if (typeof updateTime.toDate === 'function') {
                          date = updateTime.toDate();
                        } else if (updateTime instanceof Date) {
                          date = updateTime;
                        }
                        return date ? format(date, 'MMM dd, yyyy HH:mm') : 'N/A';
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default OfferingsPage;

