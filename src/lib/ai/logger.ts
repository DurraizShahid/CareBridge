type LogLevel = "info" | "warn" | "error" | "debug";

interface AILogEvent {
  event: string;
  level: LogLevel;
  timestamp: string;
  requestId?: string;
  duration?: number;
  userId?: string;
  organizationId?: string;
  model?: string;
  provider?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  toolCalls?: number;
  toolName?: string;
  errorCode?: string;
  errorMessage?: string;
  messageCount?: number;
  round?: number;
}

const PII_FIELDS = new Set([
  "content", "messages", "args", "arguments", "query",
  "patientName", "patientId", "mrn", "diagnosis",
  "firstName", "lastName", "email", "phone",
]);

function sanitize(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (PII_FIELDS.has(key)) {
      result[key] = "[REDACTED]";
    } else if (Array.isArray(value)) {
      result[key] = value.map((item) =>
        item !== null && typeof item === "object"
          ? sanitize(item as Record<string, unknown>)
          : item
      );
    } else if (value !== null && typeof value === "object") {
      result[key] = sanitize(value as Record<string, unknown>);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export function logAIEvent(event: string, data: Partial<AILogEvent> = {}): void {
  const entry: AILogEvent = {
    event,
    level: data.level ?? "info",
    timestamp: new Date().toISOString(),
    ...data,
  };

  const line = JSON.stringify(sanitize(entry as unknown as Record<string, unknown>));

  switch (entry.level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    case "debug":
      console.debug(line);
      break;
    default:
      console.log(line);
  }
}

export function logAIError(
  event: string,
  error: unknown,
  context: Partial<AILogEvent> = {},
): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errCode = error instanceof Error ? error.name : "UNKNOWN";
  logAIEvent(event, {
    level: "error",
    errorCode: errCode,
    errorMessage: errMsg,
    ...context,
  });
}
