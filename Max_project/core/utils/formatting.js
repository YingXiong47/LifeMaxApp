export function toPercent(value) {
  return `${Math.round(value * 100)}%`;
}

export function formatTone(style, intensity, text) {
  const prefixes = {
    direct: intensity === "intensive" ? "Execute:" : "Do:",
    supportive: intensity === "intensive" ? "Lean into:" : "Start with:",
    analytical: intensity === "intensive" ? "Measure and improve:" : "Track and adjust:"
  };
  return `${prefixes[style] || "Do:"} ${text}`;
}

export function listToSentence(items) {
  return items.filter(Boolean).join(", ");
}
