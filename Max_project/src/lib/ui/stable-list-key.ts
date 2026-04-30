export function stableListKey(prefix: string, value: unknown, index: number) {
  const source =
    typeof value === "string"
      ? value
      : value && typeof value === "object"
        ? JSON.stringify(value)
        : String(value ?? "item");

  const normalized = source
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "")
    .slice(0, 48);

  return `${prefix}-${index}-${normalized || "item"}`;
}
