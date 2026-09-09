import { NestFactory } from "@nestjs/core";

import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { cleanupOpenApiDoc, ZodValidationPipe } from "nestjs-zod";
import { AppModule } from "./app.module";
import { env } from "./env";
import { HttpExceptionFilter } from "./http-exception.filter";

export async function createApp() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.use(
    helmet({
      contentSecurityPolicy: env.SWAGGER === "0" ? undefined : false,
    }),
  );
  const authLimit = rateLimit({
    windowMs: 60_000,
    limit: env.NODE_ENV === "production" ? 20 : 200,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });
  app.use("/api/auth/sign-in", authLimit);
  app.use("/api/auth/sign-up", authLimit);
  app.enableCors({
    origin: env.CORS_ORIGINS.split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    credentials: true,
  });

  if (env.SWAGGER !== "0") {
    const document = cleanupOpenApiDoc(
      SwaggerModule.createDocument(
        app,
        new DocumentBuilder()
          .setTitle(process.env.npm_package_name ?? "api")
          .setDescription("Nest API。鉴权走 Better Auth Cookie。")
          .setVersion("0.1.0")
          .addCookieAuth("better-auth.session_token")
          .build(),
      ),
    );
    SwaggerModule.setup("api/docs", app, document);
  }

  return app;
}
