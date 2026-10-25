'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { adminApi } from './api';
import { OverviewPanel, type OverviewData } from './OverviewPanel';
import { LivePanel } from './LivePanel';
import { GamesPanel } from './GamesPanel';
import { UsersPanel } from './UsersPanel';
import { SessionsPanel } from './SessionsPanel';
import { ScoresPanel } from './ScoresPanel';
import { TicketsPanel } from './TicketsPanel';
import { ActivityPanel } from './ActivityPanel';
import { SettingsPanel } from './SettingsPanel';
import { LogoMark } from '@/components/ui/Logo';
import { Spinner } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import {
  IconActivity,
  IconBell,
  IconChart,
  IconDashboard,
  IconGamepad,
  IconLogout,
  IconMenu,
  IconServer,
  IconSettings,
  IconTicket,
  IconTrophy,
  IconUsers,
} from '@/components/ui/Icons';
import { cn } from '@/lib/utils';

type TabId = 'overview' | 'live' | 'games' | 'users' | 'sessions' | 'scores' | 'tickets' | 'activity' | 'settings';

const tabs: { id: TabId; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'overview', label: 'Overview', icon: <IconDashboard width={16} height={16} />, group: 'Workspace' },
  { id: 'live', label: 'Service health', icon: <IconServer width={16} height={16} />, group: 'Workspace' },
  { id: 'activity', label: 'Audit trail', icon: <IconActivity width={16} height={16} />, group: 'Workspace' },
  { id: 'games', label: 'Games', icon: <IconGamepad width={16} height={16} />, group: 'Manage' },
  { id: 'users', label: 'Players', icon: <IconUsers width={16} height={16} />, group: 'Manage' },
  { id: 'sessions', label: 'Sessions', icon: <IconChart width={16} height={16} />, group: 'Manage' },
  { id: 'scores', label: 'Scores', icon: <IconTrophy width={16} height={16} />, group: 'Manage' },
  { id: 'tickets', label: 'Support tickets', icon: <IconTicket width={16} height={16} />, group: 'System' },
  { id: 'settings', label: 'Settings', icon: <IconSettings width={16} height={16} />, group: 'System' },
];

export function AdminShell({ admin, initial }: { admin: { username: string; role: string }; initial: OverviewData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { push } = useToast();
  const requestedTab = searchParams.get('tab');
  const initialTab: TabId = tabs.some((item) => item.id === requestedTab) ? (requestedTab as TabId) : 'overview';
  const [tab, setTab] = useState<TabId>(initialTab);
  const [data, setData] = useState<OverviewData>(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [lastSync, setLastSync] = useState<Date>(new Date());

  const refresh = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const next = await adminApi<OverviewData>('/api/admin/overview');
      setData(next);
      setLastSync(new Date());
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not refresh data', 'error');
    } finally {
      setRefreshing(false);
    }
  }, [push]);

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (tabs.some((item) => item.id === requested)) setTab(requested as TabId);
  }, [searchParams]);

  const navigateToTab = useCallback((nextTab: TabId) => {
    setTab(nextTab);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'overview') params.delete('tab');
    else params.set('tab', nextTab);
    const query = params.toString();
    router.replace(query ? `/admin?${query}` : '/admin', { scroll: false });
  }, [router, searchParams]);

  useEffect(() => {
    // Avoid background polling when the console is hidden in another tab.
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh(true);
    }, 30_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.altKey) return;
      const index = Number(e.key) - 1;
      if (index >= 0 && index < tabs.length) {
        e.preventDefault();
        navigateToTab(tabs[index].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigateToTab]);

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await adminApi('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Could not sign out. Please retry.', 'error');
      setLoggingOut(false);
    }
  }

  const groups = Array.from(new Set(tabs.map((t) => t.group)));
  const openTickets = data.kpis.openTickets;

  return (
    <div className="dash-admin flex min-h-screen bg-[#080808]">
      {/* sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[240px] flex-col border-r border-white/10 bg-[#080808] transition-transform duration-150 lg:translate-x-0',
          navOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
          <LogoMark size={30} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold tracking-tight text-white">Dash Console</p>
            <p className="truncate text-[10.5px] text-[color:var(--text-faint)]">
              {admin.username} · {admin.role}
            </p>
          </div>
        </div>

        <nav className="no-scrollbar flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group} className="mb-5">
              <p className="px-2.5 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--text-faint)]">{group}</p>
              <div className="space-y-0.5">
                {tabs
                  .filter((t) => t.group === group)
                  .map((t) => {
                    const active = tab === t.id;
                    const index = tabs.indexOf(t) + 1;
                    return (
                      <button
                        key={t.id}
                        onClick={() => {
                          navigateToTab(t.id);
                          setNavOpen(false);
                        }}
                        className={cn(
                          'group flex w-full items-center gap-2.5 border-l-2 px-2.5 py-2.5 text-[13px] font-semibold transition-colors duration-100',
                          active ? 'border-white bg-white text-black' : 'border-transparent text-neutral-400 hover:bg-white/[0.05] hover:text-white',
                        )}
                      >
                        <span className={cn(active ? 'text-white' : 'text-neutral-500 group-hover:text-neutral-200')}>{t.icon}</span>
                        <span className="flex-1 text-left">{t.label}</span>
                        {t.id === 'tickets' && openTickets > 0 && (
                          <span className="rounded-md bg-[rgba(251,113,133,0.16)] px-1.5 py-0.5 font-mono text-[10.5px] font-bold text-[#fda4af]">{openTickets}</span>
                        )}
                        <span className="font-mono text-[10px] text-white/15 opacity-0 transition-opacity group-hover:opacity-100">⌥{index}</span>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <div className="mb-2.5 border border-white/10 px-3 py-2.5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
              <span className={cn('h-1.5 w-1.5 rounded-full', refreshing ? 'bg-[#fbbf24]' : 'bg-[#4ade80]')} />
              {refreshing ? 'Syncing' : 'Live'}
            </p>
            <p className="mt-1 font-mono text-[11px] text-white/55">synced {lastSync.toLocaleTimeString()}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => refresh()} className="btn-ghost flex-1 justify-center !py-2 !text-[12px]">
              Refresh
            </button>
            <button onClick={logout} disabled={loggingOut} className="btn-ghost !py-2 !text-[12px]" aria-label="Sign out">
              {loggingOut ? <Spinner size={13} /> : <IconLogout width={14} height={14} />}
            </button>
          </div>
        </div>
      </aside>

      {navOpen && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/[0.1] bg-[#080808] px-4 py-3 sm:px-6">
          <button onClick={() => setNavOpen(true)} className="btn-ghost !px-2.5 !py-2 lg:hidden" aria-label="Open navigation">
            <IconMenu width={17} height={17} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[16px] font-semibold tracking-tight text-white">
              {tabs.find((t) => t.id === tab)?.label}
            </h1>
            <p className="hidden truncate text-[11.5px] text-[color:var(--text-faint)] sm:block">
              {data.kpis.activeSessions} sessions streaming · {data.kpis.healthyServices}/{data.kpis.totalServices} services healthy
            </p>
          </div>
          <Badge tone={data.kpis.healthyServices === data.kpis.totalServices ? 'mint' : 'amber'} dot>
            {data.kpis.healthyServices === data.kpis.totalServices ? 'All healthy' : `${data.kpis.totalServices - data.kpis.healthyServices} affected`}
          </Badge>
          {data.kpis.openTickets > 0 && (
            <button onClick={() => navigateToTab('tickets')} className="relative flex h-9 w-9 items-center justify-center border border-white/10 text-white/70 transition-colors hover:bg-white/5 hover:text-white">
              <IconBell width={16} height={16} />
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#fb7185] px-1 font-mono text-[10px] font-bold text-black">
                {data.kpis.openTickets}
              </span>
            </button>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div key={tab}>
              {tab === 'overview' && <OverviewPanel data={data} onRefresh={() => refresh()} onNavigate={(t) => navigateToTab(t as TabId)} />}
              {tab === 'live' && <LivePanel statuses={data.status} onChanged={() => refresh(true)} />}
              {tab === 'games' && <GamesPanel />}
              {tab === 'users' && <UsersPanel />}
              {tab === 'sessions' && <SessionsPanel />}
              {tab === 'scores' && <ScoresPanel games={data.games ?? []} />}
              {tab === 'tickets' && <TicketsPanel />}
              {tab === 'activity' && <ActivityPanel initial={data.activity} />}
              {tab === 'settings' && (
                <SettingsPanel
                  settings={data.settings}
                  announcements={data.announcements}
                  onChanged={() => refresh(true)}
                />
              )}
          </div>
        </main>

        <footer className="border-t border-white/[0.07] px-4 py-4 text-center text-[11px] text-[color:var(--text-faint)] sm:px-6">
          Dash Cloud / Administration · Signed in as {admin.username}
          {refreshing && <Spinner size={11} className="ml-2 inline-block align-middle" />}
        </footer>
      </div>
    </div>
  );
}
