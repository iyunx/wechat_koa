import jwt from 'jsonwebtoken'
import config from '../../config'

const sign = (data: {}) => {
  return new Promise((resolve, reject) => {
    jwt.sign(data, config.jwt.secret, { expiresIn: config.jwt.expireTime, algorithm: 'HS512'}, (err, data) => {
      if(err) reject(err)
      else resolve(data)
    })
  })
}

const verify = (token: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, (err, data) => {
      if(err) {
        // @ts-ignore
        err.status = 401
        reject(err)
      }
      else resolve(data)
    })
  })
}

export {
  sign,
  verify
}