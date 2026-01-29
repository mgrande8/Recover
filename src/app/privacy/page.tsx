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
          <p className="text-text-secondary text-sm mb-6">Last updated: January 24, 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Introduction</h2>
            <p className="text-text-secondary mb-4">
              Recover (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy
              explains how we collect, use, and safeguard your information when you use the Recover - Sleep Tracker
              mobile application (&quot;App&quot;).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. Information We Collect</h2>

            <h3 className="text-lg font-medium text-text-primary mb-2">Personal Information</h3>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Email Address: Used for account creation and communication</li>
              <li>Name (optional): Used for personalization</li>
              <li>Profile preferences: User type, goals, and sleep preferences</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mb-2">Sleep and Health Data</h3>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Sleep logs, quality ratings, and recovery metrics you manually enter</li>
              <li>Checklist and habit tracking data</li>
              <li>Streak and consistency data</li>
            </ul>

            <h3 className="text-lg font-medium text-text-primary mb-2">Automatically Collected Data</h3>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>User ID and account identifiers</li>
              <li>Usage analytics and interaction data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>App Functionality: Provide sleep tracking and analytics features</li>
              <li>Personalization: Customize insights and recommendations based on your data</li>
              <li>Communications: Send important updates and notifications (with your permission)</li>
              <li>Service Improvement: Analyze usage patterns to improve the app experience</li>
              <li>Subscription Management: Process and manage in-app purchases</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Data Security</h2>
            <p className="text-text-secondary mb-4">
              We implement industry-standard security measures to protect your data:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Data is stored securely using Supabase with encryption at rest</li>
              <li>All data transmissions are protected using SSL/TLS encryption</li>
              <li>We never sell your personal information to third parties</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Third-Party Services</h2>
            <p className="text-text-secondary mb-4">
              Our App uses the following third-party services to support operations:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li><strong>Supabase</strong> - Database, authentication, and secure data storage</li>
              <li><strong>Apple</strong> - App distribution and subscription payment processing</li>
              <li><strong>Vercel</strong> - Application hosting and deployment</li>
            </ul>
            <p className="text-text-secondary mb-4">
              Each of these services has their own privacy policies governing their use of your data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. Your Rights</h2>
            <p className="text-text-secondary mb-4">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Access your personal data</li>
              <li>Delete your account and all associated data through the app settings</li>
              <li>Opt out of non-essential communications</li>
              <li>Export your data</li>
            </ul>
            <p className="text-text-secondary mb-4">
              To exercise these rights, use the settings within the app or contact us at recover.sleep@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Data Retention</h2>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Active accounts: Data is retained for as long as your account is active</li>
              <li>Deleted accounts: Personal data is purged within 30 days of account deletion</li>
              <li>Backups: Backup data is removed within 90 days of account deletion</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Children&apos;s Privacy</h2>
            <p className="text-text-secondary mb-4">
              Our App is not intended for users under 13 years of age. We do not knowingly collect personal
              information from children under 13. If you believe we have collected such information,
              please contact us immediately at recover.sleep@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Changes to This Policy</h2>
            <p className="text-text-secondary mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes
              through app notifications or email. Your continued use of the App after changes indicates
              acceptance of the updated policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">10. Contact Us</h2>
            <p className="text-text-secondary mb-4">
              If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
            </p>
            <p className="text-text-secondary mb-2">
              Email: recover.sleep@gmail.com
            </p>
            <p className="text-text-secondary">
              We aim to respond to all inquiries within 48 hours.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
