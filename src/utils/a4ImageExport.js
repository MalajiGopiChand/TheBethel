import html2canvas from 'html2canvas';

/** A4 portrait at 96 DPI — fixed canvas size for print-like pages */
export const A4_WIDTH = 794;
export const A4_HEIGHT = 1123;

export const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Split table rows into A4-sized pages.
 * @param {Array<{ place: string, rows: any[][] }>} sections
 */
export function paginateSections(sections, { rowsOnFirstPage = 20, rowsOnNextPage = 24 } = {}) {
  const pages = [];
  let isFirstPage = true;

  sections.forEach(({ place, rows }) => {
    let offset = 0;
    let part = 0;

    while (offset < rows.length) {
      const headerCost = isFirstPage ? 2 : part === 0 ? 1 : 0;
      const capacity = Math.max(
        1,
        (isFirstPage ? rowsOnFirstPage : rowsOnNextPage) - headerCost
      );
      const chunk = rows.slice(offset, offset + capacity);

      pages.push({
        place,
        rows: chunk,
        showReportHeader: isFirstPage,
        showPlaceHeader: part === 0,
        rowNumberStart: offset
      });

      offset += chunk.length;
      part += 1;
      isFirstPage = false;
    }
  });

  return pages;
}

export const wrapA4Page = (innerHtml, pageNum, totalPages) => `
  <div style="
    width:${A4_WIDTH}px;
    height:${A4_HEIGHT}px;
    box-sizing:border-box;
    padding:28px 24px 20px;
    background:#fff;
    color:#111;
    font-family:Arial,sans-serif;
    display:flex;
    flex-direction:column;
    overflow:hidden;
  ">
    <div style="flex:1;overflow:hidden;">${innerHtml}</div>
    <div style="text-align:center;font-size:11px;color:#888;margin-top:8px;">
      Page ${pageNum} of ${totalPages}
    </div>
  </div>`;

export const renderTableSection = ({
  columns,
  rows,
  place,
  showPlaceHeader,
  headerColor = '#1976d2',
  borderColor = '#1565c0',
  rowNumberStart = 0,
  renumberSerial = false
}) => {
  const bodyRows = rows
    .map((row, i) => {
      const cells = renumberSerial && row.length > 0
        ? [rowNumberStart + i + 1, ...row.slice(1)]
        : row;
      return `<tr>${cells
        .map(
          (cell, colIndex) =>
            `<td style="border:1px solid #ddd;padding:7px 8px;font-size:12px;line-height:1.3;${colIndex === 0 ? 'text-align:center;width:42px;' : ''}">${escapeHtml(cell)}</td>`
        )
        .join('')}</tr>`;
    })
    .join('');

  const placeBlock = showPlaceHeader
    ? `<h3 style="margin:0 0 8px;color:${borderColor};font-size:15px;">Place: ${escapeHtml(place)}</h3>`
    : `<p style="margin:0 0 8px;color:#666;font-size:12px;">Place: ${escapeHtml(place)} (continued)</p>`;

  return `
    ${placeBlock}
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr>
          ${columns.map(
            (col) =>
              `<th style="border:1px solid ${borderColor};background:${headerColor};color:#fff;padding:8px;font-size:11px;text-align:left;">${escapeHtml(col)}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>${bodyRows}</tbody>
    </table>`;
};

export const renderA4PageToCanvas = async (html) => {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-10000px;top:0;z-index:-1;pointer-events:none;';
  host.innerHTML = html;
  document.body.appendChild(host);

  try {
    return await html2canvas(host.firstElementChild, {
      scale: 2,
      width: A4_WIDTH,
      height: A4_HEIGHT,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false
    });
  } finally {
    document.body.removeChild(host);
  }
};

export const triggerDownload = (dataUrl, fileName) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

/** @param {(page, pageNum, totalPages) => string} renderPage */
export async function downloadA4Images({ pages, renderPage, fileBaseName }) {
  if (pages.length === 0) {
    const html = wrapA4Page(renderPage({ empty: true }, 1, 1), 1, 1);
    const canvas = await renderA4PageToCanvas(html);
    const fileName = `${fileBaseName}.png`;
    triggerDownload(canvas.toDataURL('image/png'), fileName);
    return [fileName];
  }

  const total = pages.length;
  const downloaded = [];

  for (let i = 0; i < total; i += 1) {
    const html = wrapA4Page(renderPage(pages[i], i + 1, total), i + 1, total);
    const canvas = await renderA4PageToCanvas(html);
    const suffix = total > 1 ? `-page-${i + 1}` : '';
    const fileName = `${fileBaseName}${suffix}.png`;
    triggerDownload(canvas.toDataURL('image/png'), fileName);
    downloaded.push(fileName);
    await delay(350);
  }

  return downloaded;
}
