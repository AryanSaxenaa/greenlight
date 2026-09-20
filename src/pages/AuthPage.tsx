import { useAuthActions } from "@convex-dev/auth/react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";

export function AuthPage() {
  const navigate = useNavigate();
  const { signIn } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signUp");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (viewer) {
      navigate("/projects/new");
    }
  }, [viewer, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await signIn("password", {
        email,
        password,
        flow: mode,
      });
      navigate("/projects/new");
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Authentication failed.",
      );
      setSubmitting(false);
    }
  }

  return (
    <AppPageLayout signedIn={Boolean(viewer)}>
      <div className="app-card app-card-narrow">
        <p className="landing-section-kicker">Account</p>
        <h2 className="app-card-title">
          {mode === "signUp" ? "Create account" : "Sign in"}
        </h2>
        <p className="app-card-lead">
          Start a permitting project in Los Angeles. Your control room, permit
          graph, and agency correspondence stay tied to this account.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              autoComplete={
                mode === "signUp" ? "new-password" : "current-password"
              }
              placeholder="At least 8 characters"
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <div className="cta-row">
            <button
              className="button button-landing-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting
                ? "Working..."
                : mode === "signUp"
                  ? "Create account"
                  : "Sign in"}
            </button>
            <button
              className="button button-landing-secondary"
              type="button"
              onClick={() =>
                setMode((current) =>
                  current === "signUp" ? "signIn" : "signUp",
                )
              }
            >
              {mode === "signUp" ? "Use existing account" : "Create account"}
            </button>
          </div>
        </form>

        <p className="app-card-foot">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </AppPageLayout>
  );
}
