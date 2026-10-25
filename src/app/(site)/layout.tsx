import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { getSiteSettings } from '@/lib/queries';

export const revalidate = 45;

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const { site, maintenance } = await getSiteSettings();

  return (
    <div className={maintenance.enabled ? 'pt-[42px]' : undefined}>
      {maintenance.enabled && (
        <div className="fixed inset-x-0 top-0 z-[95] border-b border-[rgba(251,191,36,0.25)] bg-[#1a1405]/95 px-4 py-2.5 text-center text-[12.5px] font-medium text-[#fcd34d] backdrop-blur">
          {maintenance.message || 'Dash is under maintenance.'}
        </div>
      )}
      <Navbar />
      <main id="main" className="min-h-[70vh] pt-[64px]">
        {children}
      </main>
      <Footer site={site} />
    </div>
  );
}
