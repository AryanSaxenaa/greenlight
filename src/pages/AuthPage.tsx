import { useAuthActions } from "@convex-dev/auth/react";
import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";
import { HoneypotField } from "../components/HoneypotField";
import { PageMeta } from "../components/PageMeta";
import { formatConvexError } from "../lib/errors";
import {
  isHoneypotFilled,
  validateEmail,
  validatePassword,
} from "../lib/formValidation";

export function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuthActions();
  const viewer = useQuery(api.users.viewer);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">(
    searchParams.get("mode") === "signIn" ? "signIn" : "signUp",
  );
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (viewer) {
      navigate("/projects");
    }
  }, [viewer, navigate]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (isHoneypotFilled(website)) {
      return;
    }

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const nextFieldErrors = {
      email: emailError ?? undefined,
      password: passwordError ?? undefined,
    };
    setFieldErrors(nextFieldErrors);

    if (emailError || passwordError) {
      setError(emailError ?? passwordError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await signIn("password", {
        email: email.trim(),
        password,
        flow: mode,
      });
      navigate("/projects");
    } catch (caught) {
      setError(formatConvexError(caught));
      setSubmitting(false);
    }
  }

  return (
    <AppPageLayout>
      <PageMeta
        title="Sign in"
        description="Create a Greenlight account or sign in to manage your Los Angeles permitting projects."
        path="/auth"
        noIndex
      />
      <div className="app-card app-card-narrow">
        <p className="landing-section-kicker">Account</p>
        <h2 className="app-card-title">
          {mode === "signUp" ? "Create account" : "Sign in"}
        </h2>
        <p className="app-card-lead">
          Start a permitting project in Los Angeles. Your control room, permit
          graph, and agency correspondence stay tied to this account.
        </p>

        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <HoneypotField value={website} onChange={setWebsite} />

          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(fieldErrors.email)}
            />
            {fieldErrors.email ? (
              <span className="field-error">{fieldErrors.email}</span>
            ) : null}
          </label>

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={8}
              maxLength={128}
              autoComplete={
                mode === "signUp" ? "new-password" : "current-password"
              }
              placeholder="At least 8 characters"
              aria-invalid={Boolean(fieldErrors.password)}
            />
            {fieldErrors.password ? (
              <span className="field-error">{fieldErrors.password}</span>
            ) : null}
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
              onClick={() => {
                setError(null);
                setFieldErrors({});
                setMode((current) =>
                  current === "signUp" ? "signIn" : "signUp",
                );
              }}
            >
              {mode === "signUp" ? "Use existing account" : "Create account"}
            </button>
          </div>
        </form>

        {mode === "signIn" ? (
          <p className="muted app-card-foot">
            Forgot your password? Reset is not available yet. Create a new
            account with a different email, or contact support.
          </p>
        ) : null}

        <p className="app-card-foot">
          By continuing, you agree to our{" "}
          <Link to="/terms">Terms</Link> and{" "}
          <Link to="/privacy">Privacy Policy</Link>.
        </p>

        <p className="app-card-foot">
          <Link to="/">Back to home</Link>
        </p>
      </div>
    </AppPageLayout>
  );
}
