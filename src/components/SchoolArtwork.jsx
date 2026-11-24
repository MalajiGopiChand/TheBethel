import React from 'react';

// Isolated artwork from the user's references. Source screens and their student
// data are not shipped. Each small illustration has its own local image asset.
const regions = {
  hero: [941, 209], portrait: [100, 91], books: [120, 65],
  gift: [154, 88], giftHeader: [123, 85], students: [81, 65],
  present: [71, 66], absent: [71, 64], clipboard: [64, 65],
};
export default function SchoolArtwork({ name, className = '', style = {} }) {
  const kind = regions[name] ? name : 'clipboard';
  const [width, height] = regions[kind];
  const [sheetWidth, sheetHeight] = kind === 'hero' ? [941, 209] : [320, 240];
  return <span aria-hidden="true" className={`school-art school-art--${name} ${className}`} style={{ aspectRatio: `${width} / ${height}`, ...style }}>
    <img src={`/art/${kind}.jpg`} alt="" draggable="false" decoding="async" style={{ width: `${sheetWidth / width * 100}%`, height: `${sheetHeight / height * 100}%`, left: 0, top: 0 }} />
  </span>;
}
