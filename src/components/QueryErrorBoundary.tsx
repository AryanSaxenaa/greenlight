import { Component, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { formatConvexError } from "../lib/errors";
import { AppPageLayout } from "./AppPageLayout";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
};

export class QueryErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      const message = formatConvexError(this.state.error);
      const needsAuth = message.includes("sign in");

      return (
        <AppPageLayout wide>
          <p className="error">{message}</p>
          <div className="cta-row">
            {needsAuth ? (
              <Link className="button button-landing-primary" to="/auth">
                Sign in
              </Link>
            ) : null}
            <Link className="button button-landing-secondary" to="/">
              Back home
            </Link>
          </div>
        </AppPageLayout>
      );
    }

    return this.props.children;
  }
}
