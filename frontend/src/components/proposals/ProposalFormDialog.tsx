import { useState } from "react";
import {
  createProposal,
  submitProposal,
  updateProposal,
  type CreateProposalInput,
} from "../../api/client";
import { errorMessage, joinWithAnd } from "../../lib/proposals";
import type {
  Proposal,
  ProposalDetail,
  ProposalReviewer,
  ProposalReviewers,
  ProposalType,
} from "../../types";
import { Button } from "../ui/button";
import { Dialog } from "../ui/dialog";
import { Input } from "../ui/input";
import { Select } from "../ui/select";

type Props = {
  // null = create a new proposal, otherwise edit this one
  proposal: Proposal | null;
  reviewers: ProposalReviewers;
  approvedIpas: Proposal[];
  currentUserId: number;
  // Shown when the form opens, e.g. "Add a Drive link before submitting"
  initialError?: string;
  onClose: () => void;
  // Called with the saved proposal. `submitError` is set if it saved but couldn't be submitted.
  onSaved: (proposal: ProposalDetail, submitted: boolean, submitError?: string) => void;
};

// Create or edit a proposal. The parent renders it only while open (with a key),
// so the form always starts from the proposal's current values.
export default function ProposalFormDialog({
  proposal,
  reviewers,
  approvedIpas,
  currentUserId,
  initialError,
  onClose,
  onSaved,
}: Props) {
  const isEdit = proposal !== null;
  const isRejected = proposal?.proposal_status === "REJECTED";

  const [name, setName] = useState(proposal?.proposal_name ?? "");
  const [type, setType] = useState<ProposalType>(proposal?.proposal_type ?? "IPA");
  const [parentId, setParentId] = useState(proposal?.parent_proposal_id?.toString() ?? "");
  const [driveLink, setDriveLink] = useState(proposal?.drive_link ?? "");
  const [pillarLeadId, setPillarLeadId] = useState(proposal?.pillar_lead?.id.toString() ?? "");
  const [approverId, setApproverId] = useState(proposal?.approver?.id.toString() ?? "");
  const [error, setError] = useState(initialError ?? "");
  const [saving, setSaving] = useState(false);

  // The API won't let you review your own proposal, so leave yourself out of the dropdowns
  const notMe = (list: ProposalReviewer[]) => list.filter((person) => person.id !== currentUserId);

  // Checks we can do before calling the API. Returns an error message or "".
  function validate(andSubmit: boolean): string {
    if (!name.trim()) return "Give the proposal a name.";
    if (!isEdit && type === "FA" && !parentId) return "Choose the approved IPA this FA is for.";
    const link = driveLink.trim();
    if (link && !link.startsWith("https://")) return "The Drive link must start with https://";
    if (andSubmit) {
      const missing: string[] = [];
      if (!link) missing.push("a Drive link");
      if (!pillarLeadId) missing.push("a pillar lead");
      if (!approverId) missing.push("an approver");
      if (missing.length > 0) {
        return `Add ${joinWithAnd(missing)} before submitting, or save it as a draft for now.`;
      }
    }
    return "";
  }

  async function save(andSubmit: boolean) {
    const problem = validate(andSubmit);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError("");

    // Step 1: create or update
    let saved: ProposalDetail;
    try {
      if (proposal === null) {
        const input: CreateProposalInput = {
          proposal_name: name.trim(),
          proposal_type: type,
          ...(driveLink.trim() ? { drive_link: driveLink.trim() } : {}),
          ...(pillarLeadId ? { pillar_lead_id: Number(pillarLeadId) } : {}),
          ...(approverId ? { approver_id: Number(approverId) } : {}),
          ...(type === "FA" ? { parent_proposal_id: Number(parentId) } : {}),
        };
        saved = await createProposal(input);
      } else {
        // Send every editable field; null clears a field the user emptied
        saved = await updateProposal(proposal.proposal_id, {
          proposal_name: name.trim(),
          drive_link: driveLink.trim() || null,
          pillar_lead_id: pillarLeadId ? Number(pillarLeadId) : null,
          approver_id: approverId ? Number(approverId) : null,
        });
      }
    } catch (saveError) {
      setError(errorMessage(saveError));
      setSaving(false);
      return;
    }

    // Step 2 (optional): submit. If this fails the changes are still saved.
    if (andSubmit) {
      try {
        onSaved(await submitProposal(saved.proposal_id), true);
      } catch (submitError) {
        onSaved(saved, false, errorMessage(submitError));
      }
      return;
    }
    onSaved(saved, false);
  }

  const title = !isEdit ? "New proposal" : isRejected ? "Edit and resubmit" : "Edit proposal";

  return (
    <Dialog open onOpenChange={() => !saving && onClose()} title={title}>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save(false);
        }}
      >
        {isRejected && proposal?.rejection_reason ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <p className="font-medium">Reviewer's feedback</p>
            <p className="mt-1 whitespace-pre-line">{proposal.rejection_reason}</p>
          </div>
        ) : null}

        <Field label="Name" htmlFor="proposal-name">
          <Input
            id="proposal-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Women in Tech Career Fair"
            maxLength={255}
            autoFocus
          />
        </Field>

        <Field
          label="Type"
          htmlFor="proposal-type"
          hint={isEdit ? "The type can't be changed after creating a proposal." : undefined}
        >
          <Select
            id="proposal-type"
            value={type}
            disabled={isEdit}
            onChange={(event) => {
              setType(event.target.value as ProposalType);
              setParentId("");
            }}
          >
            <option value="IPA">IPA (in-principle approval)</option>
            <option value="FA">FA (final approval)</option>
          </Select>
        </Field>

        {type === "FA" && !isEdit ? (
          <Field
            label="Approved IPA"
            htmlFor="proposal-parent"
            hint={
              approvedIpas.length === 0
                ? "You need an approved IPA before you can create an FA."
                : undefined
            }
          >
            <Select
              id="proposal-parent"
              value={parentId}
              onChange={(event) => setParentId(event.target.value)}
            >
              <option value="">Choose an IPA</option>
              {approvedIpas.map((ipa) => (
                <option key={ipa.proposal_id} value={ipa.proposal_id}>
                  {ipa.proposal_name}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}

        <Field label="Google Drive link" htmlFor="proposal-link" hint="Needed before submitting.">
          <Input
            id="proposal-link"
            type="url"
            value={driveLink}
            onChange={(event) => setDriveLink(event.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pillar lead" htmlFor="proposal-pillar-lead">
            <Select
              id="proposal-pillar-lead"
              value={pillarLeadId}
              onChange={(event) => setPillarLeadId(event.target.value)}
            >
              <option value="">Choose a pillar lead</option>
              {notMe(reviewers.pillarLeads).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prof (approver)" htmlFor="proposal-approver">
            <Select
              id="proposal-approver"
              value={approverId}
              onChange={(event) => setApproverId(event.target.value)}
            >
              <option value="">Choose an approver</option>
              {notMe(reviewers.approvers).map((person) => (
                <option key={person.id} value={person.id}>
                  {person.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={saving} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="outline" disabled={saving}>
            {isEdit ? "Save changes" : "Save as draft"}
          </Button>
          <Button type="button" variant="primary" disabled={saving} onClick={() => void save(true)}>
            {saving ? "Saving..." : isRejected ? "Save and resubmit" : "Save and submit"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}