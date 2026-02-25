const PrivacyPolicyPage = () => {
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-4">Privacy Policy - Care Link AI</h1>

      <p>Effective Date: February 25, 2026</p>

      {/* Information Collected */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Information We Collect</h2>
        <p>
          - <strong>Custom bot:</strong> stores messages anonymously. No emails or personal information are collected.
        </p>
        <p>
          - <strong>WhatsApp bot:</strong> messages are not stored. All messages are processed temporarily to generate replies.
        </p>
      </section>

      {/* How Data is Used */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">How We Use Your Data</h2>
        <p>
          Messages are used only to generate immediate replies for both bots. Anonymous storage in the custom bot is used solely for improving responses and analytics.
        </p>
      </section>

      {/* Security */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Security</h2>
        <p>
          Reasonable measures are taken to secure anonymous data for the custom bot. WhatsApp bot messages are not stored, reducing any security risk.
        </p>
      </section>

      {/* Third-Party Services */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Third-Party Services</h2>
        <p>
          The WhatsApp bot uses the WhatsApp Cloud API to send and receive messages. Data is processed by WhatsApp according to their privacy policies.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p>
          For questions regarding your privacy or this policy, email us at <a href="mailto:ulhaqihtesham30@gmail.com" className="text-blue-600">ulhaqihtesham30@gmail.com</a>.
        </p>
      </section>
    </main>
  );
};

export default PrivacyPolicyPage;
