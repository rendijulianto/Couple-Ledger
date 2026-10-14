import React, { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import { getBaseUrl } from "../lib/api";

interface RealtimeContextType {
  isConnected: boolean;
  lastEventTime: Date | null;
}

const RealtimeContext = createContext<RealtimeContextType>({
  isConnected: false,
  lastEventTime: null,
});

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { user, activeWorkspace, refreshAuth } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);

  useEffect(() => {
    if (!user || !activeWorkspace?.id) {
      setIsConnected(false);
      return;
    }

    const token = localStorage.getItem("couple_ledger_token");
    const baseUrl = getBaseUrl();
    const sseUrl = `${baseUrl}/workspaces/${activeWorkspace.id}/events${
      token ? `?token=${encodeURIComponent(token)}` : ""
    }`;

    let eventSource: EventSource | null = null;
    let isCancelled = false;

    try {
      eventSource = new EventSource(sseUrl, { withCredentials: true });

      eventSource.onopen = () => {
        if (!isCancelled) {
          setIsConnected(true);
        }
      };

      eventSource.onerror = () => {
        if (!isCancelled) {
          setIsConnected(false);
        }
      };

      // Handler helper for incoming events
      const handleEvent = (type: string, dataRaw: string) => {
        try {
          const payload = JSON.parse(dataRaw) as {
            type: string;
            actorId?: string;
            data?: Record<string, unknown>;
          };

          setLastEventTime(new Date());

          // Trigger cache invalidation so UI refreshes seamlessly
          void queryClient.invalidateQueries();
          void refreshAuth();

          // Only notify if the action was performed by the partner
          if (payload.actorId && payload.actorId !== user.id) {
            const partner = activeWorkspace.members.find(
              (m) => m.userId === payload.actorId,
            );
            const partnerName = partner?.name || "Pasanganmu";

            switch (type) {
              case "TRANSACTION_CREATED": {
                const amount = payload.data?.amountIdr;
                const formattedAmount =
                  typeof amount === "number"
                    ? ` Rp ${amount.toLocaleString("id-ID")}`
                    : "";
                showToast({
                  type: "info",
                  title: "Transaksi Baru",
                  message: `${partnerName} baru saja mencatat transaksi${formattedAmount}.`,
                });
                break;
              }
              case "TRANSACTION_UPDATED":
                showToast({
                  type: "info",
                  title: "Transaksi Diperbarui",
                  message: `Transaksi telah diperbarui oleh ${partnerName}.`,
                });
                break;
              case "TRANSACTION_DELETED":
                showToast({
                  type: "info",
                  title: "Transaksi Dihapus",
                  message: `Sebuah transaksi telah dihapus oleh ${partnerName}.`,
                });
                break;
              case "APPROVAL_REQUESTED":
                showToast({
                  type: "warning",
                  title: "Konfirmasi Pasangan",
                  message: `${partnerName} mengajukan perubahan yang membutuhkan persetujuanmu.`,
                });
                break;
              case "APPROVAL_RESOLVED":
                showToast({
                  type: "success",
                  title: "Pengajuan Ditanggapi",
                  message: `${partnerName} telah menanggapi pengajuan perubahan.`,
                });
                break;
              case "THEME_CHANGED":
                showToast({
                  type: "info",
                  title: "Tema Ruang Berubah",
                  message: `${partnerName} baru saja mengubah tema warna catatan berdua.`,
                });
                break;
              case "DATE_POLICY_CHANGED":
                showToast({
                  type: "info",
                  title: "Kebijakan Tanggal Berubah",
                  message: `Aturan tanggal pencatatan telah diperbarui.`,
                });
                break;
              default:
                break;
            }
          }
        } catch {
          // Ignore parse errors
        }
      };

      // Listen to specific SSE event types
      const eventTypes = [
        "TRANSACTION_CREATED",
        "TRANSACTION_UPDATED",
        "TRANSACTION_DELETED",
        "APPROVAL_REQUESTED",
        "APPROVAL_RESOLVED",
        "THEME_CHANGED",
        "DATE_POLICY_CHANGED",
        "BUDGET_UPDATED",
        "WALLET_UPDATED",
      ];

      for (const evType of eventTypes) {
        eventSource.addEventListener(evType, (e) => {
          handleEvent(evType, (e as MessageEvent).data);
        });
      }
    } catch {
      setIsConnected(false);
    }

    return () => {
      isCancelled = true;
      if (eventSource) {
        eventSource.close();
      }
      setIsConnected(false);
    };
  }, [user?.id, activeWorkspace?.id]);

  return (
    <RealtimeContext.Provider value={{ isConnected, lastEventTime }}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

