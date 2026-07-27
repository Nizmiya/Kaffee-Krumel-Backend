/** Escape user input for safe use inside MongoDB $regex patterns. */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
