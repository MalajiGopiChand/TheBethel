import React, { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, limit, updateDoc, doc } from "../services/notifyingFirestore";
import { Box, IconButton, Badge, Drawer, Typography, Button, Alert, Stack, List, ListItemButton, ListItemText, Divider, CircularProgress, Tooltip } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/NotificationsOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { registerPushTokenForUser } from '../services/notificationService';

export default function GlobalNotificationListener() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [enabling, setEnabling] = useState(false);
  const [pushMessage, setPushMessage] = useState('');
  const [pushEnabled, setPushEnabled] = useState(false);
  const [deliveryWarning, setDeliveryWarning] = useState('');
  useEffect(() => {
    const receive = event => setDeliveryWarning(event.detail);
    window.addEventListener('notification-delivery-warning', receive);
    return () => window.removeEventListener('notification-delivery-warning', receive);
  }, []);
  useEffect(() => {
    setItems([]); setPushEnabled(false); setPushMessage('');
    if (!currentUser?.uid || currentUser.role === 'PARENT') return;
    setLoading(true);
    return onSnapshot(query(collection(db, 'user_notifications', currentUser.uid, 'items'), orderBy('createdAt', 'desc'), limit(50)), snapshot => {
      setItems(snapshot.docs.map(item => ({ id: item.id, ...item.data() })));
      setLoading(false); setError('');
    }, () => { setLoading(false); setError('Could not load notifications. Check your connection or contact the administrator.'); });
  }, [currentUser?.uid]);
  if (!currentUser || currentUser.role === 'PARENT') return null;
  const enablePush = async () => {
    setEnabling(true); setPushMessage('');
    try {
      const token = await registerPushTokenForUser(currentUser, { requestPermission: true });
      if (!token) throw new Error('Device registration did not finish. Please sign in again and retry.');
      setPushEnabled(true); setPushMessage('Device registered. Automatic alerts also require the notification server to be deployed and running.');
    } catch (error) { setPushEnabled(false); setPushMessage(error.message); }
    finally { setEnabling(false); }
  };
  const openNotification = async item => {
    try { await updateDoc(doc(db, 'user_notifications', currentUser.uid, 'items', item.id), { read: true }); }
    catch { setError('Could not mark this notification as read.'); }
    if (item.url?.startsWith('/') && !item.url.startsWith('//')) { navigate(item.url); setOpen(false); }
  };
  return <>
    {deliveryWarning && <Alert severity="warning" onClose={() => setDeliveryWarning('')} sx={{ position: 'fixed', bottom: 155, right: 16, left: { xs: 16, sm: 'auto' }, maxWidth: 420, zIndex: 1400 }}>{deliveryWarning}</Alert>}
    <Tooltip title="Notifications"><IconButton onClick={() => setOpen(true)} aria-label="Open notifications" sx={{ position: 'fixed', right: 16, bottom: 'calc(96px + env(safe-area-inset-bottom))', zIndex: 1200, bgcolor: 'background.paper', boxShadow: 3, width: 48, height: 48, '&:hover': { bgcolor: 'background.paper' } }}>
      <Badge badgeContent={items.filter(item => !item.read).length} color="error"><NotificationsIcon /></Badge>
    </IconButton></Tooltip>
    <Drawer anchor="right" open={open} onClose={() => setOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, maxWidth: '100%', borderRadius: 0 } }}>
      <Box sx={{ p: 2 }}><Stack direction="row" alignItems="center" justifyContent="space-between"><Typography variant="h6">Notifications</Typography><IconButton aria-label="Close notifications" onClick={() => setOpen(false)}><CloseIcon /></IconButton></Stack>
        <Typography variant="body2" color="text.secondary" sx={{ my: 2 }}>Your latest 50 updates. Enable device notifications to receive updates when this app is closed.</Typography>
        <Button fullWidth variant="contained" disabled={enabling} onClick={enablePush}>{enabling ? 'Enabling…' : 'Enable device notifications'}</Button>
        {pushMessage && <Alert sx={{ mt: 2 }} severity={pushEnabled ? 'success' : 'warning'}>{pushMessage}</Alert>}
        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
      </Box><Divider />
      {loading ? <CircularProgress sx={{ m: 3 }} /> : !items.length && !error ? <Typography sx={{ p: 3 }} color="text.secondary">No updates yet. New activity will appear here.</Typography> : <List>{items.map(item => <ListItemButton key={item.id} onClick={() => openNotification(item)} sx={{ alignItems: 'flex-start', bgcolor: item.read ? 'transparent' : 'action.hover' }}>
        <ListItemText primary={item.title} secondary={<>{item.body}<br />{item.createdAt?.toDate?.().toLocaleString() || 'Just now'}</>} primaryTypographyProps={{ fontWeight: item.read ? 400 : 700 }} secondaryTypographyProps={{ sx: { overflowWrap: 'anywhere' } }} />
      </ListItemButton>)}</List>}
    </Drawer>
  </>;
}
