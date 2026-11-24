import React from 'react';
import { Paper, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SchoolArtwork from './SchoolArtwork';

export default function PodiumSection({ topStudents = [] }) {
  const navigate = useNavigate();
  if (!topStudents.length) return null;
  return <section className="admin-home" aria-label="Top student performers">
    <Paper className="performers-panel">
      <div className="performers-heading"><Typography component="h2" variant="h5">🏆 Top Performers</Typography><Button onClick={() => navigate('/teacher/leaderboard')}>View All</Button></div>
      <div className="admin-podium">
        {[topStudents[1], topStudents[0], topStudents[2]].map((student, index) => student && <Paper className="admin-podium-item" data-rank={[2, 1, 3][index]} key={student.id || `${index}:${student.name}`}>
          <div className="admin-podium-medal" aria-label={`Rank ${[2, 1, 3][index]}`}>{['🥈', '👑', '🥉'][index]}</div>
          <SchoolArtwork name="portrait" className="performer-portrait" />
          <Typography fontWeight={800}>{student.name || 'Student'}</Typography><Typography fontWeight={900}>${Number(student.dollars || 0).toLocaleString()}</Typography>
        </Paper>)}
      </div>
    </Paper>
  </section>;
}
