import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';

@Injectable()
export class RecipesService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
    ) { }

    create(recipeData: Partial<Recipe>) {
        return this.recipesRepository.save(recipeData);
    }

    findAllByOwner(ownerId: string) {
        return this.recipesRepository.find({ where: { ownerId } });
    }

    async findOne(id: string) {
        const recipe = await this.recipesRepository.findOneBy({ id });
        if (!recipe) throw new NotFoundException('Recipe not found');
        return recipe;
    }

    async update(id: string, updateData: Partial<Recipe>) {
        const result = await this.recipesRepository.update(id, updateData);
        if (result.affected === 0) {
            throw new NotFoundException(`Recipe with ID ${id} not found`);
        }
        return this.findOne(id);
    }

    remove(id: string) {
        return this.recipesRepository.delete(id);
    }
}
