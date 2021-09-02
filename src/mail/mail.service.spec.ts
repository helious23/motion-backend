import * as FormData from 'form-data';
import got from 'got';
import { Test } from '@nestjs/testing';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { MailService } from './mail.service';

const TEST_KEY = 'testKey';
const TEST_DOMAIN = 'testDomain';
const TEST_MAIL = 'testMail';

jest.mock('got');
jest.mock('form-data');

describe('MailService', () => {
  let service: MailService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiKey: TEST_KEY,
            domain: TEST_DOMAIN,
            fromEmail: TEST_MAIL,
          },
        },
      ],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined;
  });

  describe('sendVerificationEmail', () => {
    it('should call sendEmail', () => {
      const sendVerificatinoEmailArgs = {
        email: 'email',
        code: 'code',
      };

      jest.spyOn(service, 'sendEmail').mockImplementation(async () => true);

      service.sendVerificationEmail(
        sendVerificatinoEmailArgs.email,
        sendVerificatinoEmailArgs.code,
      );
      expect(service.sendEmail).toHaveBeenCalledTimes(1);
      expect(service.sendEmail).toHaveBeenCalledWith(
        'Motion 이메일 인증을 해주세요',
        'motion-verify',
        sendVerificatinoEmailArgs.email,
        [
          { key: 'code', value: sendVerificatinoEmailArgs.code },
          { key: 'username', value: sendVerificatinoEmailArgs.email },
        ],
      );
    });
  });

  describe('sendEmail', () => {
    it('send email', async () => {
      const ok = await service.sendEmail('', '', '', [
        { key: 'one', value: '1' },
      ]);
      const formSpy = jest.spyOn(FormData.prototype, 'append');
      expect(formSpy).toHaveBeenCalledTimes(5);
      expect(got.post).toHaveBeenCalledTimes(1);
      expect(got.post).toHaveBeenCalledWith(
        `https://api.mailgun.net/v3/${TEST_DOMAIN}/messages`,
        expect.any(Object),
      );
      expect(ok).toBeTruthy;
    });
    it('should fail on error', async () => {
      jest.spyOn(got, 'post').mockImplementation(() => {
        throw new Error();
      });
      const ok = await service.sendEmail('', '', '', []);
      expect(ok).toBeFalsy;
    });
  });
});
