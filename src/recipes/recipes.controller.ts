import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recipes')
@UseGuards(JwtAuthGuard)
export class RecipesController {
    constructor(private recipesService: RecipesService) { }

    @Post()
    create(@Body() body: any, @Request() req: any) {
        return this.recipesService.create({ ...body, ownerId: req.user.userId });
    }

    @Get()
    findAll(@Request() req: any) {
        return this.recipesService.findAllByOwner(req.user.userId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.recipesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() body: any) {
        return this.recipesService.update(id, body);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.recipesService.remove(id);
    }
}
