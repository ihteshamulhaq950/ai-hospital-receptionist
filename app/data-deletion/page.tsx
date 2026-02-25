const DataDeletionPage = () => {
  return (
    <main className="max-w-3xl mx-auto p-6">
      {/* Page Title */}
      <h1 className="text-3xl font-bold mb-4">User Data Deletion - Care Link AI</h1>

      <p>
        Care Link AI processes messages using two bots:
      </p>

      <ul className="list-disc ml-6 mt-2">
        <li><strong>Custom bot:</strong> messages are stored anonymously, without collecting emails or personal information.</li>
        <li><strong>WhatsApp bot:</strong> messages are not stored.</li>
      </ul>

      <section className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Data Deletion Requests</h2>
        <p>
          Since WhatsApp bot messages are not stored, no deletion is necessary. For custom bot messages, they are stored anonymously. 
          If you have concerns or questions, you can contact us at <a href="mailto:ulhaqihtesham30@gmail.com" className="text-blue-600">ulhaqihtesham30@gmail.com</a>.
        </p>
      </section>
    </main>
  );
};

export default DataDeletionPage;

