export class BaseException extends Error {
  constructor(message?: string) {
    super(message);

    // Restore prototype chain.
    Object.setPrototypeOf(this, new.target.prototype);

    // Set name
    this.name = new.target.name;
  }
}
