import { RenderedEmail } from "./email.types";

export interface ProposalEmailData {
  recipientName: string;
  proposalId: number;
  proposalName: string;
  proposalType: string;
  requestorName: string;
  actorName?: string;
  comment?: string | null;
  link: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function build(subject: string, lines: string[], link: string): RenderedEmail {
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5">` +
    lines.map((line) => `<p>${escapeHtml(line).replace(/\n/g, "<br>")}</p>`).join("") +
    `<p><a href="${escapeHtml(link)}">Open proposal</a></p>` +
    `</div>`;
  const text = `${lines.join("\n\n")}\n\nOpen proposal: ${link}\n`;
  return { subject, text, html };
}

function label(data: ProposalEmailData): string {
  return `${data.proposalType} "${data.proposalName}" (#${data.proposalId})`;
}

export function proposalSubmitted(data: ProposalEmailData): RenderedEmail {
  return build(
    `New proposal to review: ${data.proposalName}`,
    [
      `Hi ${data.recipientName},`,
      `${data.requestorName} submitted ${label(data)} and it is waiting for your review as pillar lead.`,
    ],
    data.link,
  );
}

export function proposalPillarApproved(data: ProposalEmailData): RenderedEmail {
  return build(
    `Proposal ready for final approval: ${data.proposalName}`,
    [
      `Hi ${data.recipientName},`,
      `${data.actorName ?? "The pillar lead"} approved ${label(data)} from ${data.requestorName}. It is now waiting for your final approval.`,
    ],
    data.link,
  );
}

export function proposalApproved(data: ProposalEmailData): RenderedEmail {
  return build(
    `Your proposal was approved: ${data.proposalName}`,
    [`Hi ${data.recipientName},`, `Good news! ${label(data)} has been fully approved.`],
    data.link,
  );
}

export function proposalRejected(data: ProposalEmailData): RenderedEmail {
  return build(
    `Your proposal was rejected: ${data.proposalName}`,
    [
      `Hi ${data.recipientName},`,
      `${data.actorName ?? "A reviewer"} rejected ${label(data)}.`,
      `Reason:\n${data.comment ?? "(no reason given)"}`,
      "You can edit the proposal and submit it again.",
    ],
    data.link,
  );
}
