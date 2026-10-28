import type { ConnectionStatus } from '../../types/node';

interface HeaderProps {
  connectionStatus: ConnectionStatus;
  /** Decimal block of the latest health snapshot, or null when none exists. */
  liveBlock: string | null;
}

export function Header({ connectionStatus, liveBlock }: HeaderProps) {
  const statusText =
    connectionStatus === 'connected'
      ? liveBlock
        ? `LIVE · BLOCK #${liveBlock}`
        : 'CONNECTED'
      : connectionStatus === 'connecting'
        ? 'CONNECTING…'
        : connectionStatus === 'error'
          ? 'ERROR'
          : 'NOT CONNECTED';
  const statusColor =
    connectionStatus === 'connected'
      ? '#34d399'
      : connectionStatus === 'connecting'
        ? '#fbbf24'
        : connectionStatus === 'error'
          ? '#f87171'
          : '#475569';
  const statusTextClass =
    connectionStatus === 'connected'
      ? 'text-emerald-300'
      : connectionStatus === 'connecting'
        ? 'text-amber-300'
        : connectionStatus === 'error'
          ? 'text-red-400'
          : 'text-slate-400';

  return (
    <header className="relative bg-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          <a
            href="/"
            title="Back to landing page"
            className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-80"
          >
            <img
              src="/logo.png"
              alt="NodeScope"
              className="h-9 w-9 rounded-lg"
            />
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="text-xl font-medium tracking-tight text-white">
                  NodeScope
                </h1>
                <span className="hidden text-xs text-slate-400 sm:inline">
                  Proves node health over time
                </span>
              </div>
            </div>
          </a>

          <div className="flex shrink-0 items-center gap-3">
            {/* The one status indicator: a static dot plus the
                connection state and, once a snapshot exists, its block. */}
            <div className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5">
              <span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: statusColor }} />
              <span key={statusText} className={`state-swap text-xs font-data ${statusTextClass}`}>
                {statusText}
              </span>
            </div>

            <span className="hidden rounded-lg border border-line px-3 py-1.5 text-xs text-slate-300 md:block">
              V3 Testnet · 420420777
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
