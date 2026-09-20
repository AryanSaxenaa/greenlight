import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { COOKIE_CONSENT_KEY } from "../lib/site";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function accept() {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    setVisible(false);
  }

  function decline() {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-consent" role="dialog" aria-label="Cookie notice">
      <div className="cookie-consent-inner">
        <p>
          We use essential cookies for authentication and session management.
          See our{" "}
          <Link to="/privacy">Privacy Policy</Link> for details.
        </p>
        <div className="cookie-consent-actions">
          <button
            className="button button-landing-secondary"
            type="button"
            onClick={decline}
          >
            Dismiss
          </button>
          <button
            className="button button-landing-primary"
            type="button"
            onClick={accept}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
