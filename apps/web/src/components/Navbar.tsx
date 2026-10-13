import { Heart, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const { user, activeWorkspace } = useAuth();

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
          <p className="text-[11px] text-ink-muted">Catatan Harian Berdua</p>
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

