export function rewardBalance(student) {
  // Explicit balances include administrator corrections, including a zero balance.
  const balance = student.dollarPoints;
  if (balance !== null && balance !== undefined && balance !== '' && Number.isFinite(Number(balance))) return Number(balance);
  return (student.rewards || []).reduce((sum, reward) => sum + (Number(reward.dollars) || 0), 0);
}

export function rewardPeriodTotal(students, start, end = new Date()) {
  const from = start.getTime();
  const to = end.getTime();
  return students.reduce((total, student) => total + (student.rewards || []).reduce((sum, reward) => {
    const date = reward.date?.toDate ? reward.date.toDate() : new Date(typeof reward.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(reward.date) ? `${reward.date}T00:00:00` : reward.date);
    return date.getTime() >= from && date.getTime() <= to ? sum + (Number(reward.dollars) || 0) : sum;
  }, 0), 0);
}

export function changeReward(student, index, expected, amount) {
  const rewards = [...(student.rewards || [])];
  const current = rewards[index];
  const fingerprint = reward => JSON.stringify([reward?.date ?? null, Number(reward?.dollars) || 0, reward?.reason || '', reward?.teacher || '']);
  if (!current || fingerprint(current) !== fingerprint(expected)) throw new Error('This reward changed. Close the dialog and select the entry again.');
  if (amount !== null && (!Number.isSafeInteger(amount) || amount < 0)) throw new Error('Enter a non-negative whole number.');
  const previous = Number(current.dollars) || 0;
  if (amount === null) rewards.splice(index, 1);
  else rewards[index] = { ...current, dollars: amount };
  return { rewards, dollarPoints: rewardBalance(student) + (amount ?? 0) - previous };
}
