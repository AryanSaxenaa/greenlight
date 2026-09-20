import { useAuthActions } from "@convex-dev/auth/react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppHeader } from "../components/AppHeader";

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
    <div className="page page-narrow">
      <div className="shell">
        <AppHeader
          action={
            <Link className="button button-ghost button-sm" to="/">
              Back
            </Link>
          }
        />

        <main className="panel">
          <p className="eyebrow">Account</p>
          <h2>{mode === "signUp" ? "Create account" : "Sign in"}</h2>
          <p className="panel-lead">
            Authentication is required before creating a permitting project.
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
                className="button button-primary"
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
                className="button button-secondary"
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
        </main>
      </div>
    </div>
  );
}
