import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from './entities/recipe.entity';
import { ValidationHelper } from '../common/helpers/validation.helper';
import { DevicesService } from '../devices/devices.service';
import { MqttService } from '../mqtt/mqtt.service';

@Injectable()
export class RecipesService {
  constructor(
    @InjectRepository(Recipe)
    private recipesRepository: Repository<Recipe>,
    @Inject(forwardRef(() => DevicesService))
    private devicesService: DevicesService,
    @Inject(forwardRef(() => MqttService))
    private mqttService: MqttService,
  ) {}

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

  async remove(id: string) {
    if (!ValidationHelper.isValidUUID(id)) {
      throw new BadRequestException('Invalid UUID format');
    }
    const result = await this.recipesRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Recipe with ID ${id} not found`);
    }
    return result;
  }

  async updateRecipeFromMqtt(serial_number: string, payload: any) {
    const { recipeId } = payload;
    let recipe: any;

    try {
      if (recipeId && ValidationHelper.isValidUUID(recipeId)) {
        recipe = await this.recipesRepository.findOne({
          where: { id: recipeId },
        });
      }

      if (!recipe) {
        console.log(
          'Recipe not found or invalid ID. Fetching from device...',
          recipeId,
        );
        await this.fetchAndSaveRecipeFromDevice(serial_number);
        return;
      }

      const device = await this.devicesService.findOneBySerial(serial_number);
      if (!device) {
        console.log('Device not found for serial:', serial_number);
        return;
      }

      await this.devicesService.update(device.id, {
        active_recipe: recipe,
      });
      console.log(
        `Updated device ${serial_number} with active recipe ${recipe.id}`,
      );
    } catch (error) {
      console.log('Error recipe: ', error);
    }
  }

  private async fetchAndSaveRecipeFromDevice(serial_number: string) {
    const device = await this.devicesService.findOneBySerial(serial_number);
    if (!device) {
      console.log('Device not found for serial:', serial_number);
      return;
    }

    const userId = device.ownerId;
    const commandTopic = `mars/devices/${serial_number}/data`;
    const responseTopic = `mars/${userId}/device/${serial_number}/actualProgram`;
    const body = { cmd: 'getActualProgram' };

    console.log(
      `Sending command to ${commandTopic}, waiting on ${responseTopic}`,
    );

    try {
      const recipeData = await this.mqttService.publishToTopicAndWaitForMessage(
        commandTopic,
        body,
        responseTopic,
        10000,
      );

      console.log('Received recipe data from device:', recipeData);

      if (!recipeData) return;

      const { id, name, description, species, state, created_at, updated_at } =
        recipeData;

      let newRecipeData = {
        name,
        description,
        species,
        ownerId: userId,
        recipe: recipeData,
        state,
        created_at: Number(created_at),
        updated_at: Number(updated_at),
      };

      let recipeToLink: any;

      if (id && ValidationHelper.isValidUUID(id)) {
        const DBExistingRecipe = await this.recipesRepository.findOne({
          where: { id },
        });
        if (DBExistingRecipe) {
          console.log('Recipe exists, checking timestamps...');
          // Check timestamps
          if (recipeData.updated_at > DBExistingRecipe.updated_at) {
            console.log('Device recipe is newer. Updating DB...');
            await this.recipesRepository.update(id, newRecipeData);
            recipeToLink = await this.recipesRepository.findOneBy({ id });
          } else if (recipeData.updated_at < DBExistingRecipe.updated_at) {
            console.log('DB recipe is newer. Update Device');
            recipeToLink = DBExistingRecipe;

            // Notify device to update its local version
            const savePayload = {
              cmd: 'saveProgram',
              name: recipeToLink.name,
              recipe: recipeToLink.recipe,
            };
            this.mqttService.publish(commandTopic, savePayload);
            console.log('Sent saveProgram command to device (DB newer)');
          } else {
            console.log('DB recipe is equal.');
            recipeToLink = DBExistingRecipe;
          }
        }
      }

      if (!recipeToLink) {
        console.log('Creating new recipe from device data...');
        const newRecipe = this.recipesRepository.create(newRecipeData);
        const savedRecipe = await this.recipesRepository.save(newRecipe);
        recipeToLink = Array.isArray(savedRecipe)
          ? savedRecipe[0]
          : savedRecipe;
        console.log('Recipe saved with ID:', recipeToLink.id);

        // Update the recipe content with the generated ID
        if (recipeToLink.recipe) {
          recipeToLink.recipe.id = recipeToLink.id;
          await this.recipesRepository.save(recipeToLink);
          console.log('Updated recipe content with generated ID');
        }

        // Notify device to save the new recipe (with new ID if needed, or just sync)
        const savePayload = {
          cmd: 'saveProgram',
          name: recipeToLink.name,
          recipe: recipeToLink.recipe,
        };
        this.mqttService.publish(commandTopic, savePayload);
        console.log('Sent saveProgram command to device for new recipe');
      }

      // Associate with Device
      await this.devicesService.update(device.id, {
        active_recipe: recipeToLink,
      });
      // Also add to history (Many-to-Many)
      await this.devicesService.addRecipe(device.id, recipeToLink);

      console.log('Device updated with new active recipe');
    } catch (error) {
      console.error('Failed to fetch/save recipe from device:', error.message);
    }
  }
}
