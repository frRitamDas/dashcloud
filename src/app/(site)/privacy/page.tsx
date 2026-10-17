import type { Metadata } from 'next';
import { LegalLayout, type LegalSection } from '@/components/legal/LegalLayout';
import { getSiteSettings } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Privacy policy',
  description: 'How Dash Cloud Gaming collects, uses and protects your data — and what you can ask us to delete.',
};

export default async function PrivacyPage() {
  const { site } = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      heading: 'What we collect',
      body: (
        <>
          <p>
            We keep collection deliberately small. When you create an account we store your email address, a player name
            and a country code. When you play we store game sessions (which title, which region, when it started and
            ended), scores you submit, and favourites you mark.
          </p>
          <p>
            If you open a support ticket we store the name, email, subject and message you send. If you browse without an
            account we store a short-lived local identifier so guest runs and rate limiting work; it never leaves your
            device in a form that identifies you.
          </p>
        </>
      ),
    },
    {
      heading: 'Why we collect it',
      body: (
        <>
          <p>
            Session and score data powers your profile, XP, cloud saves and the leaderboards. Region data lets us route
            you to the nearest GPU pool. Support tickets exist so an operator can answer you. Aggregate, non-identifying
            counts (players online, queue length, region load) are shown on the public status page.
          </p>
          <p>We do not sell personal data, and we do not build advertising profiles from your play history.</p>
        </>
      ),
    },
    {
      heading: 'Where it lives',
      body: (
        <>
          <p>
            All application data is stored in a single Supabase Postgres project. The web app runs on Vercel. Both
            providers hold data in regionally distributed infrastructure; the database region for Dash is Singapore
            (ap-southeast-1).
          </p>
          <p>
            Access is governed by Postgres row-level security: your profile, sessions, scores and favourites are readable
            and writable only by your own authenticated session. Operator access requires a signed admin session and every
            privileged action is written to an audit log.
          </p>
        </>
      ),
    },
    {
      heading: 'Security',
      body: (
        <>
          <p>
            Passwords are handled by Supabase Auth and never stored or logged by our application code. Admin credentials
            are stored as salted SHA-256 hashes with lockout after repeated failures. The site sends a strict
            Content-Security-Policy, HSTS and other hardening headers, and all writes are schema-validated server side and
            rate limited.
          </p>
          <p>Admin sessions use httpOnly, SameSite cookies, so page scripts cannot read them.</p>
        </>
      ),
    },
    {
      heading: 'Cookies and local storage',
      body: (
        <>
          <p>
            We use the minimum required: an authentication token cookie for signed-in players, a signed admin session
            cookie, and browser local storage for UI preferences such as volume, quality and a guest identifier. There are
            no third-party advertising or tracking cookies.
          </p>
          <p>You can clear all of it at any time from your browser; nothing else is required to opt out.</p>
        </>
      ),
    },
    {
      heading: 'How long we keep it',
      body: (
        <>
          <p>Account data is kept while your account exists. Session rows are retained for 90 days and then pruned. Support tickets are kept for 24 months for dispute resolution.</p>
          <p>Audit log entries describing operator actions are retained for 12 months.</p>
        </>
      ),
    },
    {
      heading: 'Your rights',
      body: (
        <>
          <p>
            You can export or delete your data at any time. Write to {site.supportEmail} and we will provide a copy of
            everything we hold about you, or erase your account and its history, within 30 days. Deleting your account
            removes your profile, scores, sessions and favourites.
          </p>
          <p>
            If you are in the EU, UK or India, you may also have rights of rectification, restriction and objection under
            applicable data protection law. Contact us and we will act on a valid request.
          </p>
        </>
      ),
    },
    {
      heading: 'Children',
      body: <p>Dash is not directed at children under 13. We do not knowingly collect data from them. If you believe a child under 13 has an account, contact us and we will remove it.</p>,
    },
    {
      heading: 'Third-party titles',
      body: (
        <p>
          Published titles streamed from third-party infrastructure are governed by the privacy terms of their rights
          holders in addition to this policy. Original Dash Studios engines send no data anywhere except our own database.
        </p>
      ),
    },
    {
      heading: 'Changes to this policy',
      body: (
        <p>
          If we make a material change we will update the date at the top of this page and, where we hold your email
          address, notify you before the change takes effect.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      tocId="privacy"
      title="Privacy policy"
      updated="17 October 2026"
      intro={`${site.fullName} is built to collect as little as possible and protect what it does hold. This page explains exactly what that means.`}
      sections={sections}
    />
  );
}
