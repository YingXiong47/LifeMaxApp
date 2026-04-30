export function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

export function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function scoreCompleteness(values) {
  if (!values.length) {
    return 0;
  }
  const completed = values.filter((value) => {
    if (typeof value === "boolean") {
      return value;
    }
    return value !== undefined && value !== null && value !== "";
  }).length;
  return clamp(completed / values.length);
}
