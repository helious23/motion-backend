import {
  Field,
  InputType,
  ObjectType,
  PartialType,
  Int,
} from '@nestjs/graphql';

import { CreateRestaurantInput } from './create-restaurant.dto';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class EditRestaurantInput extends PartialType(CreateRestaurantInput) {
  @Field(type => Number)
  restaurantId: number;
}

@ObjectType()
export class EditRestaurantOutput extends CoreOutput {}