import { InputType, ObjectType, PickType, Field } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from '../../common/dtos/output.dto';

@InputType()
export class CreateAccountInput extends PickType(User, [
  'email',
  'password',
  'name',
  'phoneNumber',
  'address',
  'role',
]) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
