export const metadata = { title: 'Privacy Policy - ReachInbox Scheduler' };
export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-12 text-sm leading-6 text-gray-800">
      <h1 className="mb-4 text-2xl font-semibold">Privacy Policy</h1>
      <p className="mb-4">
        ReachInbox Scheduler is an email scheduling demo built as a hiring assignment. This page explains what data it handles.
      </p>
      <h2 className="mb-2 mt-6 text-lg font-semibold">What we collect</h2>
      <p className="mb-4">
        When you sign in with Google, we receive your name, email address and profile picture. We also store the emails you
        schedule: recipients, subject, body and send times.
      </p>
      <h2 className="mb-2 mt-6 text-lg font-semibold">How we use it</h2>
      <p className="mb-4">
        Your Google profile is used only to identify you inside the app. Scheduled emails are sent through a test mail
        service and are not delivered to real inboxes. We do not sell or share your data.
      </p>
      <h2 className="mb-2 mt-6 text-lg font-semibold">Contact</h2>
      <p>Questions or deletion requests: dograchaitanya3@gmail.com</p>
    </main>
  );
}
