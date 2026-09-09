import { createApp } from "./create-app";
import { env } from "./env";

async function bootstrap() {
  const app = await createApp();
  const port = env.PORT ?? env.API_PORT ?? 3500;
  await app.listen(port);
}

void bootstrap();
