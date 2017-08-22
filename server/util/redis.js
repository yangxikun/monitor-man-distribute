const redis = require('redis')
  , bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const _redis = {
  readHost: process.env.REDIS_RHOST || '127.0.0.1',
  writeHost: process.env.REDIS_WHOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB,
  auth: process.env.REDIS_AUTH,
  options: {
    retry_strategy: function (options) {
      return undefined;
    }
  },
  getReadConn: function () {
    let options = this.options;
    if (this.db) {
      options['db'] = this.db;
    }
    if (this.auth) {
      options['password'] = this.auth;
    }
    return redis.createClient(this.port, this.readHost, options);
  },
  getWriteConn: function () {
    let options = this.options;
    if (this.db) {
      options['db'] = this.db;
    }
    if (this.auth) {
      options['password'] = this.auth;
    }
    return redis.createClient(this.port, this.writeHost, options);
  }
};

module.exports = _redis;
