import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { resourceSearchQuerySchema } from "@repo/shared";
import { AllowAnonymous } from "@thallesp/nestjs-better-auth";
import { createZodDto } from "nestjs-zod";
import { ResourcesService } from "./resources.service";

class SearchQueryDto extends createZodDto(resourceSearchQuerySchema) {}

@ApiTags("resources")
@Controller("resources")
export class ResourcesController {
  constructor(private readonly resources: ResourcesService) {}

  @Get("search")
  @AllowAnonymous()
  search(@Query() query: SearchQueryDto) {
    return this.resources.search(query);
  }
}
