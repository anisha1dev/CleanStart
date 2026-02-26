type AuthResponse = {
  data: { user: { id: string; email?: string | null } | null };
};

export async function getUserSafe(
  supabase: { auth: { getUser: () => Promise<AuthResponse> } },
  timeoutMs = 5000,
) {
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Supabase auth timeout')), timeoutMs);
      }),
    ]);
    return result.data.user;
  } catch {
    return null;
  }
}
