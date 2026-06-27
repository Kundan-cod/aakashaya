// Export report to CSV
function csvEscape(v) {
  if (v == null) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function exportReportToCsv(report, filename = 'aakshaya-report.csv') {
  const rows = [];
  rows.push(['Section', 'Field', 'Value']);
  // Metadata
  rows.push(['Metadata', 'Report ID', report.id]);
  rows.push(['Metadata', 'Generated At', report.generatedAt]);
  rows.push(['Metadata', 'Mission', report.metadata.mission]);
  rows.push(['Metadata', 'Satellite', `${report.metadata.satellite} (${report.metadata.satelliteId})`]);
  rows.push(['Metadata', 'Sensor', report.metadata.sensor]);
  rows.push(['Metadata', 'Orbit', report.metadata.orbit]);
  rows.push(['Metadata', 'Region', report.metadata.coordinates.region]);
  rows.push(['Metadata', 'Latitude', report.metadata.coordinates.lat]);
  rows.push(['Metadata', 'Longitude', report.metadata.coordinates.lon]);
  rows.push(['Metadata', 'Capture Time', report.metadata.captureTime]);
  rows.push(['Metadata', 'Processing Time (s)', report.metadata.processingTime]);
  rows.push(['Metadata', 'Input File', report.metadata.inputFile.name]);
  rows.push(['Metadata', 'Input Size (bytes)', report.metadata.inputFile.size]);

  // Quality
  rows.push(['Quality', 'PSNR (dB)', report.quality.psnr]);
  rows.push(['Quality', 'SSIM', report.quality.ssim]);
  rows.push(['Quality', 'FID', report.quality.fid]);
  rows.push(['Quality', 'Inference Time (ms)', report.quality.inferenceTimeMs]);
  rows.push(['Quality', 'AI Confidence', report.confidence]);

  // Land cover
  report.landCover.forEach((lc) => rows.push(['Land Cover', lc.class, `${lc.percent.toFixed(2)}%`]));

  // Detections
  report.detections.forEach((d) => rows.push(['Detection', d.type, `${(d.confidence * 100).toFixed(1)}%`]));

  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return filename;
}