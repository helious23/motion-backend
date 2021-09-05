import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Raw, Repository } from 'typeorm';
import { Restaurant } from './entities/restaurant.entity';
import { User } from '../users/entities/user.entity';
import { Category } from './entities/category.entity';
import { CategoryRepository } from './repositories/category.repository';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryOutput, CategoryInput } from './dtos/category.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import {
  DeleteRestaurantOutput,
  DeleteRestaurantInput,
} from './dtos/delete-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = this.restaurants.create(createRestaurantInput);
      newRestaurant.owner = owner;
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '식당을 생성하지 못했습니다',
      };
    }
  }

  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        editRestaurantInput.restaurantId,
      );
      if (!restaurant) {
        return {
          ok: false,
          error: '식당을 찾을 수 없습니다',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '자신이 소유한 식당의 정보만 수정할 수 있습니다',
        };
      }
      let category: Category = null;
      if (editRestaurantInput.categoryName) {
        category = await this.categories.getOrCreate(
          editRestaurantInput.categoryName,
        );
      }
      await this.restaurants.save([
        {
          id: editRestaurantInput.restaurantId,
          ...editRestaurantInput,
          ...(category && { category }),
        },
      ]);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '식당 정보를 수정하지 못했습니다',
      };
    }
  }

  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '식당을 찾지 못했습니다',
        };
      }
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: '자신이 소유한 식당만 삭제할 수 있습니다',
        };
      }
      await this.restaurants.delete({ id: restaurantId });
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '식당을 삭제할 수 없습니다',
      };
    }
  }

  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: '카테고리를 불러올 수 없습니다',
      };
    }
  }

  async countRestaurant(category: Category) {
    return await this.restaurants.count({ category });
  }

  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: '해당하는 카테고리가 없습니다',
        };
      }
      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        take: 9,
        skip: (page - 1) * 9,
      });

      const totalResults = await this.countRestaurant(category);
      return {
        ok: true,
        category,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 9),
      };
    } catch (error) {
      return {
        ok: false,
        error: '카테고리를 검색할 수 없습니다',
      };
    }
  }

  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [results, totalResults] = await this.restaurants.findAndCount({
        take: 9,
        skip: (page - 1) * 9,
      });
      return {
        ok: true,
        results,
        totalResults,
        totalPages: Math.ceil(totalResults / 9),
      };
    } catch (error) {
      return {
        ok: false,
        error: '식당을 찾을 수 없습니다',
      };
    }
  }

  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '해당하는 식당을 찾을 수 없습니다',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch (error) {
      return {
        ok: false,
        error: '식당을 찾을 수 없습니다',
      };
    }
  }

  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw(name => `${name} ILIKE '%${query}%'`),
        },
        take: 9,
        skip: (page - 1) * 9,
      });
      return {
        ok: true,
        restaurants,
        totalResults,
        totalPages: Math.ceil(totalResults / 9),
      };
    } catch (error) {
      return {
        ok: false,
        error: '식당을 검색할 수 없습니다',
      };
    }
  }
}
