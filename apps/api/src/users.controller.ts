import { Controller, Get } from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import { db, user } from "@repo/db";
import { Session, type UserSession } from "@thallesp/nestjs-better-auth";
import { requireAdmin } from "./require-admin";

@ApiTags("users")
@ApiCookieAuth()
@Controller("users")
export class UsersController {
  @Get()
  async list(@Session() session: UserSession) {
    requireAdmin(session);
    return db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user);
  }
}
