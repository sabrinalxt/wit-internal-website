import { Badge } from "../ui/badge";
import { STATUS_LABELS } from "../../lib/proposals";
import type { ProposalStatus } from "../../types";

// Coloured pill for a proposal status. Reusable on the review page too.
export default function StatusBadge({ status }: { status: ProposalStatus }) {
  const variant =
    status === "APPROVED"
      ? "success"
      : status === "REJECTED"
        ? "destructive"
        : status === "DRAFT"
          ? "muted"
          : "info";
  return <Badge variant={variant}>{STATUS_LABELS[status]}</Badge>;
}