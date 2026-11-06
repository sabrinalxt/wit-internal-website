import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  approveProposal,
  getProposals,
  pillarApproveProposal,
  rejectProposal,
} from "../api/client";
import ReviewDialog from "../components/proposals/ReviewDialog";
import StatusBadge from "../components/proposals/StatusBadge";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import { awaitsReviewBy, errorMessage, formatDate } from "../lib/proposals";
import type { Proposal, ProposalDetail } from "../types";

type Tab = "pending" | "all";

// Review queue for Pillar Leads and Approvers (Profs): proposals waiting for this
// reviewer's decision, with Approve and Reject (comment required).
export default function ReviewPage() {
  const { user } = useAuth();
  const { showToast, toastElement } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [tab, setTab] = useState<Tab>("pending");

  const [reviewId, setReviewId] = useState<number | null>(null);
  const [reviewKey, setReviewKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const userId = user?.id;

  useEffect(() => {
    let active = true;
    getProposals()
      .then((items) => {
        if (!active) return;
        // A user who is also a Requestor gets their own proposals too; those live on My proposals
        setProposals(
          items.filter((item) => item.requestor.id !== userId && item.proposal_status !== "DRAFT"),
        );
        setLoadError("");
      })
      .catch((error: unknown) => active && setLoadError(errorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadCount, userId]);

  // Oldest submission first, so nobody is left waiting longest
  const pending = useMemo(
    () =>
      user
        ? proposals
            .filter((proposal) => awaitsReviewBy(proposal, user))
            .sort((a, b) => (a.date_submitted ?? "").localeCompare(b.date_submitted ?? ""))
        : [],
    [proposals, user],
  );
  const shown = tab === "pending" ? pending : proposals;
  const reviewing = proposals.find((proposal) => proposal.proposal_id === reviewId);

  function reload() {
    setLoading(true);
    setReloadCount((count) => count + 1);
  }

  function openReview(proposalId: number) {
    setReviewId(proposalId);
    setReviewKey((key) => key + 1);
    setActionError("");
  }

  function closeReview() {
    setReviewId(null);
    setActionError("");
  }

  // Put the server's updated copy into the list, close the dialog and say what happened
  function finish(updated: ProposalDetail, title: string, text: string) {
    setProposals((current) =>
      current.map((item) => (item.proposal_id === updated.proposal_id ? updated : item)),
    );
    closeReview();
    showToast({ type: "success", title, text });
  }

  function handleActionError(error: unknown) {
    // 409: someone else changed it first. Reload so the list shows its real status.
    if (error instanceof ApiError && error.status === 409) reload();
    setActionError(errorMessage(error));
  }

  async function handleApprove(proposal: ProposalDetail) {
    setBusy(true);
    setActionError("");
    try {
      if (proposal.proposal_status === "SUBMITTED") {
        const updated = await pillarApproveProposal(proposal.proposal_id);
        finish(
          updated,
          "Approved",
          `Sent to ${updated.approver?.name ?? "the approver"} for final approval.`,
        );
      } else {
        const updated = await approveProposal(proposal.proposal_id);
        finish(updated, "Approved", `"${updated.proposal_name}" is fully approved.`);
      }
    } catch (error) {
      handleActionError(error);
    } finally {
      setBusy(false);
    }
  }

  async function handleReject(proposal: ProposalDetail, reason: string) {
    setBusy(true);
    setActionError("");
    try {
      const updated = await rejectProposal(proposal.proposal_id, reason);
      finish(
        updated,
        "Rejected",
        `${updated.requestor.name} can edit and resubmit it with your feedback.`,
      );
    } catch (error) {
      handleActionError(error);
    } finally {
      setBusy(false);
    }
  }

  const tabClass = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
      active ? "bg-white text-[#1a1340] shadow-sm" : "text-slate-600 hover:text-slate-900"
    }`;

  return (
    <div className="flex justify-center px-2 py-8 md:px-12">
      {toastElement}
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#1a1340]">Review queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            Approve proposals or send them back to the requestor with a reason.
          </p>
        </div>

        <div role="tablist" className="mb-4 inline-flex gap-1 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "pending"}
            className={tabClass(tab === "pending")}
            onClick={() => setTab("pending")}
          >
            Needs your review{!loading ? ` (${pending.length})` : ""}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "all"}
            className={tabClass(tab === "all")}
            onClick={() => setTab("all")}
          >
            All
          </button>
        </div>

        {loadError ? (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {loadError}{" "}
            <button type="button" className="font-medium underline" onClick={reload}>
              Try again
            </button>
          </div>
        ) : null}

        {loading ? <p className="py-8 text-center text-slate-500">Loading proposals...</p> : null}

        {!loading && !loadError && shown.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            {tab === "pending"
              ? "You're all caught up. Nothing is waiting for your review."
              : "No proposals to show yet."}
          </div>
        ) : null}

        {!loading && shown.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Requestor</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((proposal) => {
                  const canReview = user ? awaitsReviewBy(proposal, user) : false;
                  return (
                    <tr key={proposal.proposal_id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-[#1a1340] hover:underline"
                          onClick={() => openReview(proposal.proposal_id)}
                        >
                          {proposal.proposal_name}
                        </button>
                      </td>
                      <td className="px-4 py-3">{proposal.proposal_type}</td>
                      <td className="px-4 py-3 text-slate-600">{proposal.requestor.name}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={proposal.proposal_status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(proposal.date_submitted)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <Button
                            size="sm"
                            variant={canReview ? "primary" : "outline"}
                            onClick={() => openReview(proposal.proposal_id)}
                          >
                            {canReview ? "Review" : "View"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {reviewId !== null ? (
        <ReviewDialog
          key={reviewKey}
          proposalId={reviewId}
          canReview={reviewing && user ? awaitsReviewBy(reviewing, user) : false}
          busy={busy}
          actionError={actionError}
          onClose={closeReview}
          onApprove={(proposal) => void handleApprove(proposal)}
          onReject={(proposal, reason) => void handleReject(proposal, reason)}
        />
      ) : null}
    </div>
  );
}
