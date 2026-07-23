// Superadmin identity + helpers.
//
// The superadmin can browse the app "as" any user in a strictly read-only way
// (see ImpersonationProvider). Read access to other users' private data is
// granted in firestore.rules by matching this same email on
// request.auth.token.email, and all writes stay owner-only there — so
// impersonation can never modify another user's data.

export const SUPERADMIN_EMAIL = "chairachananharder@gmail.com";

// Case-insensitive match so a differently-cased Google email still resolves.
export const isSuperAdminEmail = (email?: string | null): boolean =>
  !!email && email.trim().toLowerCase() === SUPERADMIN_EMAIL;
