import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { ApiCookieAuth, ApiTags } from "@nestjs/swagger";
import {
  createResourceSchema,
  resourceSearchQuerySchema,
  updateResourceSchema,
} from "@repo/shared";
import {
  AllowAnonymous,
  Session,
  type UserSession,
} from "@thallesp/nestjs-better-auth";
import { createZodDto } from "nestjs-zod";
import { requireAdmin } from "./require-admin";
import { ResourcesService } from "./resources.service";

class SearchQueryDto extends createZodDto(resourceSearchQuerySchema) {}
class CreateResourceDto extends createZodDto(createResourceSchema) {}
class UpdateResourceDto extends createZodDto(updateResourceSchema) {}

@ApiTags("resources")
@Controller("resources")
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get("search")
  @AllowAnonymous()
  search(@Query() query: SearchQueryDto) {
    return this.resources.search(query);
  }

  @Get()
  @ApiCookieAuth()
  list(@Session() session: UserSession) {
    requireAdmin(session);
    return this.resources.listAll();
  }

  @Post()
  @ApiCookieAuth()
  create(@Session() session: UserSession, @Body() body: CreateResourceDto) {
    requireAdmin(session);
    return this.resources.create(body);
  }

  @Patch(":id")
  @ApiCookieAuth()
  update(
    @Session() session: UserSession,
    @Param("id") id: string,
    @Body() body: UpdateResourceDto,
  ) {
    requireAdmin(session);
    return this.resources.update(id, body);
  }

  @Delete(":id")
  @ApiCookieAuth()
  remove(@Session() session: UserSession, @Param("id") id: string) {
    requireAdmin(session);
    return this.resources.remove(id);
  }
}
