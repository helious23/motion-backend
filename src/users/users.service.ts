import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
  ) {}

  async createAccount({
    email,
    password,
    name,
    phoneNumber,
    address,
    role,
  }: CreateAccountInput): Promise<CreateAccountOutput> {
    try {
      const exists = await this.users.findOne({ email });
      if (exists) {
        return {
          ok: false,
          error: '이미 등록된 이메일 입니다',
        };
      }
      await this.users.save(
        this.users.create({
          email,
          password,
          name,
          phoneNumber,
          address,
          role,
        }),
      );
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: '회원 가입을 하지 못했습니다',
      };
    }
  }

  async login({ email, password }: LoginInput): Promise<LoginOutput> {
    try {
      const user = await this.users.findOne({ email });
      if (!user) {
        return {
          ok: false,
          error: '가입하지 않은 이메일 입니다',
        };
      }
      const passwordCorrect = await user.checkPassword(password);
      if (!passwordCorrect) {
        return {
          ok: false,
          error: '비밀번호가 틀렸습니다',
        };
      }
      return {
        ok: true,
        token: '12121',
      };
    } catch (error) {
      return {
        ok: false,
        error: '로그인하지 못했습니다',
      };
    }
  }
}
