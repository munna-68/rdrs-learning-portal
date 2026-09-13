import { forwardRef } from 'react'
import { BRAND_NAME, COURSE_TITLE } from '../config/course'
import {
  CERTIFICATE_HEIGHT_PX,
  CERTIFICATE_WIDTH_PX,
  certificateReference,
} from '../lib/certificate'
import { formatLongDate } from '../lib/progress'

/**
 * The certificate, authored as real DOM at exactly landscape-A4 proportions
 * (1123 × 794 px at 96dpi). It stays mounted off-screen so the PDF generator
 * always has a laid-out node to rasterise.
 *
 * Everything here is deliberately plain: flat hex colours, simple borders, no
 * shadows or gradients, and system fonts. That keeps the rasteriser honest and
 * means the PDF looks identical in every browser.
 */

const ACCENT = '#4f46e5'
const ACCENT_SOFT = '#eef2ff'
const INK = '#0f172a'
const MUTED = '#64748b'
const HAIRLINE = '#e2e8f0'
const FRAME = '#d8dce5'

const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
const FONT_SERIF = 'Georgia, Cambria, "Times New Roman", serif'

function CornerAccents() {
  const base = { position: 'absolute', width: 26, height: 26, borderColor: ACCENT }
  return (
    <>
      <div
        style={{
          ...base,
          top: 14,
          left: 14,
          borderTop: `3px solid ${ACCENT}`,
          borderLeft: `3px solid ${ACCENT}`,
        }}
      />
      <div
        style={{
          ...base,
          top: 14,
          right: 14,
          borderTop: `3px solid ${ACCENT}`,
          borderRight: `3px solid ${ACCENT}`,
        }}
      />
      <div
        style={{
          ...base,
          bottom: 14,
          left: 14,
          borderBottom: `3px solid ${ACCENT}`,
          borderLeft: `3px solid ${ACCENT}`,
        }}
      />
      <div
        style={{
          ...base,
          bottom: 14,
          right: 14,
          borderBottom: `3px solid ${ACCENT}`,
          borderRight: `3px solid ${ACCENT}`,
        }}
      />
    </>
  )
}

function ShieldSeal() {
  return (
    <svg width="78" height="78" viewBox="0 0 78 78" role="img" aria-label="Certification seal">
      <circle cx="39" cy="39" r="37" fill={ACCENT_SOFT} />
      <circle cx="39" cy="39" r="37" fill="none" stroke={ACCENT} strokeWidth="1.25" />
      <circle cx="39" cy="39" r="31" fill="none" stroke="#c7d2fe" strokeWidth="1" />
      <path
        d="M39 20.5 L53.5 26.5 V39 C53.5 47.4 47.3 54.2 39 57.8 C30.7 54.2 24.5 47.4 24.5 39 V26.5 Z"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M32 38.8 L36.8 43.6 L46.4 33.6"
        fill="none"
        stroke={ACCENT}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const CertificateTemplate = forwardRef(function CertificateTemplate(
  { learnerName, completionDate },
  ref,
) {
  const name = (learnerName || '').trim() || 'Learner Name'
  const dateLabel = formatLongDate(completionDate)
  const reference = certificateReference(name, completionDate)

  return (
    <div
      ref={ref}
      style={{
        width: CERTIFICATE_WIDTH_PX,
        height: CERTIFICATE_HEIGHT_PX,
        boxSizing: 'border-box',
        background: '#ffffff',
        padding: 36,
        fontFamily: FONT_SANS,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${FRAME}`,
          padding: '44px 56px 40px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        }}
      >
        <CornerAccents />

        <ShieldSeal />

        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.36em',
            textTransform: 'uppercase',
            color: MUTED,
          }}
        >
          {BRAND_NAME}
        </div>

        <div
          style={{
            width: 54,
            height: 3,
            background: ACCENT,
            borderRadius: 2,
            marginTop: 16,
          }}
        />

        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 40,
            lineHeight: 1.15,
            color: INK,
            marginTop: 20,
          }}
        >
          Certificate of Completion
        </div>

        <div style={{ fontSize: 14, color: MUTED, marginTop: 24 }}>
          This is to certify that
        </div>

        <div
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 54,
            lineHeight: 1.15,
            color: ACCENT,
            marginTop: 12,
            maxWidth: 860,
            overflowWrap: 'break-word',
          }}
        >
          {name}
        </div>

        <div style={{ width: 320, height: 1, background: HAIRLINE, marginTop: 20 }} />

        <div style={{ fontSize: 14, color: MUTED, marginTop: 20 }}>
          has successfully completed the course
        </div>

        <div
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: '-0.01em',
            color: INK,
            marginTop: 10,
            maxWidth: 800,
          }}
        >
          {COURSE_TITLE}
        </div>

        <div style={{ fontSize: 13, color: MUTED, marginTop: 22 }}>
          Completed on {dateLabel}
        </div>

        <div
          style={{
            position: 'absolute',
            left: 56,
            right: 56,
            bottom: 34,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <div style={{ width: 190, borderTop: `1px solid ${FRAME}`, paddingTop: 7 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>
                Learning &amp; Development
              </div>
              <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>
                Issuing department
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 10, letterSpacing: '0.1em', color: '#94a3b8' }}>
            {reference}
          </div>
        </div>
      </div>
    </div>
  )
})

export default CertificateTemplate
