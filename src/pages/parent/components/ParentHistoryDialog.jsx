import React from 'react';
import { Dialog, DialogContent, IconButton } from '@mui/material';
import { CloseRounded, EventAvailableRounded, LayersOutlined, LocalOfferOutlined, PersonOutlineRounded, CheckCircleOutlineRounded } from '@mui/icons-material';
import { activityDate } from '../../../utils/parentActivity';

export default function ParentHistoryDialog({ kind, records, rewards, parentLang, onClose }) {
  const points = kind === 'points';
  const text = (en, te) => parentLang === 'te' ? te : en;
  const title = points ? text('Dollar Points History', 'డాలర్ పాయింట్ల చరిత్ర') : text('Attendance Log', 'హాజరు నమోదు');
  const locale = parentLang === 'te' ? 'te-IN' : 'en-GB';
  const dateFormat = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const amountFormat = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', minimumFractionDigits: 0, maximumFractionDigits: 2, signDisplay: 'exceptZero' });
  const dateColumn = [EventAvailableRounded, text('Date', 'తేదీ')];
  const columns = points
    ? [dateColumn, [LayersOutlined, text('Amount', 'మొత్తం')], [LocalOfferOutlined, text('Reason', 'కారణం')], [PersonOutlineRounded, text('Teacher', 'ఉపాధ్యాయులు')]]
    : [dateColumn, [PersonOutlineRounded, text('Name', 'పేరు')], [CheckCircleOutlineRounded, text('Status', 'స్థితి')]];
  const hasRows = points ? rewards.length > 0 : records.length > 0;

  return <Dialog open onClose={onClose} fullWidth maxWidth={points ? 'sm' : 'xs'}
    aria-labelledby="parent-history-title" PaperProps={{ className: 'parent-history ' + (points ? 'points-history' : 'attendance-history') }}>
    <header className="history-banner">
      <span aria-hidden="true" className="history-symbol">{points ? '🪙' : '🔥'}</span>
      <h2 id="parent-history-title">{title}</h2>
      {points && <p>{text('A record of your child’s dollar points.', 'మీ పిల్లవాడి డాలర్ పాయింట్ల వివరాలు.')}</p>}
      <IconButton onClick={onClose} aria-label={text('Close', 'మూసివేయి')} className="history-close"><CloseRounded /></IconButton>
    </header>
    <DialogContent className="history-content">
      {hasRows && <div className="history-table-wrap"><table aria-label={title}>
        <thead><tr>{columns.map(([Icon, label]) => <th scope="col" key={label}><Icon aria-hidden="true" /> {label}</th>)}</tr></thead>
        <tbody>{points ? rewards.map((reward, index) => {
          const date = activityDate(reward.date);
          const amount = reward.dollars == null || String(reward.dollars).trim() === '' ? NaN : Number(reward.dollars);
          return <tr key={index}>
            <td>{date ? dateFormat.format(date) : '—'}</td>
            <td><span className={'history-badge ' + (amount < 0 ? 'negative' : 'positive')}>{Number.isFinite(amount) ? amountFormat.format(amount) : '—'}</span></td>
            <td>{reward.reason || '—'}</td><td><span className="history-badge staff">{reward.teacher || reward.awardedBy || '—'}</span></td>
          </tr>;
        }) : records.map(record => <tr key={record.date}>
          <td>{record.date}</td><td><span className="history-badge staff">{record.teacherName || '—'}</span></td>
          <td>{record.status === 'present'
            ? <span className="history-badge positive">{text('Present', 'హాజరు')}</span>
            : <span className="history-badge negative">{text('Absent', 'గైర్హాజరు')}</span>}</td>
        </tr>)}</tbody>
      </table></div>}
      {(points || !hasRows) && <div className="history-footer">
        <span className="calendar-art" aria-hidden="true"><i>✓</i></span>
        <strong>{hasRows ? text('That’s all for now!', 'ప్రస్తుతానికి ఇంతే!') : points
          ? text('No dollar points recorded yet.', 'ఇంకా డాలర్ పాయింట్లు నమోదు కాలేదు.')
          : text('No attendance recorded yet.', 'ఇంకా హాజరు నమోదు కాలేదు.')}</strong>
        {hasRows && <p>{text('All dollar points history is shown above.', 'డాలర్ పాయింట్ల చరిత్ర అంతా పైన ఉంది.')}</p>}
      </div>}
    </DialogContent>
  </Dialog>;
}
