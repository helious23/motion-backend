import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { LoginInput, LoginOutput } from './dtos/login.dto';
import {
  CreateAccountInput,
  CreateAccountOutput,
} from './dtos/create-account.dto';
import { JwtService } from '../jwt/jwt.service';
import { UserProfileOutput } from './dtos/user-profile.dto';
import { EditProfileInput, EditProfileOutput } from './dtos/edit-profile.dto';
import { Verification } from './entities/verification.entity';
import { VerifyEmailOutput, VerifyEmailInput } from './dtos/verify-email.dto';
import { MailService } from '../mail/mail.service';
import {
  EditPasswordInput,
  EditPasswordOutput,
} from './dtos/edit-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Verification)
    private readonly verifications: Repository<Verification>,
    private readonly mailService: MailService,
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
      const existEmail = await this.users.findOne({ email });
      if (existEmail) {
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
      const user = await this.users.save(
        this.users.create({
          email,
          password,
          name,
          phoneNumber,
          address,
          role,
        }),
      );

      const verification = await this.verifications.save(
        this.verifications.create({
          user,
        }),
      );
      this.mailService.sendVerificationEmail(user.email, verification.code);
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
      const user = await this.users.findOne(
        { email },
        { select: ['id', 'password'] },
      );
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
        user.verified = false;
        await this.verifications.delete({ user: { id: user.id } });
        const verification = await this.verifications.save(
          this.verifications.create({ user }),
        );

        this.mailService.sendVerificationEmail(user.email, verification.code);
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
      if (phoneNumber) {
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
      }
      await this.users.save(user);
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
    { password: newPassword }: EditPasswordInput,
  ): Promise<EditPasswordOutput> {
    try {
      const user = await this.users.findOne(userId);
      const { password: oldPassword } = await this.users.findOne(userId, {
        select: ['password'],
      });
      const samePassword = await bcrypt.compare(newPassword, oldPassword);
      if (samePassword) {
        return {
          ok: false,
          error: '동일한 비밀번호로는 변경할 수 없습니다',
        };
      }
      user.password = newPassword;
      await this.users.save(user);
      return { ok: true };
    } catch (error) {
      return {
        ok: false,
        error: '패스워드를 수정하지 못했습니다',
      };
    }
  }

  async verifyEmail({ code }: VerifyEmailInput): Promise<VerifyEmailOutput> {
    try {
      const verification = await this.verifications.findOne(
        { code },
        { relations: ['user'] },
      );
      if (verification) {
        verification.user.verified = true;
        await this.users.save(verification.user);
        await this.verifications.delete(verification.id);
        return {
          ok: true,
        };
      }
      return { ok: false, error: '인증되지 않았습니다' };
    } catch (error) {
      return {
        ok: false,
        error: '이메일을 인증하지 못했습니다',
      };
    }
  }
}
