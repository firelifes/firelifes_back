import { Provide, Config } from '@midwayjs/core';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { SmsCode, SmsCodeType } from '../entity/sms_code.entity';

@Provide()
export class SmsService {
  @InjectEntityModel(SmsCode)
  smsCodeModel: Repository<SmsCode>;

  @Config('spugPush')
  spugPushConfig: { url: string };

  private readonly CODE_EXPIRES_MINUTES = 5;
  private readonly SEND_INTERVAL_SECONDS = 60;
  private readonly MAX_SEND_PER_DAY = 100;

  async sendCode(phone: string, type: SmsCodeType): Promise<void> {
    const now = new Date();

    const lastCode = await this.smsCodeModel.findOne({
      where: { phone },
      order: { createdAt: 'DESC' },
    });

    if (lastCode) {
      const secondsSinceLastSend = (now.getTime() - lastCode.createdAt.getTime()) / 1000;
      if (secondsSinceLastSend < this.SEND_INTERVAL_SECONDS) {
        throw new Error('发送太频繁，请稍后再试');
      }

      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const todayCount = await this.smsCodeModel.count({
        where: {
          phone,
          createdAt: LessThan(todayStart),
        },
      });

      if (todayCount >= this.MAX_SEND_PER_DAY) {
        throw new Error('今日发送次数已达上限');
      }
    }

    const code = this.generateCode();
    const expiresAt = new Date(now.getTime() + this.CODE_EXPIRES_MINUTES * 60 * 1000);

    const smsCode = this.smsCodeModel.create({
      phone,
      code,
      type,
      expiresAt,
      used: false,
    });

    await this.smsCodeModel.save(smsCode);

    console.log(`\n========== 短信验证码 ==========`);
    console.log(`📱 手机号: ${phone}`);
    console.log(`🔢 验证码: ${code}`);
    console.log(`⏰ 有效期: ${this.CODE_EXPIRES_MINUTES} 分钟`);
    console.log(`📋 类型: ${type}`);
    console.log(`================================\n`);

    await this.sendSmsViaSpug(phone, code);
  }

  async verifyCode(phone: string, code: string, type: SmsCodeType): Promise<boolean> {
    const now = new Date();

    const smsCode = await this.smsCodeModel.findOne({
      where: { phone, code, type, used: false },
      order: { createdAt: 'DESC' },
    });

    if (!smsCode) {
      return false;
    }

    if (smsCode.expiresAt < now) {
      return false;
    }

    smsCode.used = true;
    await this.smsCodeModel.save(smsCode);

    return true;
  }

  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async sendSmsViaSpug(phone: string, code: string): Promise<void> {
    const baseUrl = this.spugPushConfig?.url;

    if (!baseUrl) {
      console.log('ℹ️ Spug API URL 未配置（SPUG_PUSH_URL），跳过短信发送');
      return;
    }

    const spugUrl = `${baseUrl}?code=${code}&targets=${phone}`;

    try {
      const response = await fetch(spugUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '验证码',
          content: `您的验证码是：${code}，有效期${this.CODE_EXPIRES_MINUTES}分钟，请勿泄露。`,
        }),
      });

      if (response.ok) {
        const result = await response.text();
        console.log(`✅ Spug 短信发送成功: ${result}`);
      } else {
        console.warn(`⚠️ Spug 短信发送失败（HTTP ${response.status}）: ${await response.text()}`);
      }
    } catch (error) {
      console.warn('⚠️ Spug 短信发送异常（接口不可达或网络问题，验证码仍已存入数据库）:', error);
    }
  }
}