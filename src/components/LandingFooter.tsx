import { Link } from "react-router-dom";

export function LandingFooter() {
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
            <a href="#stack">Stack</a>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <a
              href="https://www.convex.dev/hackathons/all-gas"
              target="_blank"
              rel="noreferrer"
            >
              All Gas Hackathon
            </a>
            <a
              href="https://github.com/AryanSaxenaa/greenlight"
              target="_blank"
              rel="noreferrer"
            >
              Source
            </a>
          </div>
        </div>
        <p className="landing-footer-note">
          Built for the{" "}
          <a
            href="https://www.convex.dev/hackathons/all-gas"
            target="_blank"
            rel="noreferrer"
          >
            Convex All Gas Hackathon
          </a>
          . Powered by{" "}
          <a href="https://convex.dev" target="_blank" rel="noreferrer">
            Convex
          </a>
          ,{" "}
          <a href="https://openai.com" target="_blank" rel="noreferrer">
            OpenAI
          </a>
          ,{" "}
          <a href="https://firecrawl.dev" target="_blank" rel="noreferrer">
            Firecrawl
          </a>
          , and{" "}
          <a href="https://agentmail.to" target="_blank" rel="noreferrer">
            AgentMail
          </a>
          .
        </p>
      </div>
    </footer>
  );
}
