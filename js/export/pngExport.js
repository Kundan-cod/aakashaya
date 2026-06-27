// Export report node to PNG using html2canvas
export async function exportNodeToPng(node, filename = 'aakshaya-report.png') {
  if (!window.html2canvas) throw new Error('html2canvas unavailable');
  const canvas = await window.html2canvas(node, {
    backgroundColor: '#020617',
    scale: 2,
    useCORS: true,
    logging: false,
  });
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return filename;
}