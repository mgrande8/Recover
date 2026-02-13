import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms of Service | Recover',
  description: 'Terms of Service for the Recover app',
};

export default function TermsPage() {
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
          <h1 className="text-lg font-semibold text-text-primary">Terms of Service</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <div className="prose prose-invert max-w-none">
          <p className="text-text-secondary text-sm mb-6">Last updated: January 24, 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">1. Acceptance of Terms</h2>
            <p className="text-text-secondary mb-4">
              By accessing or using the Recover app (&quot;Service&quot;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">2. Description of Service</h2>
            <p className="text-text-secondary mb-4">
              Recover is a sleep tracking and recovery optimization application designed to help users
              monitor their sleep patterns and improve their overall well-being. The Service includes
              both free and premium (Pro) features.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">3. User Accounts</h2>
            <p className="text-text-secondary mb-4">
              You are responsible for maintaining the confidentiality of your account credentials and
              for all activities that occur under your account. You agree to notify us immediately of
              any unauthorized use of your account.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">4. Subscriptions and Payments</h2>
            <p className="text-text-secondary mb-4">
              Recover Pro is available as an auto-renewable subscription. Payment will be charged to your
              Apple ID account at confirmation of purchase. Your subscription automatically renews unless
              canceled at least 24 hours before the end of the current period. You can manage and cancel
              your subscriptions by going to your App Store account settings.
            </p>
            <p className="text-text-secondary mb-4">
              Subscription options:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>Monthly: $2.99 USD per month</li>
              <li>Annual: $19.99 USD per year</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">5. Health Disclaimer</h2>
            <p className="text-text-secondary mb-4">
              Recover is intended for informational and educational purposes only. The Service is not
              intended to be a substitute for professional medical advice, diagnosis, or treatment.
              Always seek the advice of your physician or other qualified health provider with any
              questions you may have regarding a medical condition or sleep disorder.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">6. User Data</h2>
            <p className="text-text-secondary mb-4">
              You retain ownership of all data you input into the Service. By using the Service, you
              grant us permission to use this data to provide and improve the Service. We handle your
              data in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">7. Account Deletion</h2>
            <p className="text-text-secondary mb-4">
              You may delete your account at any time through the Settings page in the app. Upon deletion,
              all your personal data will be permanently removed from our servers. Any active subscriptions
              will be canceled.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">8. Prohibited Uses</h2>
            <p className="text-text-secondary mb-4">
              You agree not to use the Service:
            </p>
            <ul className="list-disc pl-6 text-text-secondary mb-4">
              <li>For any unlawful purpose</li>
              <li>To harass, abuse, or harm others</li>
              <li>To interfere with or disrupt the Service</li>
              <li>To attempt to gain unauthorized access to any portion of the Service</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">9. Limitation of Liability</h2>
            <p className="text-text-secondary mb-4">
              To the maximum extent permitted by law, Recover shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages resulting from your use of or
              inability to use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">10. Changes to Terms</h2>
            <p className="text-text-secondary mb-4">
              We reserve the right to modify these terms at any time. We will notify users of any
              material changes by posting the new Terms of Service on this page.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-text-primary mb-3">11. Contact Us</h2>
            <p className="text-text-secondary mb-4">
              If you have any questions about these Terms, please contact us at recover.sleep@gmail.com.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
