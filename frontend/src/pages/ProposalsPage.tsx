import { useEffect, useMemo, useState } from "react";
import {
  ApiError,
  createProposal,
  deleteProposal,
  getProposalReviewers,
  getProposals,
  submitProposal,
  updateProposal,
} from "../api/client";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import type { Proposal, ProposalReviewers, ProposalStatus, ProposalType } from "../types";

const statusLabels: Record<ProposalStatus, string> = {
  DRAFT: "Draft",
  SUBMITTED: "Submitted",
  PILLAR_APPROVED: "Pillar approved",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError || error instanceof Error ? error.message : "Something went wrong";
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [reviewers, setReviewers] = useState<ProposalReviewers>({ pillarLeads: [], approvers: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | "">("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "IPA" as ProposalType,
    driveLink: "",
    pillarLeadId: "",
    approverId: "",
    parentId: "",
  });

  useEffect(() => {
    Promise.all([getProposals(), getProposalReviewers()])
      .then(([items, availableReviewers]) => {
        setProposals(items);
        setReviewers(availableReviewers);
      })
      .catch((loadError: unknown) => setError(getErrorMessage(loadError)))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      proposals.filter(
        (proposal) =>
          proposal.proposal_name.toLowerCase().includes(nameFilter.toLowerCase()) &&
          (!statusFilter || proposal.proposal_status === statusFilter),
      ),
    [nameFilter, proposals, statusFilter],
  );

  const approvedIpas = proposals.filter(
    (proposal) => proposal.proposal_type === "IPA" && proposal.proposal_status === "APPROVED",
  );

  function resetForm() {
    setForm({ name: "", type: "IPA", driveLink: "", pillarLeadId: "", approverId: "", parentId: "" });
    setFormError("");
  }

  function openCreate() {
    resetForm();
    setEditingId(null);
    setOpen(true);
  }

  function openEdit(proposal: Proposal) {
    setForm({
      name: proposal.proposal_name,
      type: proposal.proposal_type,
      driveLink: proposal.drive_link ?? "",
      pillarLeadId: proposal.pillar_lead?.id.toString() ?? "",
      approverId: proposal.approver?.id.toString() ?? "",
      parentId: proposal.parent_proposal_id?.toString() ?? "",
    });
    setFormError("");
    setEditingId(proposal.proposal_id);
    setOpen(true);
  }

  async function handleCreate() {
    if (!form.name.trim()) {
      setFormError("Proposal name is required.");
      return;
    }
    if (form.type === "FA" && !form.parentId) {
      setFormError("Select an approved IPA for this FA.");
      return;
    }
    try {
      const input = {
        proposal_name: form.name.trim(),
        proposal_type: form.type,
        ...(form.driveLink.trim() ? { drive_link: form.driveLink.trim() } : {}),
        ...(form.pillarLeadId ? { pillar_lead_id: Number(form.pillarLeadId) } : {}),
        ...(form.approverId ? { approver_id: Number(form.approverId) } : {}),
        ...(form.parentId ? { parent_proposal_id: Number(form.parentId) } : {}),
      };
      const proposal = editingId === null
        ? await createProposal(input)
        : await updateProposal(editingId, input);
      setProposals((current) =>
        editingId === null
          ? [proposal, ...current]
          : current.map((item) => (item.proposal_id === editingId ? proposal : item)),
      );
      resetForm();
      setEditingId(null);
      setOpen(false);
    } catch (createError) {
      setFormError(getErrorMessage(createError));
    }
  }

  async function handleSubmit(proposalId: number) {
    setBusyId(proposalId);
    try {
      const updated = await submitProposal(proposalId);
      setProposals((current) => current.map((proposal) => (proposal.proposal_id === proposalId ? updated : proposal)));
    } catch (submitError) {
      setError(getErrorMessage(submitError));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(proposalId: number) {
    if (!window.confirm("Delete this draft proposal?")) return;
    setBusyId(proposalId);
    try {
      await deleteProposal(proposalId);
      setProposals((current) => current.filter((proposal) => proposal.proposal_id !== proposalId));
    } catch (deleteError) {
      setError(getErrorMessage(deleteError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen w-full px-4 py-4 md:px-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My proposals</h1>
          <p className="mt-1 text-sm text-slate-500">Create, submit, and track your proposals.</p>
        </div>
        <button
          onClick={openCreate}
          className="rounded-lg px-5 py-2 text-base font-semibold"
          style={{ background: "#A0A0DB", color: "#F6F1E7" }}
        >
          Create
        </button>
      </div>

      {error ? <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <label className="text-sm text-slate-600">Name</label>
          <Input placeholder="Search by name" value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-600">Status</label>
          <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as ProposalStatus | "")}>
            <option value="">All statuses</option>
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </Select>
        </div>
      </div>

      {loading ? <p className="py-8 text-center text-slate-500">Loading proposals...</p> : null}
      {!loading && filtered.length === 0 ? (
        <div className="rounded-xl bg-white/70 p-8 text-center text-slate-500 shadow-soft">No proposals found.</div>
      ) : null}
      {!loading && filtered.length > 0 ? (
        <div className="overflow-hidden rounded-xl bg-white/70 shadow-soft backdrop-blur">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 text-left text-sm text-slate-600">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((proposal) => (
                <tr key={proposal.proposal_id} className="border-t border-slate-100 text-sm">
                  <td className="px-4 py-3 font-medium">{proposal.proposal_name}</td>
                  <td className="px-4 py-3">{proposal.proposal_type}</td>
                  <td className="px-4 py-3">{formatDate(proposal.date_submitted)}</td>
                  <td className="px-4 py-3">{renderStatus(proposal.proposal_status)}</td>
                  <td className="px-4 py-3">
                    {proposal.proposal_status === "DRAFT" || proposal.proposal_status === "REJECTED" ? (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(proposal)}>
                          Edit
                        </Button>
                        <Button size="sm" disabled={busyId === proposal.proposal_id} onClick={() => void handleSubmit(proposal.proposal_id)}>
                          {proposal.proposal_status === "REJECTED" ? "Resubmit" : "Submit"}
                        </Button>
                        {proposal.proposal_status === "DRAFT" ? (
                        <Button size="sm" variant="outline" disabled={busyId === proposal.proposal_id} onClick={() => void handleDelete(proposal.proposal_id)}>
                          Delete
                        </Button>
                        ) : null}
                      </div>
                    ) : <span className="text-slate-400">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen} title={editingId === null ? "Create proposal" : "Edit proposal"}>
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Name</label>
            <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Proposal name" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Type</label>
            <Select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ProposalType, parentId: "" })}>
              <option value="IPA">IPA</option>
              <option value="FA">FA</option>
            </Select>
          </div>
          {form.type === "FA" ? (
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Approved IPA</label>
              <Select value={form.parentId} onChange={(event) => setForm({ ...form, parentId: event.target.value })}>
                <option value="">Select an IPA</option>
                {approvedIpas.map((proposal) => <option key={proposal.proposal_id} value={proposal.proposal_id}>{proposal.proposal_name}</option>)}
              </Select>
            </div>
          ) : null}
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Drive link (optional)</label>
            <Input value={form.driveLink} onChange={(event) => setForm({ ...form, driveLink: event.target.value })} placeholder="https://drive.google.com/..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <ReviewerSelect label="Pillar lead" value={form.pillarLeadId} options={reviewers.pillarLeads} onChange={(value) => setForm({ ...form, pillarLeadId: value })} />
            <ReviewerSelect label="Approver" value={form.approverId} options={reviewers.approvers} onChange={(value) => setForm({ ...form, approverId: value })} />
          </div>
          {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => void handleCreate()}>{editingId === null ? "Create draft" : "Save changes"}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function ReviewerSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: number; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-slate-600">{label}</label>
      <Select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
      </Select>
    </div>
  );
}

function renderStatus(status: ProposalStatus) {
  if (status === "APPROVED") return <Badge variant="success">{statusLabels[status]}</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive">{statusLabels[status]}</Badge>;
  if (status === "DRAFT") return <Badge>{statusLabels[status]}</Badge>;
  return <Badge variant="info">{statusLabels[status]}</Badge>;
}
