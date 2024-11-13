interface RetryOptions {
  retries: number;
  minTimeout: number;
  maxTimeout: number;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, minTimeout, maxTimeout } = options;
  let lastError: Error;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i === retries - 1) break;

      const timeout = Math.min(
        Math.max(minTimeout * Math.pow(2, i), minTimeout),
        maxTimeout
      );
      await new Promise(resolve => setTimeout(resolve, timeout));
    }
  }

  throw lastError!;
}
