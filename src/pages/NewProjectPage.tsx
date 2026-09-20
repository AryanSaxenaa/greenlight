import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import { AppPageLayout } from "../components/AppPageLayout";
import { HoneypotField } from "../components/HoneypotField";
import { PageMeta } from "../components/PageMeta";
import { authRedirectPath } from "../lib/authRedirect";
import { formatConvexError } from "../lib/errors";
import {
  isHoneypotFilled,
  validateProjectAddress,
  validateProjectIntent,
} from "../lib/formValidation";

export function NewProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const viewer = useQuery(api.users.viewer);
  const createProject = useMutation(api.projects.create);
  const [intent, setIntent] = useState(
    "Convert my detached garage into an ADU",
  );
  const [address, setAddress] = useState(
    "1448 Alvarado St, Los Angeles, CA 90026",
  );
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    intent?: string;
    address?: string;
  }>({});
  const [submitting, setSubmitting] = useState(false);

  if (viewer === null) {
    return (
      <Navigate
        to={authRedirectPath(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (viewer === undefined) {
    return (
      <AppPageLayout>
        <p className="muted">Checking session...</p>
      </AppPageLayout>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();

    if (isHoneypotFilled(website)) {
      return;
    }

    const intentError = validateProjectIntent(intent);
    const addressError = validateProjectAddress(address);
    const nextFieldErrors = {
      intent: intentError ?? undefined,
      address: addressError ?? undefined,
    };
    setFieldErrors(nextFieldErrors);

    if (intentError || addressError) {
      setError(intentError ?? addressError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const projectId = await createProject({
        intent: intent.trim(),
        address: address.trim(),
        website: website.trim() || undefined,
      });
      navigate(`/projects/${projectId}`);
    } catch (caught) {
      setError(formatConvexError(caught));
      setSubmitting(false);
    }
  }

  return (
    <AppPageLayout>
      <PageMeta
        title="New project"
        description="Describe your Los Angeles residential project and compile your permit graph."
        path="/projects/new"
        noIndex
      />
      <div className="app-card app-card-narrow">
        <p className="landing-section-kicker">New project</p>
        <h2 className="app-card-title">What are you trying to build?</h2>
        <p className="app-card-lead">
          Describe your project in plain language. Greenlight resolves your LA
          jurisdiction, crawls official sources, and compiles your live permit
          graph.
        </p>

        <form className="form-grid" onSubmit={onSubmit} noValidate>
          <HoneypotField value={website} onChange={setWebsite} />

          <label>
            Project intent
            <textarea
              id="new-project-intent"
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              required
              minLength={8}
              maxLength={2000}
              aria-invalid={Boolean(fieldErrors.intent)}
              aria-describedby={
                fieldErrors.intent ? "new-project-intent-error" : undefined
              }
            />
            {fieldErrors.intent ? (
              <span className="field-error" id="new-project-intent-error">
                {fieldErrors.intent}
              </span>
            ) : null}
          </label>

          <label>
            Property address
            <input
              id="new-project-address"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              minLength={10}
              maxLength={300}
              placeholder="Street, city, state"
              aria-invalid={Boolean(fieldErrors.address)}
              aria-describedby={
                fieldErrors.address ? "new-project-address-error" : undefined
              }
            />
            {fieldErrors.address ? (
              <span className="field-error" id="new-project-address-error">
                {fieldErrors.address}
              </span>
            ) : null}
          </label>

          {error ? <p className="error">{error}</p> : null}

          <div className="cta-row">
            <button
              className="button button-landing-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Compiling..." : "Compile project"}
            </button>
            <Link className="button button-landing-secondary" to="/projects">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </AppPageLayout>
  );
}
