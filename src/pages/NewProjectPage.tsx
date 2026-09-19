import { useMutation, useQuery } from "convex/react";
import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";

export function NewProjectPage() {
  const navigate = useNavigate();
  const viewer = useQuery(api.users.viewer);
  const createProject = useMutation(api.projects.create);
  const [intent, setIntent] = useState(
    "Convert my detached garage into an ADU",
  );
  const [address, setAddress] = useState(
    "1448 Alvarado St, Los Angeles, CA 90026",
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (viewer === null) {
    return <Navigate to="/auth" replace />;
  }

  if (viewer === undefined) {
    return (
      <div className="shell">
        <p className="muted">Checking session...</p>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const projectId = await createProject({ intent, address });
      navigate(`/projects/${projectId}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create project.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="shell">
      <header className="topbar">
        <Link className="brand" to="/">
          <span className="brand-mark" aria-hidden="true" />
          <span>GREENLIGHT</span>
        </Link>
      </header>

      <main className="panel" style={{ maxWidth: "720px" }}>
        <h2>What are you trying to build?</h2>
        <p className="muted">
          Start with natural language. Greenlight resolves jurisdiction, crawls
          official sources, and compiles your permit graph.
        </p>

        <form className="form-grid" onSubmit={onSubmit}>
          <label>
            Project intent
            <textarea
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              required
              minLength={8}
            />
          </label>

          <label>
            Property address
            <input
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              required
              minLength={5}
              placeholder="Street, city, state"
            />
          </label>

          {error ? <p className="error">{error}</p> : null}

          <div className="cta-row">
            <button
              className="button button-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? "Compiling..." : "Compile project"}
            </button>
            <Link className="button button-secondary" to="/">
              Back
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
