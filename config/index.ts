const config = {
  server: {
    url: 'http://192.168.2.3:8000',
    port: Number(process.env.SERVER_POST) || 8000
  },
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE || 'wechat',
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '123456'
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  jwt: {
    secret: process.env.JWT_SECRET || '4c903a51-6790-445b-a255-596f67dfac72',
    expireTime: process.env.JWT_EXPIRED || '1d'
  },
  pwd: {
    secret: 'd8781367-a8cb-4aef-837b-d15707b2cef7',
    // iv: '949c357d-e763-4495-a9b7-ccc5464e85a0'
  },
  sms: {
    accessKeyId: '',
    accessKeySecret: '',
    endpoint: 'dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
  }
}

export default config