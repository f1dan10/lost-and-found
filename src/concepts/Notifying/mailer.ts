/** Sends an email. The concept never knows how: the server uses the console, and tests use memory. */
export interface Mailer {
  send(email: { to: string; message: string }): Promise<void>;
}

/** Prints each email instead of sending it, so Alpha needs no email setup. The address is a username, so it gets @mit.edu. */
export class ConsoleMailer implements Mailer {
  async send({ to, message }: { to: string; message: string }) {
    console.log(`would email ${to}@mit.edu: ${message}`);
  }
}

/** Records each email, and fails every send while `failure` is set. */
export class MemoryMailer implements Mailer {
  readonly sent: { to: string; message: string }[] = [];
  failure: Error | undefined;

  async send(email: { to: string; message: string }) {
    if (this.failure !== undefined) throw this.failure;
    this.sent.push(email);
  }
}
