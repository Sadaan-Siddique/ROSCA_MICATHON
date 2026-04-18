import { useSyncExternalStore } from "react";
import { DEMO_USERS, userStore, type DemoUser } from "@/lib/mock-data";

export function useCurrentUser(): DemoUser {
  const id = useSyncExternalStore(
    userStore.subscribe,
    userStore.getSnapshot,
    userStore.getSnapshot,
  );
  return DEMO_USERS.find((u) => u.id === id) ?? DEMO_USERS[0];
}
