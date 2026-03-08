export interface HookInput {
  session_id: string;
  tool_name: string;
  tool_input: Record<string, unknown>;
  permission_mode?: string;
}

export interface HookOutput {
  hookSpecificOutput?: {
    hookEventName?: string;
    permissionDecision?: "allow" | "deny" | "ask";
  };
}

export type ReactionDecision = "approved" | "allow_all" | "denied" | "pending";
