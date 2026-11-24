import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from '../services/notifyingFirestore';
import { db } from '../config/firebase';
import { newestActivity } from '../utils/teacherActivity';

const sources = ['offerings', 'expenses', 'financial_records'];
export default function useFinanceRecords(place) {
  const [feeds, setFeeds] = useState({});
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setFeeds({});
    const stops = sources.map(source => onSnapshot(query(collection(db, source), where('place', '==', place)), snapshot => {
      setFeeds(previous => ({ ...previous, [source]: { place, rows: snapshot.docs.map(item => ({ ...item.data(), id: item.id, sourceCollection: source, type: source === 'offerings' ? 'offering' : source === 'expenses' ? 'expense' : String(item.data().type || '').toLowerCase() })) } }));
    }, () => setFeeds(previous => ({ ...previous, [source]: { place, rows: [], error: true } }))));
    return () => stops.forEach(stop => stop());
  }, [place, attempt]);
  const loading = sources.some(source => feeds[source]?.place !== place);
  const error = sources.some(source => feeds[source]?.place === place && feeds[source].error) ? 'Finance records could not be fully loaded. Retry before using these totals.' : '';
  const records = useMemo(() => sources.flatMap(source => feeds[source]?.place === place ? feeds[source].rows : []).sort(newestActivity), [feeds, place]);
  const balance = records.reduce((totals, row) => {
    const amount = Number(row.amount);
    if (!Number.isFinite(amount)) return totals;
    if (row.type === 'offering') totals.totalOfferings += amount;
    if (row.type === 'expense') totals.totalExpenses += amount;
    totals.balance = totals.totalOfferings - totals.totalExpenses;
    return totals;
  }, { totalOfferings: 0, totalExpenses: 0, balance: 0 });
  return { records, balance, expenses: records.filter(row => row.type === 'expense'), loading, error, retry: () => setAttempt(value => value + 1) };
}
