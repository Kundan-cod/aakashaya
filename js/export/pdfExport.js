// Export report to PDF using jsPDF
import { formatTimestamp } from '../utils/format.js';

function setFill(doc, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  doc.setFillColor(r, g, b);
}
function setText(doc, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  doc.setTextColor(r, g, b);
}
function setDraw(doc, hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  doc.setDrawColor(r, g, b);
}

export async function exportReportToPdf(report, filename = 'aakshaya-report.pdf') {
  const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
  if (!jsPDF) throw new Error('jsPDF unavailable');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header
  setFill(doc, '#020617');
  doc.rect(0, 0, W, 100, 'F');
  setText(doc, '#00f0ff');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('AAKASHAYA — Earth Intelligence Report', 40, 50);
  setText(doc, '#9bb0d1');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Report ID: ${report.id}    •    Generated: ${formatTimestamp(new Date(report.generatedAt))}`, 40, 70);
  doc.text(`Mission: ${report.metadata.mission}    •    Satellite: ${report.metadata.satellite} (${report.metadata.satelliteId})`, 40, 86);

  y = 130;

  // Metadata
  doc.setTextColor(20, 20, 30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Mission Metadata', 40, y); y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const metaRows = [
    ['Sensor', report.metadata.sensor],
    ['Orbit', report.metadata.orbit],
    ['Region', `${report.metadata.coordinates.region} (${report.metadata.coordinates.lat.toFixed(2)}, ${report.metadata.coordinates.lon.toFixed(2)})`],
    ['Capture Time', formatTimestamp(new Date(report.metadata.captureTime))],
    ['Processing Time', `${report.metadata.processingTime}s`],
    ['Input File', `${report.metadata.inputFile.name} (${(report.metadata.inputFile.size / 1024).toFixed(1)} KB)`],
  ];
  metaRows.forEach(([k, v]) => {
    setText(doc, '#5a6b8a'); doc.text(k, 50, y);
    setText(doc, '#0f172a'); doc.text(String(v), 160, y);
    y += 14;
  });

  y += 8;
  // Quality metrics
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  setText(doc, '#020617'); doc.text('Quality Metrics', 40, y); y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const q = report.quality;
  const qRows = [
    ['PSNR', `${q.psnr} dB`],
    ['SSIM', q.ssim.toFixed(3)],
    ['FID', q.fid.toFixed(1)],
    ['Inference Time', `${q.inferenceTimeMs} ms`],
    ['AI Confidence', `${(report.confidence * 100).toFixed(1)}%`],
  ];
  qRows.forEach(([k, v]) => {
    setText(doc, '#5a6b8a'); doc.text(k, 50, y);
    setText(doc, '#0f172a'); doc.text(v, 160, y);
    y += 14;
  });

  y += 8;
  // Land cover
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Detected Land Cover', 40, y); y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  report.landCover.forEach((lc) => {
    setFill(doc, lc.color);
    doc.rect(50, y - 8, 10, 10, 'F');
    setText(doc, '#0f172a'); doc.text(`${lc.class}`, 70, y);
    setText(doc, '#0f172a'); doc.text(`${lc.percent.toFixed(1)}%`, 200, y);
    y += 14;
  });

  y += 8;
  if (y > 720) { doc.addPage(); y = 40; }

  // Detections
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('Detected Objects', 40, y); y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  report.detections.forEach((d) => {
    setText(doc, '#0f172a'); doc.text(`• ${d.type}`, 50, y);
    setText(doc, '#059669'); doc.text(`${(d.confidence * 100).toFixed(1)}%`, 200, y);
    y += 13;
    if (y > 770) { doc.addPage(); y = 40; }
  });

  y += 8;
  if (y > 720) { doc.addPage(); y = 40; }
  doc.setFont('helvetica', 'bold'); doc.setFontSize(13);
  doc.text('AI Interpretation', 40, y); y += 16;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  const lines = doc.splitTextToSize(report.interpretation, W - 80);
  doc.text(lines, 40, y);

  // Footer
  const pages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    setText(doc, '#94a3b8');
    doc.setFontSize(8);
    doc.text(`AAKASHAYA Mission Control — ${formatTimestamp(new Date())} — Page ${p} of ${pages}`, 40, 820);
  }

  doc.save(filename);
  return filename;
}