import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';
import {
  escapeHtml,
  slugify,
  paginateSections,
  renderTableSection,
  downloadA4Images
} from './a4ImageExport';

const KNOWN_PLACES = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'];
const PLACE_SECTION_ORDER = [...KNOWN_PLACES, 'Other', 'Unknown'];

export const ABSENT_EXPORT_COLUMNS = [
  'S.No.',
  'Student Name',
  'Class',
  'Date',
  'Father Name',
  'Mother Name',
  'Phone Number'
];

const getStudentPhone = (student) => {
  const value =
    student.parentPhone ||
    student.mobileNumber ||
    student.phone ||
    student.phoneNumber ||
    student.contactNumber ||
    student.parentContact ||
    student.fatherPhone ||
    student.motherPhone ||
    '';
  return String(value).trim();
};

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

const formatDateLabel = (selectedDate) => {
  try {
    return format(parseISO(selectedDate), 'dd MMM yyyy');
  } catch {
    return selectedDate;
  }
};

const studentToRow = (student, index, dateLabel) => [
  index + 1,
  student.name || '-',
  student.classType || '-',
  dateLabel,
  student.fatherName || '-',
  student.motherName || '-',
  getStudentPhone(student) || '-'
];

/** @returns {{ dateLabel, selectedDate, selectedClass, selectedPlace, totalAbsent, placeSections }} */
export function buildAbsentStudentsReport({ students, selectedDate, selectedClass, selectedPlace }) {
  const dateLabel = formatDateLabel(selectedDate);

  const filtered = students.filter((student) => {
    const absentDates = student.absentDates || [];
    const isAbsentOnDate = absentDates.some((d) => d && String(d).startsWith(selectedDate));
    if (!isAbsentOnDate) return false;
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
    const placeStudents = byPlace
      .get(place)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    return {
      place,
      students: placeStudents,
      rows: placeStudents.map((s, i) => studentToRow(s, i, dateLabel))
    };
  });

  return {
    dateLabel,
    selectedDate,
    selectedClass,
    selectedPlace,
    totalAbsent: filtered.length,
    placeSections
  };
};

const PDF_COLUMN_STYLES = {
  0: { cellWidth: 10, halign: 'center' },
  1: { cellWidth: 32 },
  2: { cellWidth: 18 },
  3: { cellWidth: 20 },
  4: { cellWidth: 28 },
  5: { cellWidth: 28 },
  6: { cellWidth: 24 }
};

export function downloadAbsentStudentsPdf(params) {
  const report = buildAbsentStudentsReport(params);
  const { dateLabel, selectedDate, selectedClass, selectedPlace, totalAbsent, placeSections } = report;

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  doc.setFontSize(16);
  doc.text('Absent Students Report', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Date: ${dateLabel}`, pageWidth / 2, 22, { align: 'center' });
  if (selectedClass !== 'All' || selectedPlace !== 'All') {
    doc.text(
      `Filters — Class: ${selectedClass} | Place: ${selectedPlace}`,
      pageWidth / 2,
      28,
      { align: 'center' }
    );
  }
  doc.text(`Total absent: ${totalAbsent}`, pageWidth / 2, 34, { align: 'center' });

  let startY = 42;
  const tableHead = [ABSENT_EXPORT_COLUMNS];

  placeSections.forEach(({ place, rows }, sectionIndex) => {
    if (startY > pageHeight - 40) {
      doc.addPage();
      startY = margin;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Place: ${place} (${rows.length})`, margin, startY);
    doc.setFont(undefined, 'normal');
    startY += 7;

    autoTable(doc, {
      startY,
      head: tableHead,
      body: rows,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [211, 47, 47], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: PDF_COLUMN_STYLES,
      margin: { left: margin, right: margin }
    });

    startY = (doc.lastAutoTable?.finalY ?? startY) + (sectionIndex < placeSections.length - 1 ? 10 : 4);
  });

  if (placeSections.length === 0) {
    autoTable(doc, {
      startY: 42,
      head: tableHead,
      body: [['-', 'No absent students', '-', dateLabel, '-', '-', '-']],
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [211, 47, 47], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });
  }

  const fileName = `absent-students-${selectedDate}.pdf`;
  doc.save(fileName);
  return fileName;
};

const buildAbsentHeaderHtml = (report, { showMeta = true } = {}) => {
  const { dateLabel, selectedClass, selectedPlace, totalAbsent } = report;
  const filterLine =
    selectedClass !== 'All' || selectedPlace !== 'All'
      ? `<p style="margin:4px 0;font-size:12px;color:#555;">Class: ${escapeHtml(selectedClass)} | Place: ${escapeHtml(selectedPlace)}</p>`
      : '';

  if (!showMeta) return '';

  return `
    <h2 style="margin:0 0 4px;text-align:center;color:#c62828;font-size:20px;">Absent Students Report</h2>
    <p style="margin:0;text-align:center;font-size:12px;color:#333;">Date: ${escapeHtml(dateLabel)}</p>
    ${filterLine}
    <p style="margin:6px 0 12px;text-align:center;font-size:12px;font-weight:bold;">Total absent: ${totalAbsent}</p>`;
};

const renderAbsentPageContent = (report, page) => {
  if (page.empty) {
    return `
      ${buildAbsentHeaderHtml(report)}
      <p style="text-align:center;color:#666;padding:40px 0;">No absent students for this date.</p>`;
  }

  const header = page.showReportHeader ? buildAbsentHeaderHtml(report) : '';
  const table = renderTableSection({
    columns: ABSENT_EXPORT_COLUMNS,
    rows: page.rows,
    place: page.place,
    showPlaceHeader: page.showPlaceHeader,
    headerColor: '#d32f2f',
    borderColor: '#c62828',
    rowNumberStart: page.rowNumberStart,
    renumberSerial: true
  });

  return `${header}${table}`;
};

const exportAbsentA4Pages = async (report, sections, fileBaseName) => {
  const pages = paginateSections(
    sections.map((s) => ({ place: s.place, rows: s.rows })),
    { rowsOnFirstPage: 16, rowsOnNextPage: 20 }
  );

  return downloadA4Images({
    pages: pages.length ? pages : [],
    fileBaseName,
    renderPage: (page) => renderAbsentPageContent(report, page)
  });
};

/** A4-sized PNG pages (not one long image) */
export async function downloadAbsentStudentsImageAll(params) {
  const report = buildAbsentStudentsReport(params);
  return exportAbsentA4Pages(report, report.placeSections, `absent-students-${report.selectedDate}`);
}

/** A4 pages per place */
export async function downloadAbsentStudentsImagesByPlace(params) {
  const report = buildAbsentStudentsReport(params);
  const downloaded = [];

  if (report.placeSections.length === 0) {
    return exportAbsentA4Pages(report, [], `absent-students-${report.selectedDate}`);
  }

  for (const section of report.placeSections) {
    const files = await exportAbsentA4Pages(
      report,
      [section],
      `absent-students-${report.selectedDate}-${slugify(section.place)}`
    );
    downloaded.push(...files);
  }

  return downloaded;
}

/** @deprecated use downloadAbsentStudentsPdf */
export function generateAbsentStudentsPdf(params) {
  return downloadAbsentStudentsPdf(params);
}
