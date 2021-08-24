import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';
import { RestaurantService } from './restaurants.service';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';

@Resolver(of => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  @Query(returns => [Restaurant])
  restaurants(): Promise<Restaurant[]> {
    return this.restaurantService.getAll();
  }

  @Mutation(returns => Boolean)
  async createRestaurant(
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<boolean> {
    try {
      await this.restaurantService.createRestaurant(createRestaurantInput);
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  @Mutation(resturns => Boolean)
  async updateRestaurant(
    @Args('input') updateRestaurantDto: UpdateRestaurantDto,
  ): Promise<boolean> {
    try {
      await this.restaurantService.updateRestaurant(updateRestaurantDto);
      return true;
    } catch (error) {
      return false;
    }
  }
}
