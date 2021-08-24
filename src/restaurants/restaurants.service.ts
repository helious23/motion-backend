import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { CreateRestaurantInput } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  createRestaurant(
    creatRestaurantInput: CreateRestaurantInput,
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurants.create(creatRestaurantInput);
    return this.restaurants.save(newRestaurant);
  }

  updateRestaurant({ id, updateRestaurantInput }: UpdateRestaurantDto) {
    return this.restaurants.update(id, { ...updateRestaurantInput });
  }
}
