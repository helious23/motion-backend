import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Verification } from './entities/verification.entity';
import { JwtService } from '../jwt/jwt.service';
import { MailService } from '../mail/mail.service';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => {
  return {
    compare: jest.fn(),
  };
});

const mockRepository = () => ({
  findOne: jest.fn(),
  save: jest.fn(),
  create: jest.fn(),
  findOneOrFail: jest.fn(),
  delete: jest.fn(),
});

const mockJwtService = () => ({
  sign: jest.fn(() => 'test'),
  verify: jest.fn(),
});

const mockMailService = () => ({
  sendVerificationEmail: jest.fn(),
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('UserService', () => {
  let service: UsersService;
  let usersRepository: MockRepository<User>;
  let verificationsRepository: MockRepository<Verification>;
  let mailService: MailService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: mockRepository(),
        },
        {
          provide: JwtService,
          useValue: mockJwtService(),
        },
        {
          provide: MailService,
          useValue: mockMailService(),
        },
      ],
    }).compile();
    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(getRepositoryToken(User));
    verificationsRepository = module.get(getRepositoryToken(Verification));
    mailService = module.get<MailService>(MailService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAccount', () => {
    const createAccountArgs = {
      email: 'test@email.com',
      password: 'test',
      name: 'test',
      address: 'test',
      phoneNumber: 1,
      role: 0,
    };
    it('should fail if user exists', async () => {
      usersRepository.findOne.mockResolvedValue({
        id: 1,
        email: 'mocking-user@email.com',
      });
      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: '이미 등록된 이메일 입니다',
      });
    });

    it('should fail if phone number exists', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce(undefined)
        .mockResolvedValue({ id: 1 });

      const result = await service.createAccount(createAccountArgs);
      expect(result).toMatchObject({
        ok: false,
        error: '이미 등록된 전화번호 입니다',
      });
    });

    it('should create a new user', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      usersRepository.create.mockReturnValue(createAccountArgs);
      usersRepository.save.mockResolvedValue(createAccountArgs);
      verificationsRepository.create.mockReturnValue({
        user: createAccountArgs,
      });
      verificationsRepository.save.mockResolvedValue({ code: 'test-code' });

      const result = await service.createAccount(createAccountArgs);

      expect(usersRepository.create).toHaveBeenCalledTimes(1);
      expect(usersRepository.create).toHaveBeenCalledWith(createAccountArgs);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith(createAccountArgs);

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith({
        user: createAccountArgs,
      });

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
      );

      expect(result).toEqual({ ok: true });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.createAccount(createAccountArgs);
      expect(result).toEqual({
        ok: false,
        error: '회원 가입을 하지 못했습니다',
      });
    });
  });

  describe('login', () => {
    const loginArgs = {
      email: 'test@email.com',
      password: 'test',
    };

    it('should fail if user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(undefined);
      const result = await service.login(loginArgs);
      expect(usersRepository.findOne).toHaveBeenCalledTimes(1);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(result).toEqual({
        ok: false,
        error: '가입하지 않은 이메일 입니다',
      });
    });

    it('should fail password is wrong', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(false)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '비밀번호가 일치하지 않습니다',
      });
    });

    it('should return token if password correct', async () => {
      const mockedUser = {
        id: 1,
        checkPassword: jest.fn(() => Promise.resolve(true)),
      };
      usersRepository.findOne.mockResolvedValue(mockedUser);
      const result = await service.login(loginArgs);
      expect(jwtService.sign).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).toHaveBeenCalledWith(expect.any(Number));
      expect(result).toEqual({ ok: true, token: 'test' });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.login(loginArgs);
      expect(result).toEqual({
        ok: false,
        error: '로그인하지 못했습니다',
      });
    });
  });

  describe('findById', () => {
    it('should find user', async () => {
      const findByIdArgs = {
        id: 1,
      };
      usersRepository.findOneOrFail.mockResolvedValue(findByIdArgs);
      const result = await service.findById(1);
      expect(result).toEqual({ ok: true, user: findByIdArgs });
    });

    it('should fail if no user fuond', async () => {
      usersRepository.findOneOrFail.mockRejectedValue(new Error());
      const result = await service.findById(1);
      expect(result).toEqual({
        ok: false,
        error: '사용자를 찾을 수 없습니다',
      });
    });
  });

  describe('editProfile', () => {
    it('should fail if email is same', async () => {
      usersRepository.findOne.mockResolvedValue({
        email: 'new-test@email.com',
      });
      const result = await service.editProfile(1, {
        email: 'new-test@email.com',
      });
      expect(result).toEqual({
        ok: false,
        error: '동일한 이메일로는 변경할 수 없습니다',
      });
    });

    it('should fail if email is used already', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce({
          email: 'old-email@email.com',
        })
        .mockResolvedValue({ email: 'exist@email.com' });

      const result = await service.editProfile(1, {
        email: 'exist@email.com',
      });
      expect(result).toEqual({
        ok: false,
        error: '사용중인 이메일 입니다',
      });
    });

    it('should change email', async () => {
      const oldUser = {
        email: 'old@email.com',
        verified: true,
      };
      const editprofileArgs = {
        userId: 1,
        input: { email: 'new@email.com' },
      };
      const newVerification = {
        code: 'code',
      };

      usersRepository.findOne
        .mockResolvedValueOnce(oldUser)
        .mockResolvedValue(undefined);

      verificationsRepository.delete.mockReturnValue(newVerification);
      verificationsRepository.create.mockReturnValue(newVerification);
      verificationsRepository.save.mockResolvedValue(newVerification);

      await service.editProfile(editprofileArgs.userId, editprofileArgs.input);

      expect(usersRepository.findOne).toHaveBeenCalledTimes(2);
      expect(usersRepository.findOne).toHaveBeenCalledWith(
        editprofileArgs.userId,
      );

      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);

      expect(verificationsRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.create).toHaveBeenCalledWith({
        user: { email: editprofileArgs.input.email, verified: false },
      });

      expect(verificationsRepository.save).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.save).toHaveBeenCalledWith(
        newVerification,
      );

      expect(mailService.sendVerificationEmail).toHaveBeenCalledTimes(1);
      expect(mailService.sendVerificationEmail).toHaveBeenCalledWith(
        editprofileArgs.input.email,
        newVerification.code,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        email: editprofileArgs.input.email,
        verified: false,
      });
    });

    it('should fail if address is same', async () => {
      usersRepository.findOne.mockResolvedValue({
        address: 'new-address',
      });
      const result = await service.editProfile(1, {
        address: 'new-address',
      });
      expect(result).toEqual({
        ok: false,
        error: '동일한 주소로는 변경할 수 없습니다',
      });
    });

    it('should change address', async () => {
      const oldUser = {
        address: 'old-address',
      };
      const editprofileArgs = {
        userId: 1,
        input: { address: 'new-address' },
      };
      usersRepository.findOne.mockResolvedValueOnce(oldUser);

      await service.editProfile(editprofileArgs.userId, editprofileArgs.input);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        address: editprofileArgs.input.address,
      });
    });

    it('should fail if phoneNumber is same', async () => {
      usersRepository.findOne.mockResolvedValue({
        phoneNumber: 1234,
      });
      const result = await service.editProfile(1, {
        phoneNumber: 1234,
      });
      expect(result).toEqual({
        ok: false,
        error: '동일한 전화번호로는 변경할 수 없습니다',
      });
    });

    it('should fail if phoneNumber is used already', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce({
          phoneNumber: 1234,
        })
        .mockResolvedValue({ phoneNumber: 5678 });

      const result = await service.editProfile(1, {
        phoneNumber: 5678,
      });
      expect(result).toEqual({
        ok: false,
        error: '사용중인 전화번호 입니다',
      });
    });

    it('should change phoneNumber', async () => {
      const oldUser = {
        phoneNumber: 1234,
      };
      const editprofileArgs = {
        userId: 1,
        input: { phoneNumber: 5678 },
      };
      usersRepository.findOne.mockResolvedValueOnce(oldUser);

      await service.editProfile(editprofileArgs.userId, editprofileArgs.input);

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        phoneNumber: editprofileArgs.input.phoneNumber,
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editProfile(1, { email: 'old@email.com' });
      expect(result).toEqual({
        ok: false,
        error: '프로필을 수정하지 못했습니다',
      });
    });
  });

  describe('editPassword', () => {
    it('should fail if password is same', async () => {
      usersRepository.findOne
        .mockResolvedValueOnce({
          password: 'new-password',
        })
        .mockResolvedValue({ password: 'new-password' });

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => true);

      const result = await service.editPassword(1, {
        password: 'new-password',
      });
      expect(result).toEqual({
        ok: false,
        error: '동일한 비밀번호로는 변경할 수 없습니다',
      });
    });

    it('should change password', async () => {
      const oldUser = {
        password: 'old-password',
      };
      const editPasswordArgs = {
        userId: 1,
        input: { password: 'new-password' },
      };
      usersRepository.findOne
        .mockResolvedValueOnce(oldUser)
        .mockResolvedValue(editPasswordArgs.input);

      jest.spyOn(bcrypt, 'compare').mockImplementation(async () => false);

      await service.editPassword(
        editPasswordArgs.userId,
        editPasswordArgs.input,
      );

      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({
        password: editPasswordArgs.input.password,
      });
    });

    it('should fail on exception', async () => {
      usersRepository.findOne.mockRejectedValue(new Error());
      const result = await service.editPassword(1, { password: 'oldpassword' });
      expect(result).toEqual({
        ok: false,
        error: '패스워드를 수정하지 못했습니다',
      });
    });
  });

  describe('verifyEmail', () => {
    it('should verify email', async () => {
      const mockedVerification = {
        user: {
          verified: false,
        },
        id: 1,
      };
      verificationsRepository.findOne.mockResolvedValue(mockedVerification);

      const result = await service.verifyEmail({ code: '' });
      expect(verificationsRepository.findOne).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.findOne).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object),
      );
      expect(usersRepository.save).toHaveBeenCalledTimes(1);
      expect(usersRepository.save).toHaveBeenCalledWith({ verified: true });

      expect(verificationsRepository.delete).toHaveBeenCalledTimes(1);
      expect(verificationsRepository.delete).toHaveBeenCalledWith(
        mockedVerification.id,
      );

      expect(result).toEqual({ ok: true });
    });
    it('should fail on verification not found', async () => {
      verificationsRepository.findOne.mockResolvedValue(undefined);
      const result = await service.verifyEmail({ code: '' });
      expect(result).toEqual({ ok: false, error: '인증되지 않았습니다' });
    });
    it('should fail on exception', async () => {
      verificationsRepository.findOne.mockRejectedValue(new Error());
      const result = await service.verifyEmail({ code: '' });
      expect(result).toEqual({
        ok: false,
        error: '이메일을 인증하지 못했습니다',
      });
    });
  });
});
