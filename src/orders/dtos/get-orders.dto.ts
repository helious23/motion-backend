import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { OrderStatus, Order } from '../entities/order.entity';
import {
  PaginationInput,
  PaginationOutput,
} from '../../common/dtos/pagination.dto';

@InputType()
export class GetOrdersInput extends PaginationInput {
  @Field(type => OrderStatus, { nullable: true })
  status?: OrderStatus;
}

@ObjectType()
export class GetOrdersOutput extends PaginationOutput {
  @Field(type => [Order], { nullable: true })
  orders?: Order[];
}
