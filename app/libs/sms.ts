// This file is auto-generated, don't edit it
import Dysmsapi20170525, * as $Dysmsapi20170525 from '@alicloud/dysmsapi20170525';
// 依赖的模块可通过下载工程中的模块依赖文件或右上角的获取 SDK 依赖信息查看
import OpenApi, * as $OpenApi from '@alicloud/openapi-client';
import redis from './redis'
import cf from '../../config';

const params = {
  SignName: "爱阆中",
  TemplateCode: "SMS_185555039"
}

export default class Client {
  /**
   * 使用AK&SK初始化账号Client
   * @param accessKeyId
   * @param accessKeySecret
   * @return Client
   * @throws Exception
   */
  static createClient(accessKeyId: string, accessKeySecret: string): Dysmsapi20170525 {
    let config = new $OpenApi.Config({
      // 您的AccessKey ID
      accessKeyId,
      // 您的AccessKey Secret
      accessKeySecret,
    });
    // 访问的域名
    config.endpoint = "dysmsapi.aliyuncs.com";
    return new Dysmsapi20170525(config);
  }

  static async main(args: string[]) {
    console.log(args[3])
    let client = Client.createClient(cf.sms.accessKeyId, cf.sms.accessKeySecret);
    let sendSmsRequest = new $Dysmsapi20170525.SendSmsRequest({
      phoneNumbers: args[0],
      signName: args[1],
      templateCode: args[2],
      templateParam: `{code: ${args[3]}}`,
    });
    // 复制代码运行请自行打印 API 的返回值
    return await client.sendSms(sendSmsRequest);
  }

}

// Client.main(process.argv.slice(2));