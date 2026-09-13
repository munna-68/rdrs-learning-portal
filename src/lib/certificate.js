/**
 * Client-side certificate export.
 *
 * There is no server and no headless browser, so the approach is:
 *   1. a fully styled certificate is kept mounted (off-screen) as real DOM,
 *   2. html2canvas rasterises it to a canvas at 2x for crisp text,
 *   3. jsPDF drops that image onto a single landscape A4 page,
 *   4. `pdf.save()` triggers a normal browser download.
 *
 * `html2canvas-pro` (rather than plain html2canvas) is used because it
 * understands modern CSS colour spaces such as `oklch`, which the browser
 * itself may compute for any colour that passes through Tailwind.
 *
 * The two PDF libraries are ~600 kB combined and are only ever needed when a
 * learner actually clicks "Download certificate", so they are pulled in with a
 * dynamic `import()` and land in their own chunks. The initial page load stays
 * small; the download just waits a moment for the chunks to arrive.
 */

/** Landscape A4 at 96dpi — the certificate template is authored at this size. */
export const CERTIFICATE_WIDTH_PX = 1123
export const CERTIFICATE_HEIGHT_PX = 794

/** "Jane Doe" -> "Jane-Doe-Certificate.pdf" */
export function certificateFileName(learnerName) {
  const slug = String(learnerName || '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^A-Za-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return `${slug || 'Learner'}-Certificate.pdf`
}

/** A short, stable-looking reference derived from the name and date. */
export function certificateReference(learnerName, iso) {
  const source = `${learnerName || ''}|${iso || ''}`
  let hash = 0
  for (let i = 0; i < source.length; i += 1) {
    hash = (hash * 31 + source.charCodeAt(i)) >>> 0
  }
  return `RDRS-${hash.toString(36).toUpperCase().padStart(6, '0').slice(0, 6)}`
}

export async function downloadCertificatePdf(node, learnerName) {
  if (!node) throw new Error('Certificate template is not mounted.')

  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([
    import('jspdf'),
    import('html2canvas-pro'),
  ])

  // Make sure webfonts have settled before rasterising.
  if (document.fonts && typeof document.fonts.ready?.then === 'function') {
    try {
      await document.fonts.ready
    } catch {
      /* non-fatal */
    }
  }

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    logging: false,
    useCORS: true,
    width: CERTIFICATE_WIDTH_PX,
    height: CERTIFICATE_HEIGHT_PX,
    windowWidth: CERTIFICATE_WIDTH_PX,
    windowHeight: CERTIFICATE_HEIGHT_PX,
  })

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    compress: true,
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()

  // The template and a landscape A4 sheet share the same aspect ratio
  // (1123/794 ≈ 297/210), so a full-bleed placement introduces no distortion.
  pdf.addImage(
    canvas.toDataURL('image/jpeg', 0.95),
    'JPEG',
    0,
    0,
    pageWidth,
    pageHeight,
    undefined,
    'FAST',
  )

  const fileName = certificateFileName(learnerName)
  pdf.save(fileName)
  return fileName
}
