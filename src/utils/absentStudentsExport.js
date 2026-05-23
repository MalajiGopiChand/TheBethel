import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import { format, parseISO } from 'date-fns';

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

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const buildReportHtml = (report, { sections = 'all' } = {}) => {
  const { dateLabel, selectedClass, selectedPlace, totalAbsent, placeSections } = report;
  const sectionsToRender =
    sections === 'all' ? placeSections : placeSections.filter((s) => s.place === sections);

  const filterLine =
    selectedClass !== 'All' || selectedPlace !== 'All'
      ? `<p style="margin:4px 0;font-size:13px;color:#555;">Filters — Class: ${escapeHtml(selectedClass)} | Place: ${escapeHtml(selectedPlace)}</p>`
      : '';

  const sectionHtml = sectionsToRender
    .map(({ place, rows }) => {
      const bodyRows = rows
        .map(
          (row) =>
            `<tr>${row
              .map(
                (cell, colIndex) =>
                  `<td style="border:1px solid #ddd;padding:6px 8px;font-size:12px;${colIndex === 0 ? 'text-align:center;width:40px;' : ''}">${escapeHtml(cell)}</td>`
              )
              .join('')}</tr>`
        )
        .join('');

      return `
        <div style="margin-bottom:20px;">
          <h3 style="margin:0 0 8px;color:#c62828;font-size:15px;">Place: ${escapeHtml(place)} (${rows.length})</h3>
          <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;">
            <thead>
              <tr>
                ${ABSENT_EXPORT_COLUMNS.map(
                  (col) =>
                    `<th style="border:1px solid #c62828;background:#d32f2f;color:#fff;padding:8px;font-size:12px;text-align:left;">${escapeHtml(col)}</th>`
                ).join('')}
              </tr>
            </thead>
            <tbody>${bodyRows}</tbody>
          </table>
        </div>`;
    })
    .join('');

  const emptyHtml =
    sectionsToRender.length === 0
      ? `<p style="text-align:center;color:#666;padding:24px;">No absent students for this date.</p>`
      : '';

  return `
    <div style="background:#fff;padding:24px;max-width:1100px;color:#111;">
      <h2 style="margin:0 0 6px;text-align:center;color:#c62828;font-size:22px;">Absent Students Report</h2>
      <p style="margin:0;text-align:center;font-size:14px;color:#333;">Date: ${escapeHtml(dateLabel)}</p>
      ${filterLine}
      <p style="margin:8px 0 16px;text-align:center;font-size:14px;font-weight:bold;">Total absent: ${totalAbsent}</p>
      ${sectionHtml || emptyHtml}
    </div>`;
};

const renderReportToCanvas = async (html) => {
  const host = document.createElement('div');
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;';
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    const target = host.firstElementChild;
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
    return canvas;
  } finally {
    document.body.removeChild(host);
  }
};

const triggerDownload = (dataUrl, fileName) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

/** One PNG with all places */
export async function downloadAbsentStudentsImageAll(params) {
  const report = buildAbsentStudentsReport(params);
  const html = buildReportHtml(report, { sections: 'all' });
  const canvas = await renderReportToCanvas(html);
  const fileName = `absent-students-${report.selectedDate}.png`;
  triggerDownload(canvas.toDataURL('image/png'), fileName);
  return fileName;
}

/** One PNG per place section */
export async function downloadAbsentStudentsImagesByPlace(params) {
  const report = buildAbsentStudentsReport(params);
  const downloaded = [];

  if (report.placeSections.length === 0) {
    const html = buildReportHtml(report, { sections: 'all' });
    const canvas = await renderReportToCanvas(html);
    const fileName = `absent-students-${report.selectedDate}.png`;
    triggerDownload(canvas.toDataURL('image/png'), fileName);
    return [fileName];
  }

  for (const section of report.placeSections) {
    const html = buildReportHtml(report, { sections: section.place });
    const canvas = await renderReportToCanvas(html);
    const fileName = `absent-students-${report.selectedDate}-${slugify(section.place)}.png`;
    triggerDownload(canvas.toDataURL('image/png'), fileName);
    downloaded.push(fileName);
    await new Promise((resolve) => setTimeout(resolve, 400));
  }

  return downloaded;
}

/** @deprecated use downloadAbsentStudentsPdf */
export function generateAbsentStudentsPdf(params) {
  return downloadAbsentStudentsPdf(params);
}
