
const TermsOfServicePage = () => {
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-4">Terms of Service - Care Link AI</h1>

      <p>Effective Date: February 25, 2026</p>

      {/* Use of Service */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Use of Service</h2>
        <p>
          Care Link AI provides automated answers via two bots:
          <ul className="list-disc ml-6 mt-2">
            <li><strong>Custom bot:</strong> stores messages anonymously to improve service.</li>
            <li><strong>WhatsApp bot:</strong> answers messages directly without storing any messages.</li>
          </ul>
        </p>
      </section>

      {/* Data Storage */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Data Storage</h2>
        <p>
          - Custom bot messages are stored anonymously for analytics and improvement.  
          - WhatsApp bot messages are not stored.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Disclaimer</h2>
        <p>
          All responses are generated automatically. We do not guarantee accuracy or completeness. Use the responses at your own discretion.
        </p>
      </section>

      {/* Changes to Terms */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Changes to Terms</h2>
        <p>
          We may update these terms at any time. Continued use of the service indicates acceptance of updated terms.
        </p>
      </section>

      {/* Contact */}
      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Contact</h2>
        <p>
          Questions regarding these terms: <a href="mailto:ulhaqihtesham30@gmail.com" className="text-blue-600">ulhaqihtesham30@gmail.com</a>.
        </p>
      </section>
    </main>
  );
};

export default TermsOfServicePage;
