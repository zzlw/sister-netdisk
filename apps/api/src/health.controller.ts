import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { type HealthResponse, healthResponseSchema } from "@repo/shared";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { createZodDto, ZodResponse } from "nestjs-zod";

class HealthResponseDto extends createZodDto(healthResponseSchema) {}

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @AllowAnonymous()
  @ZodResponse({
    status: 200,
    description: "进程存活",
    type: HealthResponseDto,
  })
  get(): HealthResponse {
    return { ok: true, service: "api" };
  }
}
