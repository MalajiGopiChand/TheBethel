import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Search as SearchIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import {
  collection,
  getDocs,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from '../../../config/firebase';

const AdminRegisteredParentsPage = () => {
  const navigate = useNavigate();
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const parentsSnapshot = await getDocs(
        query(collection(db, 'parents'), orderBy('name'))
      );
      const parentsData = parentsSnapshot.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      }));
      setParents(parentsData);
    } catch (error) {
      console.error('Error fetching parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParents = parents.filter(parent =>
    parent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    parent.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (parent.studentName && parent.studentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (parent.studentId && parent.studentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const downloadParentsList = () => {
    if (filteredParents.length === 0) {
      alert('No parents to download');
      return;
    }

    try {
      setDownloading(true);
      const records = filteredParents.map(parent => ({
        'Parent Name': parent.name,
        'Email': parent.email,
        'Phone': parent.phone || '',
        'Student Name': parent.studentName || '',
        'Student Roll No': parent.studentId || ''
      }));

      const headers = Object.keys(records[0]);
      const csvContent = [
        headers.join(','),
        ...records.map(row => headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `parents_list_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading parents list:', error);
      alert('Failed to download parents list: ' + error.message);
    } finally {
      setDownloading(false);
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
            Registered Parents ({parents.length})
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={downloadParentsList}
            disabled={downloading || filteredParents.length === 0}
          >
            {downloading ? 'Downloading...' : 'Download'}
          </Button>
        </Box>

        <TextField
          fullWidth
          placeholder="Search parents by name, email, or student name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
          }}
        />
      </Paper>

      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : filteredParents.length === 0 ? (
          <Alert severity="info">No parents found.</Alert>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Parent Name</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Phone</strong></TableCell>
                  <TableCell><strong>Student Name</strong></TableCell>
                  <TableCell><strong>Student Roll No</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredParents.map((parent) => (
                  <TableRow key={parent.uid}>
                    <TableCell>{parent.name}</TableCell>
                    <TableCell>{parent.email}</TableCell>
                    <TableCell>{parent.phone || '-'}</TableCell>
                    <TableCell>{parent.studentName || '-'}</TableCell>
                    <TableCell>
                      {parent.studentId ? (
                        <Chip label={parent.studentId} size="small" color="primary" />
                      ) : (
                        '-'
                      )}
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

export default AdminRegisteredParentsPage;

