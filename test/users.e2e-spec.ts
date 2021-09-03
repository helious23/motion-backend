import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { getConnection, Repository } from 'typeorm';
import * as request from 'supertest';
import { User } from '../src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Verification } from '../src/users/entities/verification.entity';

jest.mock('got', () => {
  return {
    post: jest.fn(),
  };
});

const GRAPHQL_ENDPOINT = '/graphql';

const testUser = {
  email: 'test@test.com',
  password: '12345',
};

describe('UserModule (e2e)', () => {
  let app: INestApplication;
  let usersRepository: Repository<User>;
  let verificationRepository: Repository<Verification>;
  let jwtToken: string;

  const baseTest = () => request(app.getHttpServer()).post(GRAPHQL_ENDPOINT);

  const publicTest = (query: string) => baseTest().send({ query });
  const privateTest = (query: string) =>
    baseTest().set('x-jwt', jwtToken).send({ query });

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    verificationRepository = module.get<Repository<Verification>>(
      getRepositoryToken(Verification),
    );
    await app.init();
  });

  afterAll(async () => {
    await getConnection().dropDatabase();
    app.close();
  });

  describe('createAccount', () => {
    it('should create account', () => {
      return publicTest(`
          mutation {
            createAccount(
              input: {
                email: "${testUser.email}"
                password: "${testUser.password}"
                address:"mosman NSW Sydney 2088 Australia"
                phoneNumber:412414781
                role: Owner
                name: "max"
              }
            ) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBeTruthy;
          expect(createAccount.error).toBeNull;
        });
    });
    it('should fail if account already exists', () => {
      return publicTest(`
          mutation {
            createAccount(
              input: {
                email: "${testUser.email}"
                password: "121212"
                address:"mosman NSW Sydney 2088 Australia"
                phoneNumber:412414781
                role: Owner
                name: "max"
              }
            ) {
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { createAccount },
            },
          } = res;
          expect(createAccount.ok).toBeFalsy;
          expect(createAccount.error).toEqual(expect.any(String));
        });
    });
  });

  describe('login', () => {
    it('should login with token', () => {
      return publicTest(`
          mutation{
            login(input:{
              email:"${testUser.email}",
              password:"${testUser.password}",
            }){
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBeTruthy;
          expect(login.error).toBeNull;
          expect(login.token).toEqual(expect.any(String));
          jwtToken = login.token;
        });
    });
    it('should fail to login with wrong password', () => {
      return publicTest(`
          mutation{
            login(input:{
              email:"${testUser.email}",
              password:"wrong.password",
            }){
              ok
              error
              token
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: { login },
            },
          } = res;
          expect(login.ok).toBeFalsy;
          expect(login.error).toEqual(expect.any(String));
          expect(login.token).toBeNull;
        });
    });
  });

  describe('userProfile', () => {
    let userId: number;
    beforeAll(async () => {
      const [user] = await usersRepository.find();
      userId = user.id;
    });
    it("should see a user's profile", () => {
      return privateTest(`
          {
            userProfile(userId:${userId}){
              user{
                id
                name
                email
                role
              }
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: {
                  ok,
                  error,
                  user: { id },
                },
              },
            },
          } = res;
          expect(ok).toBeTruthy;
          expect(error).toBeNull;
          expect(id).toBe(userId);
        });
    });
    it('should not find a profile', () => {
      return privateTest(`
          {
            userProfile(userId:123){
              user{
                id
                name
                email
                role
              }
              ok
              error
            }
          }
        `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                userProfile: { ok, error, user },
              },
            },
          } = res;
          expect(ok).toBeFalsy;
          expect(error).toEqual(expect.any(String));
          expect(user).toBe(null);
        });
    });
  });

  describe('me', () => {
    it('shold see my profile', () => {
      return privateTest(`
            {
              me{
                email
              }
            }
          `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toEqual(testUser.email);
        });
    });
    it('should not allow logged out user', () => {
      return publicTest(`
            {
              me{
                email
              }
            }
          `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              errors: [{ message }],
            },
          } = res;
          expect(message).toBe('Forbidden resource');
        });
    });
  });
  describe('editProfile', () => {
    const NEW_EMAIL = 'new@email.com';

    it('should change email', () => {
      return privateTest(`
        mutation
          {
            editProfile(input:{email:"${NEW_EMAIL}"}){
              ok
              error
            }
          }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editProfile: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy;
          expect(error).toBeNull;
        });
    });

    it('should have new email', () => {
      return privateTest(`
        {
          me{
            email
          }
        }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                me: { email },
              },
            },
          } = res;
          expect(email).toBe(NEW_EMAIL);
        });
    });
  });
  describe('editPassword', () => {
    const NEW_PASSWORD = 'new-password';
    it('should change password', () => {
      return privateTest(`
        mutation
          {
            editPassword(input:{password:"${NEW_PASSWORD}"}){
              ok
              error
            }
          }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                editPassword: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy;
          expect(error).toBeNull;
        });
    });
  });

  describe('verifyEmail', () => {
    let verificationCode: string;
    beforeAll(async () => {
      const [verification] = await verificationRepository.find();
      verificationCode = verification.code;
    });
    it('should verify email', () => {
      return publicTest(`
        mutation
          {
            verifyEmail(input:{code:"${verificationCode}"}){
              ok
              error
            }
          }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeTruthy;
          expect(error).toBeNull;
        });
    });
    it('should fail verification is not found', () => {
      return publicTest(`
        mutation
            {
              verifyEmail(input:{code:"wrong-code"}){
                ok
                error
              }
            }
      `)
        .expect(200)
        .expect(res => {
          const {
            body: {
              data: {
                verifyEmail: { ok, error },
              },
            },
          } = res;
          expect(ok).toBeFalsy;
          expect(error).toEqual(expect.any(String));
        });
    });
  });
});
