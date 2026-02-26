export const SUPABASE_COOKIE_OPTIONS = {
  lifetime: 60 * 60 * 24 * 30,
  path: '/',
  sameSite: 'lax' as const,
};
