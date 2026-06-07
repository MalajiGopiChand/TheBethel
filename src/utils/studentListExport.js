import { format } from 'date-fns';
import {
  escapeHtml,
  slugify,
  paginateSections,
  renderTableSection,
  downloadA4Images
} from './a4ImageExport';

const KNOWN_PLACES = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'];
const PLACE_SECTION_ORDER = [...KNOWN_PLACES, 'Other', 'Unknown'];

export const STUDENT_LIST_COLUMNS = ['S.No.', 'Roll Number', 'Student Name'];

const getPlaceLabel = (student) => {
  const loc = (student.location || student.place || '').trim();
  if (!loc) return 'Unknown';
  if (KNOWN_PLACES.includes(loc)) return loc;
  return 'Other';
};

const matchesPlaceFilter = (student, selectedPlace) => {
  const loc = student.location || student.place || '';
  if (selectedPlace === 'All') return true;
  if (selectedPlace === 'Other') return !KNOWN_PLACES.includes(loc);
  return loc === selectedPlace;
};

const sortByRoll = (a, b) =>
  String(a.studentId || '').localeCompare(String(b.studentId || ''), undefined, {
    numeric: true,
    sensitivity: 'base'
  });

const studentToRow = (student, index) => [
  index + 1,
  student.studentId || '-',
  student.name || '-'
];

/** @returns {{ generatedLabel, totalStudents, placeSections, selectedClass, selectedPlace }} */
export function buildStudentListReport({ students, selectedClass = 'All', selectedPlace = 'All' }) {
  const filtered = students.filter((student) => {
    if (selectedClass !== 'All' && student.classType !== selectedClass) return false;
    return matchesPlaceFilter(student, selectedPlace);
  });

  const byPlace = new Map();
  filtered.forEach((student) => {
    const place = getPlaceLabel(student);
    if (!byPlace.has(place)) byPlace.set(place, []);
    byPlace.get(place).push(student);
  });

  const placeSections = PLACE_SECTION_ORDER.filter((place) => byPlace.has(place)).map((place) => {
    const placeStudents = byPlace.get(place).sort(sortByRoll);
    return {
      place,
      students: placeStudents,
      rows: placeStudents.map((s, i) => studentToRow(s, i))
    };
  });

  return {
    generatedLabel: format(new Date(), 'dd MMM yyyy'),
    selectedClass,
    selectedPlace,
    totalStudents: filtered.length,
    placeSections
  };
};

const buildReportHeaderHtml = (report, { showMeta = true } = {}) => {
  const { generatedLabel, selectedClass, selectedPlace, totalStudents } = report;
  const filterLine =
    selectedClass !== 'All' || selectedPlace !== 'All'
      ? `<p style="margin:4px 0;font-size:12px;color:#555;">Class: ${escapeHtml(selectedClass)} | Place: ${escapeHtml(selectedPlace)}</p>`
      : '';

  if (!showMeta) return '';

  return `
    <h2 style="margin:0 0 4px;text-align:center;color:#1565c0;font-size:20px;">Student Data</h2>
    <p style="margin:0;text-align:center;font-size:12px;color:#333;">Generated: ${escapeHtml(generatedLabel)}</p>
    ${filterLine}
    <p style="margin:6px 0 12px;text-align:center;font-size:12px;font-weight:bold;">Total students: ${totalStudents}</p>`;
};

const renderStudentPageContent = (report, page) => {
  if (page.empty) {
    return `
      ${buildReportHeaderHtml(report)}
      <p style="text-align:center;color:#666;padding:40px 0;">No students found.</p>`;
  }

  const header = page.showReportHeader ? buildReportHeaderHtml(report) : '';
  const table = renderTableSection({
    columns: STUDENT_LIST_COLUMNS,
    rows: page.rows,
    place: page.place,
    showPlaceHeader: page.showPlaceHeader,
    headerColor: '#1976d2',
    borderColor: '#1565c0',
    rowNumberStart: page.rowNumberStart,
    renumberSerial: true
  });

  return `${header}${table}`;
};

const exportA4Pages = async (report, sections, fileBaseName) => {
  const pages = paginateSections(
    sections.map((s) => ({ place: s.place, rows: s.rows })),
    { rowsOnFirstPage: 22, rowsOnNextPage: 26 }
  );

  return downloadA4Images({
    pages: pages.length ? pages : [],
    fileBaseName,
    renderPage: (page) => renderStudentPageContent(report, page)
  });
};

export async function downloadStudentListImageAll(params) {
  const report = buildStudentListReport(params);
  const dateStamp = format(new Date(), 'yyyy-MM-dd');
  return exportA4Pages(report, report.placeSections, `student-data-${dateStamp}`);
}

export async function downloadStudentListImagesByPlace(params) {
  const report = buildStudentListReport(params);
  const dateStamp = format(new Date(), 'yyyy-MM-dd');
  const downloaded = [];

  if (report.placeSections.length === 0) {
    return exportA4Pages(report, [], `student-data-${dateStamp}`);
  }

  for (const section of report.placeSections) {
    const files = await exportA4Pages(
      report,
      [section],
      `student-data-${dateStamp}-${slugify(section.place)}`
    );
    downloaded.push(...files);
  }

  return downloaded;
}
