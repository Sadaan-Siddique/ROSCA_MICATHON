import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { CommitteeSkeleton } from "../components/Skeleton";
import { useAuth } from "../context/AuthContext";
import type { Committee, CommitteeMember, Payout } from "../types";
import { TOAST_MESSAGES } from "../utils/toastMessages";

interface CommitteeDetailResponse extends Committee {
  members: CommitteeMember[];
}

interface CurrentCycleResponse {
  currentCycle: number;
  payout: Payout | null;
}

function validateInviteCode(value: string) {
  if (!value.trim()) return "Invite code is required.";
  if (!/^[A-Za-z0-9]{5,10}$/.test(value.trim())) return "Invite code must be 5-10 letters or numbers.";
  return "";
}

function validateCycleNumber(value: number) {
  if (!Number.isInteger(value) || value < 1) return "Cycle must be 1 or greater.";
  return "";
}

export function CommitteeDetailPage() {
  const { user } = useAuth();
  const { committeeId } = useParams();
  const [committee, setCommittee] = useState<CommitteeDetailResponse | null>(null);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [inviteCode, setInviteCode] = useState("");
  const [currentCycle, setCurrentCycle] = useState<CurrentCycleResponse | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [touched, setTouched] = useState({ inviteCode: false, cycleNumber: false });
  const [loadingCommittee, setLoadingCommittee] = useState(true);

  const inviteCodeError = validateInviteCode(inviteCode);
  const cycleError = validateCycleNumber(cycleNumber);

  useEffect(() => {
    if (!committeeId) return;
    setLoadingCommittee(true);
    Promise.all([
      api.get<CommitteeDetailResponse>(`/committees/${committeeId}`),
      api.get<CurrentCycleResponse>(`/committees/${committeeId}/current-cycle`)
    ])
      .then(([committeeResponse, currentCycleResponse]) => {
        setCommittee(committeeResponse.data);
        setCurrentCycle(currentCycleResponse.data);
        setCycleNumber(currentCycleResponse.data.currentCycle);
      })
      .catch(() => {
        toast.error(TOAST_MESSAGES.committee.loadDetailsError);
      })
      .finally(() => setLoadingCommittee(false));
  }, [committeeId]);

  if (!committeeId) return <p>Committee not found.</p>;
  if (loadingCommittee || !committee) return <CommitteeSkeleton />;

  async function joinCommittee() {
    if (!user?.id) return;
    setTouched((prev) => ({ ...prev, inviteCode: true }));
    if (inviteCodeError) return;

    try {
      await toast.promise(
        api.post(`/committees/${committeeId}/join`, { userId: user.id, inviteCode: inviteCode.trim() }),
        TOAST_MESSAGES.committee.join
      );
      const res = await api.get<CommitteeDetailResponse>(`/committees/${committeeId}`);
      setCommittee(res.data);
    } catch {
      // handled by toast.promise
    }
  }

  async function assignCyclePayout() {
    setTouched((prev) => ({ ...prev, cycleNumber: true }));
    if (cycleError) return;

    try {
      await toast.promise(
        api.post(`/committees/${committeeId}/cycles/${cycleNumber}/payouts/assign`),
        TOAST_MESSAGES.committee.assignPayout
      );
      const response = await api.get<CurrentCycleResponse>(`/committees/${committeeId}/current-cycle`);
      setCurrentCycle(response.data);
    } catch {
      // handled by toast.promise
    }
  }

  async function savePayoutOrder() {
    if (!committee) return;
    try {
      setSavingOrder(true);
      await toast.promise(
        api.patch(`/committees/${committee.id}/payout-order`, {
          members: committee.members.map((member) => ({
            userId: member.userId,
            payoutOrder: member.payoutOrder
          }))
        }),
        TOAST_MESSAGES.committee.payoutOrder
      );
    } catch {
      // handled by toast.promise
    } finally {
      setSavingOrder(false);
    }
  }

  function updateMemberOrder(memberId: string, newOrder: number) {
    if (!committee) return;
    setCommittee({
      ...committee,
      members: committee.members.map((member) => (member.id === memberId ? { ...member, payoutOrder: newOrder } : member))
    });
  }

  return (
    <section className="stack">
      <article className="card">
        <h2>{committee.name}</h2>
        <p>Contribution: Rs {committee.contributionAmount}</p>
        <p>Frequency: {committee.frequency}</p>
        <p>Invite code: {committee.inviteCode}</p>
        <p>Current cycle: {currentCycle?.currentCycle ?? "-"}</p>
        <p>Current cycle payout recipient: {currentCycle?.payout?.recipientId ?? "Not assigned"}</p>
      </article>

      <article className="card">
        <h3>Members & Payout Order</h3>
        {committee.members.map((member) => (
          <div key={member.id} className="list-item">
            <span>{member.user.name}</span>
            <input
              className="order-input"
              type="number"
              min={1}
              value={member.payoutOrder}
              onChange={(event) => updateMemberOrder(member.id, Number(event.target.value))}
            />
          </div>
        ))}
        <button onClick={savePayoutOrder} disabled={savingOrder}>
          {savingOrder ? "Saving..." : "Save payout order"}
        </button>
      </article>

      <article className="card stack">
        <h3>Join Committee</h3>
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
          onBlur={() => setTouched((prev) => ({ ...prev, inviteCode: true }))}
          placeholder="Invite code"
          className={touched.inviteCode && inviteCodeError ? "input-error" : ""}
        />
        {touched.inviteCode && inviteCodeError ? <p className="field-error">{inviteCodeError}</p> : null}
        <button onClick={joinCommittee} disabled={Boolean(inviteCodeError)}>
          Join as {user?.name ?? "user"}
        </button>
      </article>

      <article className="card stack">
        <h3>Current Cycle</h3>
        <input
          type="number"
          min={1}
          value={cycleNumber}
          onChange={(e) => setCycleNumber(Number(e.target.value))}
          onBlur={() => setTouched((prev) => ({ ...prev, cycleNumber: true }))}
          className={touched.cycleNumber && cycleError ? "input-error" : ""}
        />
        {touched.cycleNumber && cycleError ? <p className="field-error">{cycleError}</p> : null}
        <button onClick={assignCyclePayout} disabled={Boolean(cycleError)}>
          Assign payout for cycle
        </button>
      </article>
    </section>
  );
}
