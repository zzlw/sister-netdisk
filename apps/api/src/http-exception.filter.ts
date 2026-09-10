import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import type { Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException
        ? exception.getResponse()
        : "Internal server error";
    const error =
      typeof raw === "string"
        ? raw
        : raw &&
            typeof raw === "object" &&
            "message" in raw &&
            typeof raw.message === "string"
          ? raw.message
          : raw;
    res.status(status).json({
      ok: false,
      status,
      error,
    });
  }
}
