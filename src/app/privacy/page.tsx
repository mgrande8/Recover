import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy | Recover',
  description: 'Privacy Policy for the Recover app',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 pt-safe">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center">
          <Link
            href="/dashboard/upgrade"
            className="text-text-secondary hover:text-text-primary transition-colors mr-4"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-semibold text-text-primary">Privacy Policy</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-invert max-w-none">
          <p className="text-text-secondary text-sm mb-6">Last updated: January 27, 2025</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
            <p className="text-text-secondary mb-4">
              Recover (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, disclose, and safeguard your information when you use our
              mobile application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-text-primary mb-2">Personal Information</h3>
            <p className="text-text-secondary mb-4">
              When you create an account, we collect:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Profile preferences (user type, goals, sleep preferences)</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mb-2">Health and Sleep Data</h3>
            <p className="text-text-secondary mb-4">
              To provide our services, we collect:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Sleep duration and timing</li>
              <li>Sleep quality ratings</li>
              <li>Recovery readiness assessments</li>
              <li>Sleep-related habits and behaviors</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mb-2">Usage Data</h3>
            <p className="text-text-secondary mb-4">
              We automatically collect certain information about your device and usage patterns to
              improve our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
            <p className="text-text-secondary mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Provide and maintain our Service</li>
              <li>Track your sleep patterns and provide insights</li>
              <li>Calculate your recovery readiness</li>
              <li>Send you notifications (with your permission)</li>
              <li>Process subscription payments</li>
              <li>Improve and personalize your experience</li>
              <li>Communicate with you about updates or support</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Data Storage and Security</h2>
            <p className="text-text-secondary mb-4">
              Your data is stored securely using industry-standard encryption and security practices.
              We use Supabase as our database provider, which implements robust security measures
              including encryption at rest and in transit.
            </p>
            <p className="text-text-secondary mb-4">
              We retain your data for as long as your account is active. You can request deletion of
              your data at any time through the app settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Data Sharing</h2>
            <p className="text-text-secondary mb-4">
              We do not sell your personal information. We may share your information only in the
              following circumstances:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>With service providers who assist in operating our Service (e.g., hosting, payment processing)</li>
              <li>To comply with legal obligations</li>
              <li>To protect our rights and safety</li>
              <li>With your explicit consent</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Third-Party Services</h2>
            <p className="text-text-secondary mb-4">
              Our Service uses the following third-party services:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Apple App Store</strong> - Subscription management and payments</li>
              <li><strong>Vercel</strong> - Application hosting</li>
            </ul>
            <p className="text-text-secondary mb-4">
              Each of these services has their own privacy policies governing their use of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Your Rights</h2>
            <p className="text-text-secondary mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your account and all associated data</li>
              <li>Export your data</li>
              <li>Opt out of marketing communications</li>
            </ul>
            <p className="text-text-secondary mb-4">
              To exercise these rights, use the settings within the app or contact us directly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Push Notifications</h2>
            <p className="text-text-secondary mb-4">
              With your permission, we may send push notifications for bedtime reminders and other
              sleep-related alerts. You can manage notification preferences in your device settings
              at any time.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Children&apos;s Privacy</h2>
            <p className="text-text-secondary mb-4">
              Our Service is not intended for children under 13. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information,
              please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">10. Changes to This Policy</h2>
            <p className="text-text-secondary mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">11. Contact Us</h2>
            <p className="text-text-secondary mb-4">
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-text-secondary">
              Email: support@recover-app.com
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
