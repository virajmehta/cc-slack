export interface HookInput {
  tool_name: string;
  tool_input: Record<string, unknown>;
}

export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    permissionDecision?: "allow" | "deny" | "ask";
  };
}

export type ReactionDecision = "approved" | "denied" | "pending";
