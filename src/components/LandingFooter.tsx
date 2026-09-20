import { Link } from "react-router-dom";

type LandingFooterProps = {
  signedIn: boolean;
};

export function LandingFooter({ signedIn }: LandingFooterProps) {
  return (
    <footer className="landing-footer">
      <div className="landing-section-inner">
      <div className="landing-footer-inner">
        <div>
          <p className="landing-footer-brand">Greenlight</p>
          <p className="landing-footer-tagline">
            AI permitting for Los Angeles residential work.
          </p>
        </div>
        <div className="landing-footer-links">
          <a href="#product">Product</a>
          <a href="#how-it-works">How it works</a>
          <a
            href="https://github.com/AryanSaxenaa/greenlight"
            target="_blank"
            rel="noreferrer"
          >
            Docs
          </a>
        </div>
        <Link
          className="button button-landing-primary"
          to={signedIn ? "/projects/new" : "/auth"}
        >
          Start a project
        </Link>
      </div>
      <p className="landing-footer-note">
        Built for ADUs, garage conversions, and small residential projects in Los
        Angeles.
      </p>
      </div>
    </footer>
  );
}
