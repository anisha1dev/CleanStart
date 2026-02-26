export async function withTimeout<T>(
  promise: PromiseLike<T> | Promise<T>,
  timeoutMs: number,
  label = 'Operation',
): Promise<T> {
  return Promise.race<T>([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
    }),
  ]);
}
