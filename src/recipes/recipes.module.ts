import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Recipe } from './entities/recipe.entity';
import { RecipesService } from './recipes.service';
import { RecipesController } from './recipes.controller';
import { forwardRef } from '@nestjs/common';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Recipe]),
        forwardRef(() => MqttModule),
    ],
    controllers: [RecipesController],
    providers: [RecipesService],
})
export class RecipesModule { }
