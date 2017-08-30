const newman = require('newman')
  , newmanIntervalLogger = require('./log').get('newman')
  , intervalIds = require('./intervalIds')
  , redis = require('./redis')
  , date = require('date-and-time')
  , uuidv1 = require('uuid/v1')
  , safeEval = require('safe-eval');

const _newman = {
  run: function (newmanOption, collectionId) {

    newman.run(newmanOption, async (err, summary) => {
      try {
        if (err) {
          this.stop(collectionId);
          newmanIntervalLogger.error(err);
          return;
        }

        newmanIntervalLogger.debug('run newman with options:\n', newmanOption);

        // update run result
        let redisClient = redis.getWriteConn();
        const _collectionInfo = await redisClient.hgetAsync('monitor-man-collection', collectionId);
        const collectionInfo = JSON.parse(_collectionInfo);
        if (collectionInfo === null) {
          newmanIntervalLogger.error("cannot get collection info "+ collectionId);
          this.stop(collectionId);
          return
        }

        const curDistribute = process.env[collectionInfo.distributeName];
        newmanIntervalLogger.info('collection#' + collectionId + '-' + curDistribute + ' run complete!');
        if (!collectionInfo.distributes[curDistribute]) {
          newmanIntervalLogger.info('collection#' + collectionId + '-' + curDistribute + ' has been delete, stop run!')
          this.stop(collectionId);
          return
        }


        // save result summary
        let _summary = {};
        const started = new Date(summary.run.timings.started);
        _summary['started'] = date.format(started, 'YYYY/MM/DD HH:mm:ss');
        const completed = new Date(summary.run.timings.completed);
        _summary['completed'] = date.format(completed, 'YYYY/MM/DD HH:mm:ss');
        _summary['cost'] = summary.run.timings.completed - summary.run.timings.started;
        const assertions = summary.run.stats.assertions;
        const testScripts = summary.run.stats.testScripts;
        _summary['assertions'] = {
          success: assertions.total - assertions.failed,
          failed: assertions.failed,
          failures: {},
        };
        _summary['testScripts'] = {
          success: testScripts.total - testScripts.failed,
          failed: testScripts.failed,
          failures: {},
        };
        let redisClientMulti = redisClient.multi();
        const failures = summary.run.failures;
        if (failures.length > 0) {
          let _failures = {};
          for (let i in failures) {
            if (_failures[failures[i].cursor.ref]) {
              _failures[failures[i].cursor.ref].push(failures[i]);
            } else {
              _failures[failures[i].cursor.ref] = [failures[i]];
            }
          }
          for (let i in summary.run.executions) {
            const execution = summary.run.executions[i];
            const failureExecutions = _failures[execution.cursor.ref];
            if (!failureExecutions) continue;

            if (execution.response) {
              execution.response.stream = execution.response.stream.toString();
            }
            const jsonExecution = JSON.stringify(execution);

            for (let index in failureExecutions) {
              const failureExecution = failureExecutions[index];
              const name = failureExecution.source.name + ': ' + failureExecution.error.message;
              const failureId = uuidv1();
              if (execution.assertions) {
                const _failureId = failureId+'a'+i+index;
                _summary['assertions'].failures[_failureId] = name;
                redisClientMulti = redisClientMulti
                  .hset('monitor-man-summary-failures-' + collectionId + '-' + curDistribute, _failureId, jsonExecution);
              }
              if (execution.testScript) {
                const _failureId = failureId+'t'+i+index;
                _summary['testScripts'].failures[_failureId] = name;
                redisClientMulti = redisClientMulti
                  .hset('monitor-man-summary-failures-' + collectionId + '-' + curDistribute, _failureId, jsonExecution);
              }
            }
          }
        }
        collectionInfo.distributes[curDistribute]['summary'] = _summary;
        redisClientMulti
          .zadd('monitor-man-summary-' + collectionId + '-' + curDistribute, summary.run.timings.completed, JSON.stringify(_summary))
          .hset('monitor-man-collection', collectionId, JSON.stringify(collectionInfo))
          .exec(function (err, reply) {
            if (err) {
              newmanIntervalLogger.error(err);
            }
          });

        // alert failures
        if (collectionInfo.handler !== '' && failures.length > 0) {
          const handler = await redisClient.hgetAsync('monitor-man-handler', collectionInfo.handler);
          if (handler) {
            const handlerParams = JSON.parse(collectionInfo.handlerParams);
            const request = require('postman-request');
            const sprintf = require("sprintf-js").sprintf;
            const vsprintf = require("sprintf-js").vsprintf;
            const redisClient = redis.getWriteConn();
            const context = {
              console: console,
              summary: summary,
              redis: redisClient,
              request: request,
              date: date,
              sprintf: sprintf,
              vsprintf: vsprintf,
              handlerParams: handlerParams,
              distribute: curDistribute
            };
            const obj = JSON.parse(handler);
            if (obj) {
              safeEval(obj.code, context);
            }
          }
        }
      } catch (e) {
        newmanIntervalLogger.error(e);
      }
    }); // run
  },
  stop: function (collectionId) {
    const i = intervalIds.get(collectionId);
    if (i) {
      clearInterval(i.intervalId);
      intervalIds.del(collectionId);
    }
  }
};

module.exports = _newman;
