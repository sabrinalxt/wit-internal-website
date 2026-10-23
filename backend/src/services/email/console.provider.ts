import { EmailMessage, EmailProvider } from "./email.types";

export class ConsoleEmailProvider implements EmailProvider {
  async send(message: EmailMessage): Promise<void> {
    const line = "-".repeat(60);
    console.log(
      [
        line,
        "[email:console] (not actually sent)",
        `From:    ${message.from}`,
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        line,
      ].join("\n"),
    );
  }
}
