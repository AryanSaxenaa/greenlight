import { LegalPageLayout } from "../components/LegalPageLayout";

export function TermsPage() {
  return (
    <LegalPageLayout
      title="Terms & Conditions"
      description="Terms of use for the Greenlight permitting platform."
      path="/terms"
    >
      <p>
        <strong>Last updated:</strong> September 20, 2026
      </p>
      <p>
        By accessing or using Greenlight, you agree to these Terms. If you do not
        agree, do not use the service.
      </p>

      <h2>Service description</h2>
      <p>
        Greenlight is an informational permitting workflow tool. It compiles
        requirements from public sources and helps you track project readiness.
        It does not guarantee permit approval, legal compliance, or agency
        outcomes.
      </p>

      <h2>Eligibility</h2>
      <p>
        You must be at least 18 years old and able to form a binding contract.
        You are responsible for the accuracy of information you submit,
        including property addresses and project descriptions.
      </p>

      <h2>Acceptable use</h2>
      <ul>
        <li>Do not submit false, misleading, or fraudulent project data.</li>
        <li>Do not attempt to access other users&apos; projects or accounts.</li>
        <li>Do not scrape, overload, or disrupt the platform or its integrations.</li>
        <li>Do not use automated bots to create spam accounts or projects.</li>
      </ul>

      <h2>Professional advice</h2>
      <p>
        Greenlight is not a substitute for licensed architects, engineers,
        expeditors, attorneys, or city officials. Always verify requirements
        with the relevant jurisdiction before submitting applications.
      </p>

      <h2>Accounts and security</h2>
      <p>
        You are responsible for safeguarding your login credentials and for all
        activity under your account. Notify us promptly if you suspect
        unauthorized access.
      </p>

      <h2>Availability</h2>
      <p>
        We may modify, suspend, or discontinue features at any time. During beta
        and hackathon periods, the service may be unavailable or contain errors.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, Greenlight and its contributors
        are not liable for indirect, incidental, or consequential damages arising
        from your use of the service, including permit delays, rejections, or
        project costs.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these Terms from time to time. Continued use after changes
        are posted constitutes acceptance of the revised Terms.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? Email{" "}
        <a href="mailto:legal@greenlight.app">legal@greenlight.app</a>.
      </p>
    </LegalPageLayout>
  );
}
