import type { Metadata } from 'next';
import { LegalLayout, type LegalSection } from '@/components/legal/LegalLayout';
import { getSiteSettings } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Terms of service',
  description: 'The rules for using Dash Cloud Gaming — accounts, acceptable play, subscriptions, liability and content ownership.',
};

export default async function TermsPage() {
  const { site } = await getSiteSettings();

  const sections: LegalSection[] = [
    {
      heading: 'Acceptance',
      body: (
        <>
          <p>
            By creating an account or playing any title on Dash you agree to these terms. If you do not agree, do not use
            the service. These terms apply to the website, the APIs and every game we host.
          </p>
          <p>You must be at least 13 years old, or the minimum age of digital consent in your country, whichever is higher.</p>
        </>
      ),
    },
    {
      heading: 'Your account',
      body: (
        <>
          <p>
            You are responsible for keeping your credentials secret and for everything that happens under your account.
            One account per person. Do not share, sell or transfer accounts, and do not create accounts to evade a
            suspension.
          </p>
          <p>
            We may suspend or remove an account that breaches these terms, that submits fraudulent scores, or that abuses
            infrastructure in a way that degrades service for others.
          </p>
        </>
      ),
    },
    {
      heading: 'Acceptable use',
      body: (
        <>
          <p>You agree not to:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>cheat, manipulate scores, exploit bugs for advantage, or use automation to farm XP or coins;</li>
            <li>harass, threaten or hate-speech other players in any player-visible name, bio or message;</li>
            <li>probe, scan or attack the service, or attempt to bypass rate limits and access controls;</li>
            <li>reverse engineer, resell, re-stream or redistribute content or the platform itself;</li>
            <li>upload anything unlawful, infringing, sexually explicit involving minors, or malicious.</li>
          </ul>
          <p>
            Reports of cheating are reviewed by an operator, who can delete scores and ban accounts. Decisions are final
            but you can always appeal through support.
          </p>
        </>
      ),
    },
    {
      heading: 'The free service and paid tiers',
      body: (
        <>
          <p>
            Dash is free to use. Optional paid tiers add comfort features such as higher resolution, longer sessions and
            queue priority. They never gate access to a title that is otherwise free.
          </p>
          <p>
            Paid plans renew monthly until cancelled. You can cancel at any time from your profile and keep access until
            the end of the paid period. Fees are non-refundable except where required by law or where we failed to deliver
            the service.
          </p>
          <p>
            We may change pricing with 30 days notice. Capacity guarantees depend on region load; during peak demand you
            may be queued even on a paid tier.
          </p>
        </>
      ),
    },
    {
      heading: 'Virtual items',
      body: (
        <p>
          Dash Coins, XP and cosmetic items are a limited, personal, non-transferable licence to use features inside Dash.
          They have no cash value, cannot be exchanged for money, and may be removed if we retire a feature or if they
          were obtained in breach of these terms.
        </p>
      ),
    },
    {
      heading: 'Content you submit',
      body: (
        <>
          <p>
            You keep ownership of anything you submit — player names, bios, ticket messages. You grant us a worldwide,
            non-exclusive licence to store, display and process it for the purpose of operating the service.
          </p>
          <p>
            Your display name and scores may appear on public leaderboards. Do not submit personal information you would
            not want other players to see.
          </p>
        </>
      ),
    },
    {
      heading: 'Third-party games',
      body: (
        <>
          <p>
            Published titles remain the property of their rights holders. Dash streams them only where a licensed stream
            endpoint is available; where it is not, we mark the title accordingly instead of providing unlicensed access.
            Your use of a third-party title is also subject to that publisher's terms.
          </p>
          <p>Original Dash Studios engines are owned by us and licensed to you for personal, non-commercial play.</p>
        </>
      ),
    },
    {
      heading: 'Availability',
      body: (
        <>
          <p>
            We aim for high availability but do not promise an uninterrupted service. Maintenance windows, region
            degradation and incidents are published on the live status page. We may suspend or discontinue part of the
            service with reasonable notice.
          </p>
          <p>Your progress is stored in the cloud, but we are not liable for loss of saves caused by circumstances outside our control.</p>
        </>
      ),
    },
    {
      heading: 'Warranties and liability',
      body: (
        <>
          <p>
            The service is provided &ldquo;as is&rdquo; without warranties of any kind, to the maximum extent permitted by
            law. We do not warrant that the service will be error free, secure or uninterrupted.
          </p>
          <p>
            To the extent permitted by law, our total liability for any claim arising out of your use of Dash is limited to
            the amount you paid us in the twelve months before the claim. We are not liable for indirect or consequential
            losses, lost profits, or loss of data.
          </p>
          <p>Nothing in these terms limits liability that cannot lawfully be limited, including fraud or death caused by negligence.</p>
        </>
      ),
    },
    {
      heading: 'Termination',
      body: (
        <p>
          You may close your account at any time by contacting {site.supportEmail}. We may terminate or suspend access
          immediately for a material breach. Sections on content ownership, liability and governing law survive
          termination.
        </p>
      ),
    },
    {
      heading: 'Governing law',
      body: (
        <p>
          These terms are governed by the laws of India, with jurisdiction in the courts of Kolkata, West Bengal. If any
          provision is held unenforceable, the remainder stays in force.
        </p>
      ),
    },
    {
      heading: 'Changes',
      body: (
        <p>
          We may update these terms. Material changes are announced on the site and, where possible, by email at least 14
          days before they take effect. Continued use after that date means you accept the updated terms.
        </p>
      ),
    },
  ];

  return (
    <LegalLayout
      tocId="terms"
      title="Terms of service"
      updated="17 October 2026"
      intro={`Plain-language rules for using ${site.fullName}. Play fair, keep your account safe, and treat other players well.`}
      sections={sections}
    />
  );
}
