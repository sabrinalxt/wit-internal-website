import { useEffect, useState } from "react";
import { getProposal } from "../../api/client";
import { errorMessage, formatDate, formatDateTime, STATUS_LABELS } from "../../lib/proposals";
import type { ProposalDetail } from "../../types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import StatusBadge from "./StatusBadge";

type Props = {
  proposalId: number;
  // Whether the signed-in user may approve or reject it now (see awaitsReviewBy)
  canReview: boolean;
  busy: boolean;
  // Set by the parent when an action fails, so it shows inside the dialog
  actionError: string;
  onClose: () => void;
  onApprove: (proposal: ProposalDetail) => void;
  onReject: (proposal: ProposalDetail, reason: string) => void;
};

// Which action the reviewer has started. Both ask for a second click before anything is sent.
type Mode = "idle" | "approve" | "reject";

// A reviewer's view of one proposal: details, history and, if it's their turn, Approve / Reject.
export default function ReviewDialog({
  proposalId,
  canReview,
  busy,
  actionError,
  onClose,
  onApprove,
  onReject,
}: Props) {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<Mode>("idle");
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState("");

  useEffect(() => {
    let active = true;
    getProposal(proposalId)
      .then((data) => active && setProposal(data))
      .catch((error: unknown) => active && setLoadError(errorMessage(error)));
    return () => {
      active = false;
    };
  }, [proposalId]);

  // The pillar lead's approval passes it on; the approver's is the final decision
  const isPillarStep = proposal?.proposal_status === "SUBMITTED";

  function confirmReject() {
    if (!proposal) return;
    if (!reason.trim()) {
      setReasonError("Please give a reason so the requestor knows what to change.");
      return;
    }
    onReject(proposal, reason.trim());
  }

  return (
    <Dialog open onOpenChange={onClose} title={proposal?.proposal_name ?? "Proposal"}>
      {!proposal && !loadError ? (
        <p className="py-6 text-center text-slate-500">Loading...</p>
      ) : null}
      {loadError ? (
        <p role="alert" className="text-sm text-red-600">
          {loadError}
        </p>
      ) : null}

      {proposal ? (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={proposal.proposal_status} />
            <span className="text-slate-500">{proposal.proposal_type}</span>
          </div>

          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
            <Row label="Requestor">{proposal.requestor.name}</Row>
            {proposal.parent ? (
              <Row label="For IPA">
                {proposal.parent.name} ({STATUS_LABELS[proposal.parent.status]})
              </Row>
            ) : null}
            <Row label="Drive link">
              {proposal.drive_link ? (
                <a
                  href={proposal.drive_link}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-[#5a34ea] hover:underline"
                >
                  Open in Google Drive
                </a>
              ) : (
                <span className="text-slate-400">Not added</span>
              )}
            </Row>
            <Row label="Pillar lead">{proposal.pillar_lead?.name ?? "-"}</Row>
            <Row label="Approver">{proposal.approver?.name ?? "-"}</Row>
            <Row label="Submitted">{formatDate(proposal.date_submitted)}</Row>
            <Row label="Reviewed">{formatDate(proposal.date_reviewed)}</Row>
          </dl>

          <div>
            <h4 className="mb-2 font-semibold text-slate-800">History</h4>
            <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
              {proposal.status_history.map((entry) => (
                <li key={entry.id}>
                  <p className="font-medium text-slate-800">
                    {STATUS_LABELS[entry.to_status]}
                    <span className="font-normal text-slate-500"> by {entry.changed_by.name}</span>
                  </p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                  {entry.comment ? (
                    <p className="mt-1 whitespace-pre-line rounded-md bg-slate-50 p-2 text-slate-700">
                      {entry.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ol>
          </div>

          {actionError ? (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-700">
              {actionError}
            </p>
          ) : null}

          {canReview && mode === "approve" ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-green-900">
              <p>
                {isPillarStep
                  ? `Approve and send it to ${proposal.approver?.name ?? "the approver"} for final approval?`
                  : "Give final approval? This can't be undone."}
              </p>
              <div className="mt-3 flex justify-end gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setMode("idle")}>
                  Cancel
                </Button>
                <Button variant="primary" disabled={busy} onClick={() => onApprove(proposal)}>
                  {busy ? "Approving..." : "Yes, approve"}
                </Button>
              </div>
            </div>
          ) : null}

          {canReview && mode === "reject" ? (
            <div className="space-y-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <label htmlFor="reject-reason" className="font-medium text-red-900">
                Reason for rejecting
              </label>
              <textarea
                id="reject-reason"
                rows={4}
                autoFocus
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                  if (reasonError) setReasonError("");
                }}
                placeholder="What should the requestor change before resubmitting?"
                aria-invalid={reasonError ? true : undefined}
                aria-describedby={reasonError ? "reject-reason-error" : undefined}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
              />
              {reasonError ? (
                <p id="reject-reason-error" className="text-red-700">
                  {reasonError}
                </p>
              ) : (
                <p className="text-red-800">The requestor will see this with the proposal.</p>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" disabled={busy} onClick={() => setMode("idle")}>
                  Cancel
                </Button>
                <Button variant="danger" disabled={busy} onClick={confirmReject}>
                  {busy ? "Rejecting..." : "Reject proposal"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {canReview && mode === "idle" ? (
              <>
                <Button variant="outline" onClick={() => setMode("reject")}>
                  Reject
                </Button>
                <Button variant="primary" onClick={() => setMode("approve")}>
                  Approve
                </Button>
              </>
            ) : null}
            {!canReview ? (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-800">{children}</dd>
    </>
  );
}
