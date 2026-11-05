import { Link } from 'react-router-dom';
import { PageHero } from '../components/ui/Section.jsx';
import { Placeholder } from '../components/ui/Feedback.jsx';
import { usePageMeta } from '../lib/hooks.js';
import { church, donationDisclosure } from '../data/site.js';

const NOTICE = 'Template – have this reviewed by the ministry and a qualified adviser before launch';

export function Privacy() {
  usePageMeta('Privacy Policy', 'How House of Love International Ministries collects, uses and protects your personal information.');
  return (
    <>
      <PageHero eyebrow="Legal" title="Privacy Policy" crumbs={[{ label: 'Privacy Policy' }]} />
      <section className="section-tight">
        <div className="container prose">
          <p><Placeholder>{NOTICE}</Placeholder></p>
          <p>{church.name} (“we”, “us”) respects your privacy. This policy explains what information we collect through this website and how we use it.</p>
          <h2>Information we collect</h2>
          <ul>
            <li><strong>Contact form & event registrations:</strong> your name, email address, phone number (optional) and message.</li>
            <li><strong>Newsletter:</strong> your email address.</li>
            <li><strong>Store orders:</strong> your name, email, phone (optional), shipping address and the items you purchase.</li>
            <li><strong>Donations:</strong> your name (unless you give anonymously), email address, gift amount, frequency and optional message.</li>
          </ul>
          <h2>Payments</h2>
          <p>All payments are processed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe</a>. Card details are entered on Stripe’s secure pages and are never sent to or stored on our servers. We store only payment references (such as Stripe transaction IDs) needed for our records.</p>
          <h2>How we use your information</h2>
          <ul>
            <li>To respond to your messages and prayer requests.</li>
            <li>To process and deliver orders and send receipts.</li>
            <li>To record donations and send donation receipts.</li>
            <li>To send newsletters you have subscribed to (you can unsubscribe at any time).</li>
          </ul>
          <p>We do not sell your personal information.</p>
          <h2>Storage & cookies</h2>
          <p>Your shopping cart is stored in your browser’s local storage. Staff sign-in uses a secure, HTTP-only session cookie. We do not use advertising cookies.</p>
          <h2>Your choices</h2>
          <p>To access, correct or delete your information, contact us at <a href={`mailto:${church.email}`}>{church.email}</a>.</p>
        </div>
      </section>
    </>
  );
}

export function Terms() {
  usePageMeta('Terms & Conditions', 'Terms and conditions for using the House of Love International Ministries website, store and online giving.');
  return (
    <>
      <PageHero eyebrow="Legal" title="Terms & Conditions" crumbs={[{ label: 'Terms & Conditions' }]} />
      <section className="section-tight">
        <div className="container prose">
          <p><Placeholder>{NOTICE}</Placeholder></p>
          <p>By using this website you agree to these terms.</p>
          <h2>Store orders</h2>
          <ul>
            <li>Prices are shown in US dollars and are confirmed at checkout. Shipping costs are calculated at checkout.</li>
            <li>Orders are confirmed only after successful payment through Stripe.</li>
            <li>Returns & exchanges policy: <em>to be provided by the ministry</em>.</li>
          </ul>
          <h2 id="donations">Donations</h2>
          <ul>
            <li>One-time donations are charged once. Monthly donations are charged on the same date each month until cancelled.</li>
            <li>To change or cancel a monthly gift, contact the church office at <a href={`mailto:${church.email}`}>{church.email}</a>.</li>
            <li>Refund requests for donations made in error should be made to the church office promptly.</li>
          </ul>
          <p>{donationDisclosure}</p>
          <h2>Content</h2>
          <p>Website content, logos and designs belong to {church.name} and may not be reused without permission.</p>
          <p className="mt-4"><Link to="/contact">Contact us</Link> with any questions about these terms.</p>
        </div>
      </section>
    </>
  );
}
