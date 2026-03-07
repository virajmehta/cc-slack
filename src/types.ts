/** Input passed to a PreToolUse hook via stdin */
export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

/** Output returned from a PreToolUse hook via stdout */
export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    permissionDecision?: "allow" | "deny" | "ask";
  };
}

/** Reaction poll result */
export type ReactionDecision = "approved" | "denied" | "pending";
