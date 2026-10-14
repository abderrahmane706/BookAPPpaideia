import { useSyncExternalStore } from "react";
import { assistantConversation, type AssistantState } from "./store";

/** Reactive access to the shared assistant conversation. */
export function useAssistantConversation(): AssistantState {
  return useSyncExternalStore(
    assistantConversation.subscribe,
    assistantConversation.getSnapshot,
    assistantConversation.getServerSnapshot,
  );
}
