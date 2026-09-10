import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { ZodSerializerInterceptor } from "nestjs-zod";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { auth } from "./auth";
import { HealthController } from "./health.controller";
import { PansouClient } from "./pansou.client";
import { ResourcesController } from "./resources.controller";
import { ResourcesService } from "./resources.service";
import { ShareLivenessService } from "./share-liveness.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [AuthModule.forRoot({ auth })],
  controllers: [
    AppController,
    HealthController,
    UsersController,
    ResourcesController,
  ],
  providers: [
    AppService,
    PansouClient,
    ResourcesService,
    ShareLivenessService,
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
