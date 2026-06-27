// Image preview — load file, auto-resize if huge, return dataUrl + dims
export function createPreview(file, { maxDim = 2048 } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { naturalWidth: w, naturalHeight: h } = img;
      let dataUrl;
      if (w > maxDim || h > maxDim) {
        const scale = maxDim / Math.max(w, h);
        const cw = Math.round(w * scale);
        const ch = Math.round(h * scale);
        const c = document.createElement('canvas');
        c.width = cw; c.height = ch;
        const ctx = c.getContext('2d');
        ctx.drawImage(img, 0, 0, cw, ch);
        dataUrl = c.toDataURL('image/jpeg', 0.9);
        w = cw; h = ch;
      } else {
        dataUrl = url;
      }
      resolve({ dataUrl, width: w, height: h, name: file.name });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}