import Redis from 'ioredis'
import config from '../../config'

const redis = new Redis(config.redis.port, config.redis.host);

// redis.set("foo", '123')
// redis.expire("foo", 2) // 2秒 过期时间

export default redis