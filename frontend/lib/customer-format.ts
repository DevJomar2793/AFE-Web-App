export function formatCustomerName(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function sanitizeCustomerNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}
