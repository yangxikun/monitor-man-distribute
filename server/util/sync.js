const redis = require('./redis')
  , logger = require('./log').get('sync')
  , intervalIds = require('./intervalIds')
  , fs = require('fs')
  , Collection = require('postman-collection').Collection
  , newman = require('./newman');

const _sync = {
  run: async function() {
    try {
      let redisClient = redis.getReadConn();
      const collectionInfos = await redisClient.hgetallAsync('monitor-man-collection');
      for (let id in collectionInfos) {
        let collectionInfo = JSON.parse(collectionInfos[id]);
        const curDistribute = process.env[collectionInfo.distributeName];
        if (!curDistribute) {
          continue;
        }

        // clean failures
        this.rotateSummaries(id, curDistribute, collectionInfo.reserved);

        const i = intervalIds.get(id);
        const distribute = collectionInfo.distributes[curDistribute];

        // if the collection has been stop
        if (!distribute || distribute.status === 'stop') {
          if (i) {
            clearInterval(i.intervalId);
            intervalIds.del(id);
          }
          continue;
        }

        // if the collection hasn't been run or collection has been update
        if (i === undefined || i.ts < distribute.timestamp) {
          if (i) {
            clearInterval(i.intervalId);
            intervalIds.del(id);
          }
          const collectionFileData = await redisClient.hgetAsync('monitor-man-collectionFile', id);
          if (!collectionFileData) {
            logger.error(collectionInfo.name + ' ' + id + 'collection file not found!');
            continue;
          }
          if (!fs.existsSync(collectionInfo.collectionFile)) {
            fs.writeFileSync(collectionInfo.collectionFile, collectionFileData)
          }
          const cObj = new Collection(JSON.parse(collectionFileData));
          let newmanOption = Object.assign({
            collection: cObj,
            abortOnError: true
          }, collectionInfo.newmanOption);
          if (newmanOption.timeoutRequest === 0) {
            delete newmanOption.timeoutRequest;
          }

          let path;
          if (collectionInfo.iterationData[curDistribute]) {
            const iterationData = await redisClient.hgetAsync('monitor-man-iterationData', id + '-' + curDistribute);
            if (iterationData) {
              path = collectionInfo.iterationData[curDistribute].path;
              if (!fs.existsSync(path)) {
                fs.writeFileSync(path, iterationData);
              }
              newmanOption.iterationData = path;
            }
          }
          if (collectionInfo.environment[curDistribute]) {
            const environment = await redisClient.hgetAsync('monitor-man-environment', id + '-' + curDistribute);
            if (environment) {
              path = collectionInfo.environment[curDistribute].path;
              if (!fs.existsSync(path)) {
                fs.writeFileSync(path, environment);
              }
              newmanOption.environment = path;
            }
          }
          if (distribute.status === 'running') {
            const intervalId = this.setInterval(newmanOption, id, collectionInfo.interval);
            intervalIds.add(id, intervalId, distribute.timestamp);
            logger.info("restore " + id + '-' + curDistribute);
          }
        }
      }
    } catch (e) {
      logger.error(e);
    }
  },
  setInterval: function(newmanOption, id, interval) {
    return setInterval(function () {
      newman.run(newmanOption, id);
    }, interval);
  },
  rotateSummaries: async function(collectionId, distribute, reserved) {
    let redisClient = redis.getWriteConn();
    const now = Date.now();
    const summaries = await redisClient.zrangebyscoreAsync('monitor-man-summary-' + collectionId + '-' + distribute, 0, now-reserved*24*3600*1000);
    const failuresKey = 'monitor-man-summary-failures-' + collectionId + '-' + distribute;
    for (let index in summaries) {
      const _summaries = JSON.parse(summaries[index]);
      for (let failureId in _summaries.assertions.failures) {
        await redisClient.hdelAsync(failuresKey, failureId);
      }
      for (let failureId in _summaries.assertions.failures) {
        await redisClient.hdelAsync(failuresKey, failureId);
      }
    }
    await redisClient.zremrangebyscoreAsync('monitor-man-summary-' + collectionId + '-' + distribute, 0, now-reserved*24*3600*1000);
  }
};

module.exports = _sync;
