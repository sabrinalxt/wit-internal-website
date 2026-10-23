import { env } from "../../config/env";
import { ConsoleEmailProvider } from "./console.provider";
import { SmtpEmailProvider } from "./smtp.provider";
import { EmailProvider, RenderedEmail } from "./email.types";
import {
  ProposalEmailData,
  proposalApproved,
  proposalPillarApproved,
  proposalRejected,
  proposalSubmitted,
} from "./templates";

export interface Contact {
  name: string;
  email: string;
}

let provider: EmailProvider | null = null;

function getProvider(): EmailProvider {
  if (!provider) {
    if (env.EMAIL_PROVIDER === "smtp") {
      if (!env.SMTP) {
        throw new Error("SMTP email provider is missing its configuration.");
      }
      provider = new SmtpEmailProvider(env.SMTP);
    } else {
      provider = new ConsoleEmailProvider();
    }
  }
  return provider;
}

export async function sendEmail(to: string, content: RenderedEmail): Promise<void> {
  await getProvider().send({ from: env.EMAIL_FROM, to, ...content });
}

export function notify(label: string, task: () => Promise<void>): void {
  task().catch((error) => {
    console.error(`[email] FAILED to send "${label}":`, error);
  });
}

export interface ProposalEmailContext {
  proposalId: number;
  proposalName: string;
  proposalType: string;
  requestor: Contact;
  recipient: Contact;
  actor?: { name: string };
  comment?: string | null;
}

function toData(context: ProposalEmailContext): ProposalEmailData {
  return {
    recipientName: context.recipient.name,
    proposalId: context.proposalId,
    proposalName: context.proposalName,
    proposalType: context.proposalType,
    requestorName: context.requestor.name,
    actorName: context.actor?.name,
    comment: context.comment,
    link: `${env.APP_URL}/proposals/${context.proposalId}`,
  };
}

export const sendProposalSubmittedEmail = (context: ProposalEmailContext) =>
  sendEmail(context.recipient.email, proposalSubmitted(toData(context)));

export const sendProposalPillarApprovedEmail = (context: ProposalEmailContext) =>
  sendEmail(context.recipient.email, proposalPillarApproved(toData(context)));

export const sendProposalApprovedEmail = (context: ProposalEmailContext) =>
  sendEmail(context.recipient.email, proposalApproved(toData(context)));

export const sendProposalRejectedEmail = (context: ProposalEmailContext) =>
  sendEmail(context.recipient.email, proposalRejected(toData(context)));
