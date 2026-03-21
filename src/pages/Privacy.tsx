import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const Privacy = () => (
  <>
    <Helmet>
      <title>Privacy Policy | MyLocalInvest</title>
      <meta name="description" content="Privacy policy for MyLocalInvest — how we collect, use, and protect your personal information." />
      <link rel="canonical" href="https://offer.mylocalinvest.com/privacy" />
      <meta name="robots" content="index, follow" />
    </Helmet>
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <h1 className="text-3xl font-extrabold text-foreground mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-6">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-bold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground">When you submit a form on our website or contact us, we may collect your name, email address, phone number, and property address. We use this information solely to provide you with a cash offer and communicate about your property.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">We use the information you provide to:</p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Evaluate your property and provide a cash offer</li>
              <li>Communicate with you about the offer and closing process</li>
              <li>Improve our services and website experience</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">3. TCPA Compliance</h2>
            <p className="text-muted-foreground">By providing your phone number and submitting a form on our website, you consent to receive calls and text messages from MyLocalInvest regarding your property inquiry. You may opt out at any time by replying STOP to any text message or by contacting us directly. Message and data rates may apply. We will not share your phone number with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">4. Information Sharing</h2>
            <p className="text-muted-foreground">We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website and conducting our business, subject to confidentiality agreements.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">5. Data Security</h2>
            <p className="text-muted-foreground">We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">6. Cookies</h2>
            <p className="text-muted-foreground">Our website may use cookies to enhance your browsing experience. You can set your browser to refuse cookies, though some features may not function properly.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">7. Your Rights</h2>
            <p className="text-muted-foreground">You have the right to request access to, correction of, or deletion of your personal information. To exercise these rights, please contact us at (786) 882-8251 or via the contact form on our website.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">We may update this privacy policy from time to time. Any changes will be posted on this page with an updated revision date.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground">9. Contact Us</h2>
            <p className="text-muted-foreground">If you have questions about this privacy policy, please contact us:</p>
            <p className="text-muted-foreground">Phone: <a href="tel:+17868828251" className="text-primary hover:underline">(786) 882-8251</a></p>
            <p className="text-muted-foreground">MyLocalInvest — Orlando, FL</p>
          </section>
        </div>
      </div>
    </main>
  </>
);

export default Privacy;
