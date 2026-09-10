import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { type HealthResponse, healthResponseSchema } from "@repo/shared";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { createZodDto, ZodResponse } from "nestjs-zod";
import { PansouClient } from "./pansou.client";

class HealthResponseDto extends createZodDto(healthResponseSchema) {}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private readonly pansou: PansouClient) {}

  @Get()
  @AllowAnonymous()
  @ZodResponse({
    status: 200,
    description: "进程存活",
    type: HealthResponseDto,
  })
  async get(@Query("wake") wake?: string): Promise<HealthResponse> {
    const waitMs = wake === "1" || wake === "true" ? 25_000 : 2_000;
    return {
      ok: true,
      service: "api",
      pansou: await this.pansou.health(waitMs),
    };
  }
}
