/**
 * Maps mastery percentage to UK grade.
 * @param {number} percent - Mastery percentage (0-100)
 * @param {string} qualType - Qualification type ('G91' for GCSE 9-1, 'AL' for A-Level)
 * @returns {string} Grade string
 */
export function masteryPercentToGrade(percent, qualType = 'G91') {
  if (qualType === 'G91') {
    // GCSE 9-1 grade boundaries (approximate)
    if (percent >= 90) return '9';
    if (percent >= 80) return '8';
    if (percent >= 70) return '7';
    if (percent >= 60) return '6';
    if (percent >= 50) return '5';
    if (percent >= 40) return '4';
    if (percent >= 30) return '3';
    if (percent >= 20) return '2';
    if (percent >= 10) return '1';
    return 'U';
  }
  // A-Level
  if (percent >= 80) return 'A*';
  if (percent >= 70) return 'A';
  if (percent >= 60) return 'B';
  if (percent >= 50) return 'C';
  if (percent >= 40) return 'D';
  if (percent >= 30) return 'E';
  return 'U';
}
