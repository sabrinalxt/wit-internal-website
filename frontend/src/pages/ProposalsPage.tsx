import { useMemo, useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Dialog } from "../components/ui/dialog";

type Status = "Submitted" | "Approved" | "Rejected";

type Proposal = {
  id: string;
  name: string;
  date: string; // yyyy-mm-dd
  status: Status;
};

const initial: Proposal[] = [
  { id: "p3", name: "Outreach Portal", date: formatDate(new Date()), status: "Submitted" },
  { id: "p2", name: "Campus Fair Booth", date: "2025-09-14", status: "Approved" },
  { id: "p1", name: "Alumni Event Collab", date: "2025-08-03", status: "Rejected" },
];

function formatDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<Proposal[]>(initial);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return proposals.filter((p) => {
      const okName = name ? p.name.toLowerCase().includes(name.toLowerCase()) : true;
      const okDate = date ? p.date === date : true;
      const okStatus = status ? p.status === status : true;
      return okName && okDate && okStatus;
    });
  }, [proposals, name, date, status]);

  // Create dialog state
  const [nName, setNName] = useState("");
  const [nDate, setNDate] = useState(formatDate(new Date()));
  const [nStatus, setNStatus] = useState<Status>("Submitted");

  function addProposal() {
    const id = Math.random().toString(36).slice(2);
    const item: Proposal = { id, name: nName || "Untitled", date: nDate, status: nStatus };
    setProposals((prev) => [item, ...prev]);
    setOpen(false);
    setNName("");
    setNDate(formatDate(new Date()));
    setNStatus("Submitted");
  }

  return (
    <div className="min-h-screen w-full px-4 py-4 md:px-8">
      {/* Title row */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg px-5 py-2 font-semibold text-base"
          style={{ background: "#A0A0DB", color: "#F6F1E7" }}
        >
          Create
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <div className="space-y-1">
          <label className="text-sm text-slate-600">Name</label>
          <Input
            placeholder="Search by name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-600">Date</label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-slate-600">Status</label>
          <Select value={status} onChange={(e) => setStatus(e.target.value as Status | "")}>
            <option value="">All</option>
            <option>Submitted</option>
            <option>Approved</option>
            <option>Rejected</option>
          </Select>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl bg-white/70 shadow-soft backdrop-blur md:block">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-slate-50 text-left text-sm text-slate-600">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 text-sm">
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.date}</td>
                <td className="px-4 py-3">{renderStatus(p.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.map((p) => (
          <div key={p.id} className="rounded-xl bg-white/70 p-4 shadow-soft backdrop-blur">
            <div className="mb-1 text-base font-semibold">{p.name}</div>
            <div className="text-sm text-slate-600">{p.date}</div>
            <div className="mt-2">{renderStatus(p.status)}</div>
          </div>
        ))}
      </div>

      {/* Create dialog */}
      <Dialog open={open} onOpenChange={setOpen} title="Create Proposal">
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Name</label>
            <Input
              value={nName}
              onChange={(e) => setNName(e.target.value)}
              placeholder="Proposal name"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Date</label>
            <Input type="date" value={nDate} onChange={(e) => setNDate(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-600">Status</label>
            <Select value={nStatus} onChange={(e) => setNStatus(e.target.value as Status)}>
              <option>Submitted</option>
              <option>Approved</option>
              <option>Rejected</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addProposal}>Create</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function renderStatus(s: Status) {
  switch (s) {
    case "Approved":
      return <Badge variant="success">Approved</Badge>;
    case "Rejected":
      return <Badge variant="destructive">Rejected</Badge>;
    case "Submitted":
    default:
      return <Badge variant="info">Submitted</Badge>;
  }
}
