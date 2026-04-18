import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { DashboardSkeleton } from "../components/Skeleton";
import type { DashboardData } from "../types";
import { useAuth } from "../context/AuthContext";
import { TOAST_MESSAGES } from "../utils/toastMessages";

export function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setData(null);
      setError(null);
      return;
    }

    api
      .get<DashboardData>(`/dashboard/${user.id}`)
      .then((response) => {
        setData(response.data);
        setError(null);
      })
      .catch(() => {
        setError("Unable to load dashboard.");
        toast.error(TOAST_MESSAGES.dashboard.loadError);
      });
  }, [user?.id]);

  if (!user) {
    return <p className="card">Please sign in first.</p>;
  }

  if (error) {
    return <p className="card error">{error}</p>;
  }

  if (!data) {
    return <DashboardSkeleton />;
  }

  return (
    <section className="stack">
      <article className="card">
        <h2>Overview</h2>
        <p>You are in {data.committees.length} committee(s).</p>
        <p>Pending contributions: {data.pendingContributions}</p>
        <p>
          Next payout cycle: {data.nextPayout ? `${data.nextPayout.cycleNumber} (${data.nextPayout.committee.name})` : "N/A"}
        </p>
      </article>

      <article className="card">
        <h2>Your Committees</h2>
        {data.committees.length === 0 ? (
          <p>No committees joined yet.</p>
        ) : (
          data.committees.map((item) => (
            <Link key={item.committee.id} to={`/committees/${item.committee.id}`} className="list-item">
              <span>{item.committee.name}</span>
              <span>Rs {item.committee.contributionAmount}</span>
            </Link>
          ))
        )}
      </article>
    </section>
  );
}
