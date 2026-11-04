import { useEffect, useState } from "react";
import { getProposal } from "../../api/client";
import {
  errorMessage,
  formatDate,
  formatDateTime,
  isEditable,
  STATUS_LABELS,
} from "../../lib/proposals";
import type { ProposalDetail } from "../../types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import StatusBadge from "./StatusBadge";

type Props = {
  proposalId: number;
  busy: boolean;
  onClose: () => void;
  onEdit: (proposal: ProposalDetail) => void;
  onSubmit: (proposal: ProposalDetail) => void;
  onDelete: (proposal: ProposalDetail) => void;
};

// Full view of one proposal: details, the reviewer's feedback if rejected, and its status history.
// The parent gives it a new key whenever the proposal changes, so it always fetches fresh data.
export default function ProposalDetailDialog({
  proposalId,
  busy,
  onClose,
  onEdit,
  onSubmit,
  onDelete,
}: Props) {
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getProposal(proposalId)
      .then((data) => active && setProposal(data))
      .catch((loadError: unknown) => active && setError(errorMessage(loadError)));
    return () => {
      active = false;
    };
  }, [proposalId]);

   // Most recent rejection, to say who rejected it
  const rejections =
    proposal?.status_history.filter((entry) => entry.to_status === "REJECTED") ?? [];
  const lastRejection = rejections[rejections.length - 1];
  return (
    <Dialog open onOpenChange={onClose} title={proposal?.proposal_name ?? "Proposal"}>
      {!proposal && !error ? <p className="py-6 text-center text-slate-500">Loading...</p> : null}
      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      {proposal ? (
        <div className="space-y-5 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={proposal.proposal_status} />
            <span className="text-slate-500">{proposal.proposal_type}</span>
          </div>

          {proposal.proposal_status === "REJECTED" && proposal.rejection_reason ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800">
              <p className="font-medium">
                Rejected{lastRejection ? ` by ${lastRejection.changed_by.name}` : ""}
              </p>
              <p className="mt-1 whitespace-pre-line">{proposal.rejection_reason}</p>
              <p className="mt-2 text-xs text-red-700">
                Edit the proposal to address this, then resubmit.
              </p>
            </div>
          ) : null}

          <dl className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2">
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
                <span className="text-slate-400">Not added yet</span>
              )}
            </Row>
            <Row label="Pillar lead">
              {proposal.pillar_lead?.name ?? <span className="text-slate-400">Not chosen</span>}
            </Row>
            <Row label="Approver">
              {proposal.approver?.name ?? <span className="text-slate-400">Not chosen</span>}
            </Row>
            <Row label="Submitted">{formatDate(proposal.date_submitted)}</Row>
            <Row label="Reviewed">{formatDate(proposal.date_reviewed)}</Row>
          </dl>

          <div>
            <h4 className="mb-2 font-semibold text-slate-800">History</h4>
            {proposal.status_history.length === 0 ? (
              <p className="text-slate-500">Not submitted yet.</p>
            ) : (
              <ol className="space-y-3 border-l-2 border-slate-200 pl-4">
                {proposal.status_history.map((entry) => (
                  <li key={entry.id}>
                    <p className="font-medium text-slate-800">
                      {STATUS_LABELS[entry.to_status]}
                      <span className="font-normal text-slate-500">
                        {" "}
                        by {entry.changed_by.name}
                      </span>
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
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
            {proposal.proposal_status === "DRAFT" ? (
              <Button variant="outline" disabled={busy} onClick={() => onDelete(proposal)}>
                Delete
              </Button>
            ) : null}
            {isEditable(proposal) ? (
              <>
                <Button variant="outline" disabled={busy} onClick={() => onEdit(proposal)}>
                  Edit
                </Button>
                <Button variant="primary" disabled={busy} onClick={() => onSubmit(proposal)}>
                  {proposal.proposal_status === "REJECTED" ? "Resubmit" : "Submit"}
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            )}
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