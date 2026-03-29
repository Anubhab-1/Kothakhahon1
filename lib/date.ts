const defaultDateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function formatDisplayDate(input?: string, fallback = "Date not specified") {
  if (!input) {
    return fallback;
  }

  const parsed = Date.parse(input);
  if (Number.isNaN(parsed)) {
    return input;
  }

  return defaultDateFormatter.format(new Date(parsed));
}

