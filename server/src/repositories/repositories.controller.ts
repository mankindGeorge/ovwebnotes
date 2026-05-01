import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto, UpdateRepositoryDto } from './dto/create-repository.dto';

@ApiTags('repositories')
@Controller('api/repositories')
@UseInterceptors(ClassSerializerInterceptor)
export class RepositoriesController {
  constructor(private readonly repositoriesService: RepositoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new remote repository' })
  @ApiResponse({ status: 201, description: 'Repository created successfully' })
  create(@Body() dto: CreateRepositoryDto) {
    return this.repositoriesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all repositories' })
  findAll() {
    return this.repositoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a repository by id' })
  findOne(@Param('id') id: string) {
    return this.repositoriesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a repository' })
  update(@Param('id') id: string, @Body() dto: UpdateRepositoryDto) {
    return this.repositoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a repository' })
  remove(@Param('id') id: string) {
    return this.repositoriesService.remove(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a repository' })
  activate(@Param('id') id: string) {
    return this.repositoriesService.activate(id);
  }

  @Post(':id/sync')
  @ApiOperation({ summary: 'Sync repository with remote' })
  sync(@Param('id') id: string) {
    return this.repositoriesService.sync(id);
  }
}
