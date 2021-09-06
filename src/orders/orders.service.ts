import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderOutput, CreateOrderInput } from './dtos/create-order.dto';
import { User } from '../users/entities/user.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order) private readonly orders: Repository<Order>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      if (!restaurant) {
        return {
          ok: false,
          error: '식당을 찾을 수 없습니다',
        };
      }
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
        }),
      );
      console.log(order);
    } catch (error) {
      return {
        ok: false,
        error: '주문을 생성할 수 없습니다',
      };
    }
  }
}
