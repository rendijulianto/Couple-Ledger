import { Heart, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useRealtime } from "../context/RealtimeContext";

export function Navbar() {
  const { user, activeWorkspace } = useAuth();
  const { isConnected } = useRealtime();

  const partner = activeWorkspace?.members.find((m) => m.userId !== user?.id);

  return (
    <header className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-md border-b border-hairline px-4 py-2.5 flex items-center justify-between transition-all">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-rausch flex items-center justify-center text-white shadow-sm transition-transform active:scale-95">
          <Heart className="w-5 h-5 fill-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-tight text-ink leading-tight flex items-center gap-1.5">
            {activeWorkspace?.name || "Couple Ledger"}
          </h1>
          <div className="flex items-center gap-1.5">
            <p className="text-[11px] text-ink-muted">Catatan Harian Berdua</p>
            {isConnected && (
              <span
                title="Tersambung Real-Time Berdua"
                className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/70 px-1.5 py-0.5 rounded-full"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Member Avatars (You + Partner) */}
      <div className="flex items-center gap-1.5">
        {activeWorkspace && (
          <div className="flex items-center -space-x-1.5">
            {/* You */}
            <div
              title={`Kamu: ${user?.name}`}
              className="w-7 h-7 rounded-full bg-rausch/10 text-rausch border border-white font-semibold text-xs flex items-center justify-center"
            >
              {user?.name.charAt(0).toUpperCase()}
            </div>

            {/* Partner or empty slot */}
            {partner ? (
              <div
                title={`Pasangan: ${partner.name}`}
                className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 border border-white font-semibold text-xs flex items-center justify-center"
              >
                {partner.name.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div
                title="Menunggu Pasangan Bergabung"
                className="w-7 h-7 rounded-full bg-surface-strong border border-dashed border-ink-muted text-ink-muted flex items-center justify-center"
              >
                <Users className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

