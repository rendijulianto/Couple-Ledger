export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export type HealthCheckResponse = {
  status: "ok" | "error";
  service: string;
  version: string;
  timestamp: string;
  environment: string;
  database?: {
    status: "connected" | "disconnected";
  };
};

export type TransactionType = "EXPENSE" | "INCOME";

export type MemberRole = "OWNER" | "MEMBER";

export type WorkspaceDatePolicy = "STRICT_TODAY" | "FLEXIBLE";

