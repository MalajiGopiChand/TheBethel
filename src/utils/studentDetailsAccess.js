// Parents never choose a student through the URL or the staff search field.
export function studentDetailsId(user, requestedId) {
  if (user?.role === 'PARENT') return user.studentId == null ? null : String(user.studentId);
  return requestedId || null;
}
