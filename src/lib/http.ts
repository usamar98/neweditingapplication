import { ZodError } from "zod";
import { logger } from "@/lib/logger";

export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code = "REQUEST_FAILED",
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function errorResponse(error: unknown, requestId: string) {
  if (error instanceof HttpError) {
    return Response.json(
      { error: { code: error.code, message: error.message }, requestId },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return Response.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          details: error.flatten().fieldErrors,
          message: "The request contains invalid fields.",
        },
        requestId,
      },
      { status: 400 },
    );
  }

  logger.error({ err: error, requestId }, "Unhandled API error");
  return Response.json(
    {
      error: { code: "INTERNAL_ERROR", message: "Something went wrong." },
      requestId,
    },
    { status: 500 },
  );
}

export function getRequestId(request: Request) {
  return request.headers.get("x-request-id") ?? crypto.randomUUID();
}
