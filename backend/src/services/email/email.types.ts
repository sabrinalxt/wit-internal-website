export interface RenderedEmail {
  subject: string;
  text: string;
  html: string;
}

export interface EmailMessage extends RenderedEmail {
  from: string;
  to: string;
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<void>;
}
