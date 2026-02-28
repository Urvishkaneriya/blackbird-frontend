import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Blackbird Tattoo Management System',
  description: 'Privacy Policy for Blackbird Tattoo Management System and WhatsApp messaging workflows.',
};

const LAST_UPDATED = 'February 28, 2026';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-4xl px-4 py-10 md:px-6 md:py-14">
        <div className="mb-8 flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold md:text-3xl">Privacy Policy</h1>
          <Link
            href="/login"
            className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted"
          >
            Back To Login
          </Link>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 md:p-7 space-y-6">
          <p className="text-sm text-muted-foreground">Last updated: {LAST_UPDATED}</p>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">1. Who We Are</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Blackbird Tattoo Management System (Blackbird, we, us, our) is used by Blackbird Tattoo & Art Studio
              to manage customers, bookings, branches, staff operations, billing information, and WhatsApp communications.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">2. Information We Collect</h2>
            <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
              <li>Customer data: name, phone number, email (optional), birthday, and booking history.</li>
              <li>Booking data: products/services, pricing, payment details (cash/UPI split), artist, branch, booking date.</li>
              <li>Staff/admin account data: name, email, role, branch assignment, and login metadata.</li>
              <li>System data: audit, diagnostics, and security logs needed to operate and secure the service.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">3. How We Use Information</h2>
            <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
              <li>To create and manage bookings, invoices, and customer records.</li>
              <li>To operate business analytics dashboards and performance reporting.</li>
              <li>To send WhatsApp messages (for example reminders, updates, and approved marketing messages).</li>
              <li>To secure accounts, prevent abuse, and meet legal and compliance obligations.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">4. WhatsApp And Meta Platform Processing</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              When we send or receive WhatsApp business messages, message data is processed through WhatsApp/Meta platform infrastructure.
              We use that processing only for legitimate business purposes, and we are responsible for obtaining any required notices,
              lawful basis, and consent under applicable law before messaging users.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">5. Sharing Of Information</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We do not sell personal information. We may share data with:
            </p>
            <ul className="list-disc pl-5 text-sm leading-6 text-muted-foreground space-y-1">
              <li>WhatsApp/Meta as needed to deliver business messaging features.</li>
              <li>Technical service providers that host, secure, or support this system.</li>
              <li>Authorities when legally required, or to protect legal rights and platform safety.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">6. Data Retention</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We retain information only as long as needed for booking operations, legal/accounting requirements, and dispute resolution.
              Data that is no longer required is deleted or anonymized according to operational and legal retention obligations.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">7. Security</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We use access controls, authentication, encryption in transit, and monitoring to protect personal data.
              No internet system can be guaranteed 100% secure, but we continuously improve safeguards.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">8. Your Privacy Rights</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Depending on your location, you may have rights to access, correct, delete, or object to use of your personal data.
              To exercise rights, contact us using the details below.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">9. Contact</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              Privacy contact: <a className="underline" href="mailto:blackbirdtatto12@gmail.com">blackbirdtatto12@gmail.com</a>
            </p>
            <p className="text-sm leading-6 text-muted-foreground">
              Business: Blackbird Tattoo & Art Studio
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">10. Changes To This Policy</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              We may update this Privacy Policy from time to time. Material changes will be reflected by updating the Last updated date.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
