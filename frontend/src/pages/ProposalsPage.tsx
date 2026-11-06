import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  deleteProposal,
  getProposalReviewers,
  getProposals,
  submitProposal,
} from "../api/client";
import ProposalDetailDialog from "../components/proposals/ProposalDetailDialog";
import ProposalFormDialog from "../components/proposals/ProposalFormDialog";
import StatusBadge from "../components/proposals/StatusBadge";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { useToast } from "../components/ui/toast";
import { useAuth } from "../context/AuthContext";
import {
  errorMessage,
  formatDate,
  isEditable,
  joinWithAnd,
  missingForSubmit,
  STATUS_LABELS,
} from "../lib/proposals";
import type { Proposal, ProposalReviewers, ProposalStatus } from "../types";

// What the create/edit form is doing. null = closed.
type FormState = { proposal: Proposal | null; initialError?: string } | null;

export default function ProposalsPage() {
  const { user } = useAuth();
  const { showToast, toastElement } = useToast();

  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reviewers, setReviewers] = useState<ProposalReviewers>({ pillarLeads: [], approvers: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadCount, setReloadCount] = useState(0);

  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "">("");

  const [form, setForm] = useState<FormState>(null);
  const [formKey, setFormKey] = useState(0);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [detailKey, setDetailKey] = useState(0);
  const [toDelete, setToDelete] = useState<Proposal | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const userId = user?.id;

  // Load proposals and the reviewer dropdown lists. Runs again when reloadCount changes.
  useEffect(() => {
    let active = true;
    Promise.all([getProposals(), getProposalReviewers()])
      .then(([items, people]) => {
        if (!active) return;
        // GET /proposals also returns proposals the user can see as a reviewer
        // (e.g. a Requestor who is also an Approver). This page only shows their own.
        setProposals(items.filter((item) => item.requestor.id === userId));
        setReviewers(people);
        setLoadError("");
      })
      .catch((error: unknown) => active && setLoadError(errorMessage(error)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [reloadCount, userId]);

  const filtered = useMemo(
    () =>
      proposals.filter(
        (proposal) =>
          proposal.proposal_name.toLowerCase().includes(nameFilter.trim().toLowerCase()) &&
          (!statusFilter || proposal.proposal_status === statusFilter),
      ),
    [nameFilter, proposals, statusFilter],
  );

  // An FA can only be created from one of your own approved IPAs
  const approvedIpas = proposals.filter(
    (proposal) => proposal.proposal_type === "IPA" && proposal.proposal_status === "APPROVED",
  );

  // Put the server's latest copy of a proposal into the list (new ones go on top)
  function upsert(saved: Proposal) {
    setProposals((current) =>
      current.some((item) => item.proposal_id === saved.proposal_id)
        ? current.map((item) => (item.proposal_id === saved.proposal_id ? saved : item))
        : [saved, ...current],
    );
  }

  function openForm(proposal: Proposal | null, initialError?: string) {
    setDetailId(null);
    setForm(initialError ? { proposal, initialError } : { proposal });
    setFormKey((key) => key + 1);
  }

  function openDetail(proposalId: number) {
    setDetailId(proposalId);
    setDetailKey((key) => key + 1);
  }

  function handleSaved(saved: Proposal, submitted: boolean, submitError?: string) {
    upsert(saved);
    setForm(null);
    if (submitError) {
      showToast({ type: "error", title: "Saved, but not submitted", text: submitError });
    } else if (submitted) {
      showToast({
        type: "success",
        title: "Submitted",
        text: "Your pillar lead will review it next.",
      });
    } else {
      showToast({
        type: "success",
        title: "Saved",
        text: `"${saved.proposal_name}" was saved as a draft.`,
      });
    }
  }

  async function handleSubmit(proposal: Proposal) {
    // Missing fields: open the form instead of letting the API reject it
    const missing = missingForSubmit(proposal);
    if (missing.length > 0) {
      openForm(proposal, `Add ${joinWithAnd(missing)} before submitting.`);
      return;
    }
    setBusyId(proposal.proposal_id);
    try {
      const updated = await submitProposal(proposal.proposal_id);
      upsert(updated);
      if (detailId === proposal.proposal_id) setDetailKey((key) => key + 1);
      showToast({
        type: "success",
        title: proposal.proposal_status === "REJECTED" ? "Resubmitted" : "Submitted",
        text: "Your pillar lead will review it next.",
      });
    } catch (error) {
      handleActionError(error, "Couldn't submit");
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const proposal = toDelete;
    setBusyId(proposal.proposal_id);
    try {
      await deleteProposal(proposal.proposal_id);
      setProposals((current) =>
        current.filter((item) => item.proposal_id !== proposal.proposal_id),
      );
      setToDelete(null);
      setDetailId(null);
      showToast({
        type: "success",
        title: "Deleted",
        text: `"${proposal.proposal_name}" was deleted.`,
      });
    } catch (error) {
      setToDelete(null);
      handleActionError(error, "Couldn't delete");
    } finally {
      setBusyId(null);
    }
  }

  function handleActionError(error: unknown, title: string) {
    // 409 = someone changed it at the same time, so reload to show the real state
    if (error instanceof ApiError && error.status === 409) {
      setReloadCount((count) => count + 1);
    }
    showToast({ type: "error", title, text: errorMessage(error) });
  }

  return (
    <div className="flex justify-center px-2 py-8 md:px-12">
      {toastElement}
      <div className="w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-soft md:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1a1340]">My proposals</h1>
            <p className="mt-1 text-sm text-slate-500">
              Create IPAs and FAs, submit them for review and track where they are.
            </p>
          </div>
          <Button variant="primary" onClick={() => openForm(null)}>
            New proposal
          </Button>
        </div>

        <div className="mb-4 grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="filter-name" className="text-sm text-slate-600">
              Search
            </label>
            <Input
              id="filter-name"
              placeholder="Search by name"
              value={nameFilter}
              onChange={(event) => setNameFilter(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="filter-status" className="text-sm text-slate-600">
              Status
            </label>
            <Select
              id="filter-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "")}
            >
              <option value="">All statuses</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {loadError ? (
          <div role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {loadError}{" "}
            <button
              type="button"
              className="font-medium underline"
              onClick={() => {
                setLoading(true);
                setReloadCount((count) => count + 1);
              }}
            >
              Try again
            </button>
          </div>
        ) : null}

        {loading ? <p className="py-8 text-center text-slate-500">Loading proposals...</p> : null}

        {!loading && !loadError && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-slate-500">
            {proposals.length === 0
              ? "You don't have any proposals yet. Click New proposal to start one."
              : "No proposals match your search."}
          </div>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Submitted</th>
                  <th className="px-4 py-3 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((proposal) => {
                  const busy = busyId === proposal.proposal_id;
                  return (
                    <tr key={proposal.proposal_id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="text-left font-medium text-[#1a1340] hover:underline"
                          onClick={() => openDetail(proposal.proposal_id)}
                        >
                          {proposal.proposal_name}
                        </button>
                      </td>
                      <td className="px-4 py-3">{proposal.proposal_type}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={proposal.proposal_status} />
                        {proposal.proposal_status === "REJECTED" && proposal.rejection_reason ? (
                          <p
                            className="mt-1 max-w-xs truncate text-xs text-red-700"
                            title={proposal.rejection_reason}
                          >
                            {proposal.rejection_reason}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatDate(proposal.date_submitted)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetail(proposal.proposal_id)}
                          >
                            View
                          </Button>
                          {isEditable(proposal) ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busy}
                                onClick={() => openForm(proposal)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="primary"
                                disabled={busy}
                                onClick={() => void handleSubmit(proposal)}
                              >
                                {proposal.proposal_status === "REJECTED" ? "Resubmit" : "Submit"}
                              </Button>
                            </>
                          ) : null}
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

      {form && user ? (
        <ProposalFormDialog
          key={formKey}
          proposal={form.proposal}
          reviewers={reviewers}
          approvedIpas={approvedIpas}
          currentUserId={user.id}
          {...(form.initialError ? { initialError: form.initialError } : {})}
          onClose={() => setForm(null)}
          onSaved={handleSaved}
        />
      ) : null}

      {detailId !== null ? (
        <ProposalDetailDialog
          key={detailKey}
          proposalId={detailId}
          busy={busyId === detailId}
          onClose={() => setDetailId(null)}
          onEdit={(proposal) => openForm(proposal)}
          onSubmit={(proposal) => void handleSubmit(proposal)}
          onDelete={(proposal) => setToDelete(proposal)}
        />
      ) : null}

      <Dialog
        open={toDelete !== null}
        onOpenChange={() => setToDelete(null)}
        title="Delete this draft?"
      >
        <p className="text-sm text-slate-600">
          "{toDelete?.proposal_name}" will be deleted for good. This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setToDelete(null)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={busyId !== null} onClick={() => void confirmDelete()}>
            Delete
          </Button>
        </div>
      </Dialog>
    </div>
  );
}