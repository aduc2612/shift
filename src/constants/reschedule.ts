export const RESCHEDULE_CONSTANTS = {
  /** How long the undo toast stays visible (ms) */
  UNDO_TIMEOUT_MS: 5000,

  /** Toast auto-dismiss duration (ms) */
  TOAST_DURATION_MS: 5000,

  /** Toast fade animation duration (ms) */
  TOAST_FADE_MS: 200,

  /** Templates for whatChanged field */
  WHAT_CHANGED: {
    AI_ENABLED: (name: string, aiContext?: string) =>
      aiContext
        ? `User enabled AI scheduling for task: ${name}. User instructions: ${aiContext}`
        : `User enabled AI scheduling for task: ${name}`,
    AI_DISABLED: (name: string) => `User disabled AI scheduling for task: ${name}`,
    AI_CONTEXT_CHANGED: (name: string, aiContext?: string) =>
      aiContext
        ? `User updated AI context for task: ${name}. User instructions: ${aiContext}`
        : `User updated AI context for task: ${name}`,
    NEW_AI_TASK: (name: string, aiContext?: string) =>
      aiContext
        ? `New task added: ${name}. User instructions: ${aiContext}`
        : `New task added: ${name}`,
  },
} as const;
