import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { JwtService } from '../jwt/jwt.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import {
  EditPasswordInput,
  EditPasswordOutput,
} from './dtos/edit-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly jwtService: JwtService,
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
      const existsEmail = await this.users.findOne({ email });
      if (existsEmail) {
        return {
          ok: false,
          error: '이미 등록된 이메일 입니다',
        };
      }
      const existPhoneNumber = await this.users.findOne({ phoneNumber });
      if (existPhoneNumber) {
        return {
          ok: false,
          error: '이미 등록된 전화번호 입니다',
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
          error: '비밀번호가 일치하지 않습니다',
        };
      }
      const token = this.jwtService.sign(user.id);
      return {
        ok: true,
        token,
      };
    } catch (error) {
      return {
        ok: false,
        error: '로그인하지 못했습니다',
      };
    }
  }

  async findById(id: number): Promise<UserProfileOutput> {
    try {
      const user = await this.users.findOneOrFail({ id });
      return {
        ok: true,
        user: user,
      };
    } catch (error) {
      return { ok: false, error: '사용자를 찾을 수 없습니다' };
    }
  }

  async editProfile(
    userId: number,
    { email, address, phoneNumber }: EditProfileInput,
  ): Promise<EditProfileOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (email) {
        if (user.email === email) {
          return {
            ok: false,
            error: '동일한 이메일로는 변경할 수 없습니다',
          };
        }
        const existUser = await this.users.findOne({
          where: {
            email,
          },
        });
        if (existUser?.email === email) {
          return {
            ok: false,
            error: '사용중인 이메일 입니다',
          };
        }
        user.email = email;
      }
      if (address) {
        if (user.address === address) {
          return {
            ok: false,
            error: '동일한 주소로는 변경할 수 없습니다',
          };
        }
        user.address = address;
      }
      if (user.phoneNumber === phoneNumber) {
        return {
          ok: false,
          error: '동일한 전화번호로는 변경할 수 없습니다',
        };
      }
      const existUser = await this.users.findOne({
        where: {
          phoneNumber,
        },
      });
      if (existUser?.phoneNumber === phoneNumber) {
        return {
          ok: false,
          error: '사용중인 전화번호 입니다',
        };
      }
      user.phoneNumber = phoneNumber;

      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '프로필을 수정하지 못했습니다',
      };
    }
  }

  async editPassword(
    userId: number,
    { password }: EditPasswordInput,
  ): Promise<EditPasswordOutput> {
    try {
      const user = await this.users.findOne(userId);
      if (password) {
        if (user.password === password) {
          return {
            ok: false,
            error: '동일한 비밀번호로는 변경할 수 없습니다',
          };
        }
        user.password = password;
      }
      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      console.log(error);
      return {
        ok: false,
        error: '패스워드를 수정하지 못했습니다',
      };
    }
  }
}
