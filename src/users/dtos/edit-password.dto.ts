import { InputType, ObjectType, PickType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditPasswordInput extends PartialType(
  PickType(User, ['password']),
) {}

@ObjectType()
export class EditPasswordOutput extends CoreOutput {}
