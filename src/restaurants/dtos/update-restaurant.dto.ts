import { ArgsType, Field, InputType, PartialType, Int } from '@nestjs/graphql';
import { CreateRestaurantInput } from './create-restaurant.dto';

@InputType()
class UpdateRestaurantInput extends PartialType(CreateRestaurantInput) {}

@InputType()
export class UpdateRestaurantDto {
  @Field(type => Int)
  id: number;

  @Field(type => UpdateRestaurantInput)
  updateRestaurantInput: UpdateRestaurantInput;
}
