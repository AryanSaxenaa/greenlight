import { LegalPageLayout } from "../components/LegalPageLayout";

export function PrivacyPage() {
  return (
    <LegalPageLayout
      title="Privacy Policy"
      description="How Greenlight collects, uses, and protects your information."
      path="/privacy"
    >
      <p>
        <strong>Last updated:</strong> September 20, 2026
      </p>
      <p>
        Greenlight (&quot;we&quot;, &quot;us&quot;) helps homeowners and
        professionals compile permitting requirements for Los Angeles residential
        projects. This policy describes what we collect and how we use it.
      </p>

      <h2>Information we collect</h2>
      <ul>
        <li>
          Account information such as email address and authentication
          credentials.
        </li>
        <li>
          Project details you provide, including property addresses, project
          intent, uploaded documents, and correspondence drafts.
        </li>
        <li>
          Technical data such as browser type, session identifiers, and usage
          logs needed to operate the service.
        </li>
      </ul>

      <h2>How we use information</h2>
      <ul>
        <li>Authenticate users and maintain secure sessions.</li>
        <li>Compile jurisdiction-specific permitting requirements.</li>
        <li>Process inbound agency email and generate draft responses.</li>
        <li>Improve reliability, security, and product performance.</li>
      </ul>

      <h2>Cookies and local storage</h2>
      <p>
        We use essential cookies and local storage for authentication and to
        remember your cookie consent preference. We do not use third-party
        advertising cookies.
      </p>

      <h2>Third-party services</h2>
      <p>
        Greenlight uses backend services including Convex (database and
        hosting), OpenAI (structured extraction), Firecrawl (official source
        research), and AgentMail (email delivery). Data sent to these providers
        is limited to what is required to operate your project.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain project and account data while your account is active. You may
        request deletion by contacting us. Some logs may be retained for security
        and compliance for a limited period.
      </p>

      <h2>Your choices</h2>
      <ul>
        <li>You can sign out at any time from the dashboard header.</li>
        <li>
          You can decline non-essential cookies using the banner on first visit.
        </li>
        <li>
          You can contact us to request access to or deletion of your account
          data.
        </li>
      </ul>

      <h2>Contact</h2>
      <p>
        Questions about this policy? Email{" "}
        <a href="mailto:privacy@greenlight.app">privacy@greenlight.app</a>.
      </p>
    </LegalPageLayout>
  );
}
