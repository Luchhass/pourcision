function write(level, message, meta) {
  const payload = meta ? ` ${JSON.stringify(meta)}` : "";
  const line = `[pourcision:${level}] ${message}${payload}`;

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  error: (message, meta) => write("error", message, meta),
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
};
