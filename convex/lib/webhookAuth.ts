export function verifySharedWebhookSecret(
  request: Request,
  secret: string | undefined,
): boolean {
  if (!secret) {
    return false;
  }

  const url = new URL(request.url);
  if (url.searchParams.get("secret") === secret) {
    return true;
  }

  const authorization = request.headers.get("Authorization");
  if (authorization === `Bearer ${secret}`) {
    return true;
  }

  return request.headers.get("X-Webhook-Secret") === secret;
}
