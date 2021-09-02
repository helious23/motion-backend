import got from 'got';
import * as FormData from 'form-data';
import { Inject, Injectable, Global } from '@nestjs/common';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { EmailVar, MailModuleOptions } from './mail.interfaces';

@Injectable()
@Global()
export class MailService {
  constructor(
    @Inject(CONFIG_OPTIONS) private readonly options: MailModuleOptions,
  ) {}

  async sendEmail(
    subject: string, // 제목
    template: string, // mailgun template name
    to: string, // mail 수신자
    emailVars: EmailVar[], // mailgun temaplate 의 variable : username, code
  ): Promise<boolean> {
    const form = new FormData();
    form.append('from', `Max from Motion <mailgun@${this.options.domain}>`);
    form.append('to', 'max16@naver.com');
    form.append('subject', subject);
    form.append('template', template);
    emailVars.forEach(emailVar =>
      form.append(`v:${emailVar.key}`, emailVar.value),
    );

    try {
      await got.post(
        `https://api.mailgun.net/v3/${this.options.domain}/messages`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(
              `api:${this.options.apiKey}`,
            ).toString('base64')}`,
          },
          body: form,
        },
      );
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }

  sendVerificationEmail(email: string, code: string) {
    this.sendEmail('Motion 이메일 인증을 해주세요', 'motion-verify', email, [
      { key: 'code', value: code },
      { key: 'username', value: email },
    ]);
  }
}
