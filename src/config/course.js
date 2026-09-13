/**
 * ============================================================================
 *  COURSE CONFIGURATION  —  THE ONLY PLACE VIDEO IDs LIVE
 * ============================================================================
 *
 *  To swap in the real course footage later, edit `youtubeId` (and, optionally,
 *  `title` / `summary`) in the array below. Nothing else in the app needs to
 *  change — every other module reads its video ID from here.
 *
 *  `youtubeId` is the 11-character ID from a YouTube watch URL:
 *      https://www.youtube.com/watch?v=aqz-KE-bpKQ
 *                                     ^^^^^^^^^^^  <- this part
 *
 *  `estimatedDuration` (seconds) is only used as a placeholder for the
 *  denominator of the overall progress bar *until* the real duration is read
 *  from the YouTube player. Once a learner opens a module, the true duration is
 *  recorded and the estimate is discarded. Keeping an estimate here means the
 *  overall percentage is meaningful from the very first visit.
 *
 *  NOTE: the videos currently listed are public, embeddable stand-ins. They do
 *  not match the module topics — they exist purely so the player and the
 *  watch-time tracking can be exercised end to end.
 * ============================================================================
 */

export const BRAND_NAME = 'RDRS Learning Portal'
export const COURSE_TITLE = 'Safeguarding Training for New Employees'
export const COURSE_SUBTITLE =
  'An onboarding course on safeguarding policy, recognising risk, and reporting procedures.'

/** Overall completion required before the certificate unlocks. */
export const COMPLETION_THRESHOLD = 0.8

export const COURSE_MODULES = [
  {
    id: 'm01',
    title: 'Welcome & Course Introduction',
    summary:
      'What this course covers, why safeguarding matters from day one, and how to get the most out of the eleven modules.',
    youtubeId: 'M7lc1UVf-VE',
    estimatedDuration: 245,
  },
  {
    id: 'm02',
    title: 'What Is Safeguarding?',
    summary:
      'Core definitions, the difference between safeguarding and child protection, and the principles that underpin our approach.',
    youtubeId: 'aqz-KE-bpKQ',
    estimatedDuration: 600,
  },
  {
    id: 'm03',
    title: 'Recognizing Signs of Harm',
    summary:
      'Physical, behavioural and environmental indicators of abuse or neglect, and how to distinguish a concern from a certainty.',
    youtubeId: 'YE7VzlLtp-4',
    estimatedDuration: 545,
  },
  {
    id: 'm04',
    title: "Our Organization's Safeguarding Policy",
    summary:
      'A walkthrough of the policy document, the standards it sets, and what it requires of every member of staff.',
    youtubeId: 'eRsGyueVLvQ',
    estimatedDuration: 888,
  },
  {
    id: 'm05',
    title: 'Roles & Responsibilities',
    summary:
      'Who does what: your duties as an employee, the role of the designated safeguarding lead, and lines of accountability.',
    youtubeId: 'R6MlUcmOul8',
    estimatedDuration: 734,
  },
  {
    id: 'm06',
    title: 'How to Report a Concern',
    summary:
      'The reporting pathway step by step — what to record, who to tell, and the timescales you must work to.',
    youtubeId: 'TLkA0RELQ1g',
    estimatedDuration: 654,
  },
  {
    id: 'm07',
    title: 'Confidentiality & Information Sharing',
    summary:
      'Handling sensitive information responsibly, when confidentiality yields to safeguarding, and lawful information sharing.',
    youtubeId: 'Y-rmzh0PI3c',
    estimatedDuration: 734,
  },
  {
    id: 'm08',
    title: 'Working With Vulnerable Groups',
    summary:
      'Good practice when supporting children, young people and adults at risk, including professional boundaries.',
    youtubeId: 'WhWc3b3KhnY',
    estimatedDuration: 452,
  },
  {
    id: 'm09',
    title: 'Online Safety & Digital Conduct',
    summary:
      'Digital safeguarding: appropriate communication channels, social media conduct, and protecting data online.',
    youtubeId: 'jNQXAC9IVRw',
    estimatedDuration: 60,
  },
  {
    id: 'm10',
    title: 'Case Studies & Scenarios',
    summary:
      'Worked examples that test your judgement, from the first niggling concern through to a full referral.',
    youtubeId: '9bZkp7q19f0',
    estimatedDuration: 253,
  },
  {
    id: 'm11',
    title: 'Course Recap & Next Steps',
    summary:
      'A consolidation of the key points, your ongoing responsibilities, and where to go for further support.',
    youtubeId: 'dQw4w9WgXcQ',
    estimatedDuration: 213,
  },
]

/** Convenience: total of the fallback estimates, in seconds. */
export const ESTIMATED_TOTAL_SECONDS = COURSE_MODULES.reduce(
  (sum, m) => sum + m.estimatedDuration,
  0,
)

export function getModuleById(id) {
  return COURSE_MODULES.find((m) => m.id === id) || null
}
