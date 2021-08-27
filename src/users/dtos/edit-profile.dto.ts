import { InputType, ObjectType, PickType, PartialType } from '@nestjs/graphql';
import { CoreOutput } from '../../common/dtos/output.dto';
import { User } from '../entities/user.entity';

@InputType()
export class EditProfileInput extends PartialType(
  PickType(User, ['email', 'name', 'address', 'phoneNumber']),
) {}

@ObjectType()
export class EditProfileOutput extends CoreOutput {}
