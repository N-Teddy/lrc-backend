export interface RetryOptions {
  attempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  factor?: number;
}

export class RetryStrategy {
  private readonly attempts: number;
  private readonly baseDelay: number;
  private readonly maxDelay: number;
  private readonly factor: number;

  constructor(options: RetryOptions = {}) {
    this.attempts = options.attempts ?? 3;
    this.baseDelay = options.baseDelay ?? 1000;
    this.maxDelay = options.maxDelay ?? 30000;
    this.factor = options.factor ?? 2;
  }

  calculateDelay(attempt: number): number {
    const delay = this.baseDelay * Math.pow(this.factor, attempt - 1);
    const jitter = Math.random() * 0.1 * delay;
    return Math.min(delay + jitter, this.maxDelay);
  }

  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.attempts) {
      return false;
    }

    const retryableErrors = [
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
    ];

    return (
      attempt < this.attempts &&
      (error.message.includes('timeout') ||
        error.message.includes('network') ||
        retryableErrors.some((code) => error.message.includes(code)))
    );
  }

  getAttempts(): number {
    return this.attempts;
  }
}
