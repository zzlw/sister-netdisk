import { Controller, Get, type INestApplication } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import request from "supertest";

@Controller("health")
class HealthStub {
  @Get()
  get() {
    return { ok: true, service: "api" };
  }
}

/** Nest 路由前缀基线。鉴权联调用仓库根目录 `pnpm test:e2e`。 */
describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthStub],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health", async () => {
    await request(app.getHttpServer())
      .get("/api/health")
      .expect(200)
      .expect({ ok: true, service: "api" });
  });
});
