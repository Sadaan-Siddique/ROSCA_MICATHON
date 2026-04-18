import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { ApiUser } from "@/lib/api-types";
import { useCurrentUser } from "@/hooks/use-current-user";

export function useBackendUser() {
  const currentUser = useCurrentUser();
  const [backendUser, setBackendUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    api
      .post<ApiUser>("/auth/verify-otp", {
        phone: currentUser.phone,
        otp: "1234",
        name: currentUser.name
      })
      .then((response) => {
        if (!cancelled) {
          setBackendUser(response.data);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser.id, currentUser.name, currentUser.phone]);

  return { backendUser, loading };
}
