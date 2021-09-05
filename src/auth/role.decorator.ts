import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../users/entities/user.entity';

export type AllowedRoles = keyof typeof UserRole | 'Any';
/**
 * SetMetadata decorator 를 리턴하는 함수형 decorator 생성
 *
 * array of role 이 roles 라는 metadata 에 저장 SetMetadata(key, value)
 */
export const Role = (roles: AllowedRoles[]) => SetMetadata('roles', roles);
