import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format, parseISO } from 'date-fns';

const KNOWN_PLACES = ['Kandrika', 'Krishna Lanka', 'Gandhiji Conly'];
const PLACE_SECTION_ORDER = [...KNOWN_PLACES, 'Other', 'Unknown'];

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
  if (selectedPlace === 'Other') {
    return !KNOWN_PLACES.includes(loc);
  }
  return loc === selectedPlace;
};

/**
 * @param {Object} params
 * @param {Array} params.students - all student docs from Firestore
 * @param {string} params.selectedDate - yyyy-MM-dd
 * @param {string} params.selectedClass
 * @param {string} params.selectedPlace
 */
export function generateAbsentStudentsPdf({ students, selectedDate, selectedClass, selectedPlace }) {
  const dateLabel = (() => {
    try {
      return format(parseISO(selectedDate), 'dd MMM yyyy');
    } catch {
      return selectedDate;
    }
  })();

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

  const placeSections = PLACE_SECTION_ORDER.filter((place) => byPlace.has(place)).map((place) => ({
    place,
    students: byPlace.get(place).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  }));

  const totalAbsent = filtered.length;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
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

  const tableHead = [['S.No.', 'Student Name', 'Date', 'Father Name', 'Mother Name', 'Phone Number']];

  placeSections.forEach(({ place, students: placeStudents }, sectionIndex) => {
    if (startY > pageHeight - 40) {
      doc.addPage();
      startY = margin;
    }

    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(`Place: ${place} (${placeStudents.length})`, margin, startY);
    doc.setFont(undefined, 'normal');
    startY += 7;

    const rows = placeStudents.map((student, index) => [
      index + 1,
      student.name || '-',
      dateLabel,
      student.fatherName || '-',
      student.motherName || '-',
      getStudentPhone(student) || '-'
    ]);

    autoTable(doc, {
      startY,
      head: tableHead,
      body: rows,
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [211, 47, 47], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 38 },
        2: { cellWidth: 24 },
        3: { cellWidth: 32 },
        4: { cellWidth: 32 },
        5: { cellWidth: 28 }
      },
      margin: { left: margin, right: margin },
      didDrawPage: (data) => {
        startY = data.cursor.y;
      }
    });

    startY = (doc.lastAutoTable?.finalY ?? startY) + (sectionIndex < placeSections.length - 1 ? 10 : 4);
  });

  if (placeSections.length === 0) {
    autoTable(doc, {
      startY: 42,
      head: tableHead,
      body: [['-', 'No absent students', dateLabel, '-', '-', '-']],
      styles: { fontSize: 9, cellPadding: 2.5 },
      headStyles: { fillColor: [211, 47, 47], textColor: 255, fontStyle: 'bold' },
      margin: { left: margin, right: margin }
    });
  }

  const fileName = `absent-students-${selectedDate}.pdf`;
  doc.save(fileName);
  return fileName;
}
