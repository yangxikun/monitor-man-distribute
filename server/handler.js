const router = new (require('koa-router'))({prefix: '/handler'})
  , redis = require('./util/redis')
  , uuidv1 = require('uuid/v1')
  , date = require('date-and-time')
  , safeEval = require('safe-eval');

// get all handlers
router.get('/', async function (ctx) {
  const redisClient = redis.getReadConn();
  const handlers = await redisClient.hgetallAsync('monitor-man-handler');
  ctx.response.body = [];
  for (let id in handlers) {
    const handler = JSON.parse(handlers[id]);
    ctx.response.body.push(Object.assign({
      id: id
    }, handler));
  }
});

// get handler
router.get('/:id', async function (ctx) {
  const redisClient = redis.getReadConn();
  ctx.response.body = await redisClient.hgetAsync('monitor-man-handler', ctx.params.id);
});

// create handler
router.post('/', async function (ctx) {
  const redisClient = redis.getWriteConn();
  let handler = {};
  handler['name'] = ctx.checkBody('name').notEmpty().value;
  handler['description'] = ctx.checkBody('description').notEmpty().value;
  handler['code'] = ctx.checkBody('code').notEmpty().value;
  if (ctx.errors) {
    ctx.response.status = 400;
    ctx.response.body = ctx.errors;
    return;
  }

  const handlerId = uuidv1();
  await redisClient.hsetAsync('monitor-man-handler', handlerId, JSON.stringify(handler));
  ctx.response.body = '';
});

// update handler
router.post('/:id/update', async function (ctx) {
  const redisClient = redis.getWriteConn();
  let handler = {};
  handler['name'] = ctx.checkBody('name').notEmpty().value;
  handler['description'] = ctx.checkBody('description').notEmpty().value;
  handler['code'] = ctx.checkBody('code').notEmpty().value;
  if (ctx.errors) {
    ctx.response.status = 400;
    ctx.response.body = ctx.errors;
    return;
  }

  await redisClient.hsetAsync('monitor-man-handler', ctx.params.id, JSON.stringify(handler));
  ctx.response.body = '';
});

// remove handler
router.delete('/:id', async function (ctx) {
  const redisClient = redis.getWriteConn();
  await redisClient.hdelAsync('monitor-man-handler', ctx.params.id);
  ctx.response.body = '';
});

// debug handler
router.post('/:id/debug', async function (ctx) {
  const code = ctx.checkBody('code').notEmpty().value;
  const handlerParams = {};
  const request = require('postman-request');
  const sprintf = require("sprintf-js").sprintf;
  const vsprintf = require("sprintf-js").vsprintf;
  const redisClient = redis.getWriteConn();
  const summary = JSON.parse('{"collection":{"info":{"id":"c3a34a9d-a660-83a5-223a-54afb11ace02","name":"Test abc.com","schema":"https://schema.getpostman.com/json/collection/v2.0.0/collection.json"},"event":[],"variable":[],"item":[{"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","name":"Test Assertion","request":{"url":"http://abc.com/testassertion","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"9b1d547e-db76-4521-9323-50f8dd1aeb0d"}}]},{"id":"7f2741a4-afcd-4d74-9138-abad038f3699","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"93334e58-bbe1-487b-9ffd-6c35351d061c"}}]}]},"environment":{"id":"97377273-d3da-4e59-92c1-4c93daae1c25","values":[]},"globals":{"id":"bd9a2b49-1e03-410d-ada2-b52cd0dc9142","values":[]},"run":{"stats":{"iterations":{"total":1,"pending":0,"failed":0},"items":{"total":2,"pending":0,"failed":0},"scripts":{"total":2,"pending":0,"failed":1},"prerequests":{"total":2,"pending":0,"failed":0},"requests":{"total":2,"pending":0,"failed":0},"tests":{"total":2,"pending":0,"failed":0},"assertions":{"total":1,"pending":0,"failed":1},"testScripts":{"total":2,"pending":0,"failed":1},"prerequestScripts":{"total":0,"pending":0,"failed":0}},"timings":{"responseAverage":32.5,"started":1503825021524,"completed":1503825021647},"executions":[{"cursor":{"position":0,"iteration":0,"length":2,"cycles":1,"empty":false,"eof":false,"bof":true,"cr":false,"ref":"13db093e-b091-4583-a390-3f15c13663cc"},"item":{"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","name":"Test Assertion","request":{"url":"http://abc.com/testassertion","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"9b1d547e-db76-4521-9323-50f8dd1aeb0d"}}]},"request":{"url":"http://abc.com/testassertion","method":"GET","header":[{"key":"User-Agent","value":"PostmanRuntime/6.2.5"},{"key":"Accept","value":"*/*"},{"key":"Host","value":"abc.com"},{"key":"accept-encoding","value":"gzip, deflate"}],"body":{},"description":{"content":"","type":"text/plain"}},"response":{"id":"c341e3b4-673e-49fd-ba6a-e1b94f522dc7","status":"OK","code":200,"header":[{"key":"Server","value":"openresty"},{"key":"Date","value":"Sun, 27 Aug 2017 09:10:21 GMT"},{"key":"Content-Type","value":"application/json; charset=utf-8"},{"key":"Transfer-Encoding","value":"chunked"},{"key":"Connection","value":"keep-alive"}],"stream":{"type":"Buffer","data":[91,34,229,164,169,230,176,148,34,44,91,34,229,164,169,230,176,148,233,162,132,230,138,165,34,44,34,229,164,169,230,176,148,233,162,132,230,138,165,49,53,229,164,169,230,159,165,232,175,162,34,44,34,229,164,169,230,176,148,230,159,165,232,175,162,34,44,34,229,164,169,230,176,148,233,162,132,230,138,165,230,159,165,232,175,162,228,184,128,229,145,168,34,44,34,229,164,169,230,176,148,229,156,168,231,186,191,34,44,34,229,164,169,230,176,148,233,162,132,230,138,165,230,159,165,232,175,162,228,184,128,229,145,168,49,53,229,164,169,34,93,93,10]},"cookie":[],"responseTime":33,"responseSize":143},"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","assertions":[{"assertion":"Status code is 200","error":{"name":"AssertionFailure","index":1,"message":"Status code is 200","stack":"AssertionFailure: Expected tests[\\"Status code is 200\\"] to be true-like\\n   at Object.eval test.js:2:1)"}}]},{"cursor":{"ref":"c6d63d13-edba-4420-a546-a82d644e1602","length":2,"cycles":1,"position":1,"iteration":0},"item":{"id":"7f2741a4-afcd-4d74-9138-abad038f3699","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"93334e58-bbe1-487b-9ffd-6c35351d061c"}}]},"request":{"url":"http://abc.com","method":"GET","header":[{"key":"User-Agent","value":"PostmanRuntime/6.2.5"},{"key":"Accept","value":"*/*"},{"key":"Host","value":"abc.com"},{"key":"accept-encoding","value":"gzip, deflate"}],"body":{},"description":{"content":"","type":"text/plain"}},"response":{"id":"eb139e0b-1051-4135-82d5-7a8f554a0133","status":"Not Found","code":404,"header":[{"key":"Server","value":"openresty"},{"key":"Date","value":"Sun, 27 Aug 2017 09:10:21 GMT"},{"key":"Content-Type","value":"text/html"},{"key":"Content-Length","value":"162"},{"key":"Connection","value":"keep-alive"}],"stream":{"type":"Buffer","data":[60,104,116,109,108,62,13,10,60,104,101,97,100,62,60,116,105,116,108,101,62,52,48,52,32,78,111,116,32,70,111,117,110,100,60,47,116,105,116,108,101,62,60,47,104,101,97,100,62,13,10,60,98,111,100,121,32,98,103,99,111,108,111,114,61,34,119,104,105,116,101,34,62,13,10,60,99,101,110,116,101,114,62,60,104,49,62,52,48,52,32,78,111,116,32,70,111,117,110,100,60,47,104,49,62,60,47,99,101,110,116,101,114,62,13,10,60,104,114,62,60,99,101,110,116,101,114,62,110,103,105,110,120,60,47,99,101,110,116,101,114,62,13,10,60,47,98,111,100,121,62,13,10,60,47,104,116,109,108,62,13,10]},"cookie":[],"responseTime":32,"responseSize":162},"id":"7f2741a4-afcd-4d74-9138-abad038f3699","testScript":[{"error":{"type":"Error","name":"JSONError","message":"Unexpected token \'<\' at 1:1\\n<html>\\n^","checksum":"b7db65fd7db5667f384af70acdddcfb0","id":"44a6232b-75c9-4c1b-958b-7575c75cd8aa","timestamp":1503825021641,"stacktrace":[]}}]}],"transfers":{"responseTotal":305},"failures":[{"error":{"name":"AssertionFailure","index":1,"message":"Status code is 200","stack":"AssertionFailure: Expected tests[\\"Status code is 200\\"] to be true-like\\n   at Object.eval test.js:2:1)","checksum":"0b82afce4c9c8b2417e2ee62e6dd110b","id":"b8187d0e-eb14-4759-b3e5-13e3038c6792","timestamp":1503825021576,"stacktrace":[{"fileName":"test.js","lineNumber":2,"functionName":"Object.eval","typeName":"Object","methodName":"eval","columnNumber":1,"native":false}]},"at":"assertion:1 in test-script","source":{"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","name":"Test Assertion","request":{"url":"http://abc.com/testassertion","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"9b1d547e-db76-4521-9323-50f8dd1aeb0d"}}]},"parent":{"info":{"id":"c3a34a9d-a660-83a5-223a-54afb11ace02","name":"Test abc.com","schema":"https://schema.getpostman.com/json/collection/v2.0.0/collection.json"},"event":[],"variable":[],"item":[{"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","name":"Test Assertion","request":{"url":"http://abc.com/testassertion","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"9b1d547e-db76-4521-9323-50f8dd1aeb0d"}}]},{"id":"7f2741a4-afcd-4d74-9138-abad038f3699","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"93334e58-bbe1-487b-9ffd-6c35351d061c"}}]}]},"cursor":{"position":0,"iteration":0,"length":2,"cycles":1,"empty":false,"eof":false,"bof":true,"cr":false,"ref":"13db093e-b091-4583-a390-3f15c13663cc"}},{"error":{"type":"Error","name":"JSONError","message":"Unexpected token \'<\' at 1:1\\n<html>\\n^","checksum":"b7db65fd7db5667f384af70acdddcfb0","id":"44a6232b-75c9-4c1b-958b-7575c75cd8aa","timestamp":1503825021641,"stacktrace":[]},"at":"test-script","source":{"id":"7f2741a4-afcd-4d74-9138-abad038f3699","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"93334e58-bbe1-487b-9ffd-6c35351d061c"}}]},"parent":{"info":{"id":"c3a34a9d-a660-83a5-223a-54afb11ace02","name":"Test abc.com","schema":"https://schema.getpostman.com/json/collection/v2.0.0/collection.json"},"event":[],"variable":[],"item":[{"id":"52cd830e-d5aa-49d9-bda3-8686bc5e5799","name":"Test Assertion","request":{"url":"http://abc.com/testassertion","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["tests[\\"Status code is 200\\"] = responseCode.code !== 200;"],"_lastExecutionId":"9b1d547e-db76-4521-9323-50f8dd1aeb0d"}}]},{"id":"7f2741a4-afcd-4d74-9138-abad038f3699","name":"Test Script Failures","request":{"url":"http://abc.com","method":"GET","body":{},"description":{"content":"","type":"text/plain"}},"response":[],"event":[{"listen":"test","script":{"type":"text/javascript","exec":["var jsonData = JSON.parse(responseBody);","tests[\\"Your test name\\"] = jsonData.value === 100;"],"_lastExecutionId":"93334e58-bbe1-487b-9ffd-6c35351d061c"}}]}]},"cursor":{"ref":"c6d63d13-edba-4420-a546-a82d644e1602","length":2,"cycles":1,"position":1,"iteration":0}}],"error":null}}\n');

  const context = {
    console: console,
    summary: summary,
    redis: redisClient,
    request: request,
    date: date,
    sprintf: sprintf,
    vsprintf: vsprintf,
    handlerParams: handlerParams
  };
  try {
    const res = safeEval(code, context);
    ctx.response.body = await res;
  } catch (err) {
    ctx.response.status = 400;
    ctx.response.body = err.message;
  }
});

module.exports = router;
