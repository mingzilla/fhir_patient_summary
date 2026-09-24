/**
 * What the placeholder row says while a patient is being fetched into the record.
 *
 * Counts down, then stops counting. Adding a patient takes fifteen to twenty seconds, so a
 * ten-second countdown will always run out before the patient arrives - and a number that
 * carries on past zero, or wraps, would be a progress bar that lies about progress. Once the
 * estimate is spent it says it is still working, which is the truth.
 *
 * Pure, and the elapsed time arrives as an argument: what the text is, and what time it is,
 * are different questions, and only the first one is worth testing.
 */
export const COUNTDOWN_SECONDS = 20;

export function countdown_text(elapsed_seconds, total_seconds = COUNTDOWN_SECONDS) {
  const whole = Math.floor(Number.isFinite(elapsed_seconds) ? Math.max(0, elapsed_seconds) : 0);
  const left = total_seconds - whole;
  return left > 0 ? `${left}s` : 'still working';
}
