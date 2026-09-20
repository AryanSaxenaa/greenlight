export function authRedirectPath(returnTo: string): string {
  const safeReturnTo = returnTo.startsWith("/") ? returnTo : "/projects";
  return `/auth?mode=signIn&returnTo=${encodeURIComponent(safeReturnTo)}`;
}

export function resolveReturnTo(searchParams: URLSearchParams): string {
  const returnTo = searchParams.get("returnTo");
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")) {
    return returnTo;
  }
  return "/projects";
}
