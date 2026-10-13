import { Elysia } from "elysia";
import { AppError } from "../domain/errors";

export const errorMiddleware = new Elysia({ name: "error-middleware" }).onError(
  { as: "global" },
  ({ code, error, set, request }) => {
    const requestId =
      request.headers.get("x-request-id") || crypto.randomUUID();
    set.headers["x-request-id"] = requestId;

    // Check if error is AppError or has statusCode and code
    if (
      error instanceof AppError ||
      (typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        "code" in error)
    ) {
      const appErr = error as AppError;
      set.status = appErr.statusCode;
      return {
        success: false,
        error: {
          code: appErr.code,
          message: appErr.message,
          requestId,
        },
      };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: error.message || "Validasi input gagal",
          requestId,
        },
      };
    }

    if (code === "NOT_FOUND") {
      set.status = 404;
      return {
        success: false,
        error: {
          code: "NOT_FOUND",
          message: "Route tidak ditemukan",
          requestId,
        },
      };
    }

    // 500 Internal Error
    console.error(`[500 ERROR] [${requestId}]`, error);
    set.status = 500;
    return {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Terjadi kesalahan internal pada server",
        requestId,
      },
    };
  },
);

