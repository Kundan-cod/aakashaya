// Pipeline stage definitions
export const PIPELINE_STAGES = [
  { id: 'acquire',    label: 'Infrared Acquisition',  model: 'IR-MWIR Sensor Driver',    durationMs: 700,  weight: 0.08, events: ['Buffering raw signal', 'Decoding frame metadata', 'Validating checksum'] },
  { id: 'preprocess', label: 'Signal Processing',     model: 'Calibration Pipeline',     durationMs: 900,  weight: 0.10, events: ['Removing noise floor', 'Correcting radiometric bias', 'Normalizing gain'] },
  { id: 'enhance',    label: 'Image Enhancement',     model: 'SwinIR-M',                 durationMs: 1500, weight: 0.20, events: ['Loading pretrained weights', 'Deconvolving optics', 'Reconstructing high-frequency detail'] },
  { id: 'superres',   label: 'Super Resolution',      model: 'SwinIR-SR (4×)',           durationMs: 1200, weight: 0.15, events: ['Upscaling to 4× resolution', 'Refining texture priors', 'Sharpening edges'] },
  { id: 'colorize',   label: 'RGB Colorization',      model: 'Pix2Pix-IR',               durationMs: 1300, weight: 0.16, events: ['Inferring thermal-to-RGB mapping', 'Matching color palette', 'Stabilizing hue distribution'] },
  { id: 'segment',    label: 'Semantic Intelligence', model: 'SegFormer-B4',             durationMs: 1100, weight: 0.14, events: ['Computing attention maps', 'Generating class logits', 'Refining boundaries'] },
  { id: 'detect',     label: 'Object Interpretation', model: 'YOLOv8-L',                 durationMs: 800,  weight: 0.10, events: ['Scanning tile grid', 'Computing bounding boxes', 'Filtering low-confidence detections'] },
  { id: 'report',     label: 'Earth Intelligence Report', model: 'CLIP-Vision + Synthesizer', durationMs: 600, weight: 0.07, events: ['Encoding scene semantics', 'Generating interpretation', 'Assembling report artifacts'] },
];