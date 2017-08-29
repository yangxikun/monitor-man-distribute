<template>
  <div>
    <div class="row">
      <div class="col-12">
        <h4 style="text-align: center;">{{collection.name}}</h4>
        <p>{{collection.description}}</p>
        <table class="table">
          <tbody>
          <tr>
            <td>interval</td>
            <td>{{collection.interval}}ms</td>
          </tr>
          <tr>
            <td>reserved date</td>
            <td>{{collection.reserved}}day</td>
          </tr>
          <tr>
            <td>iterationCount</td>
            <td>{{collection.newmanOption.iterationCount}}</td>
          </tr>
          <tr>
            <td>timeoutRequest</td>
            <td>{{collection.newmanOption.timeoutRequest}}ms</td>
          </tr>
          <tr>
            <td>delayRequest</td>
            <td>{{collection.newmanOption.delayRequest}}ms</td>
          </tr>
          <tr>
            <td>ignoreRedirects</td>
            <td>{{collection.newmanOption.ignoreRedirects}}</td>
          </tr>
          <tr>
            <td>insecure</td>
            <td>{{collection.newmanOption.insecure}}</td>
          </tr>
          <tr>
            <td>bail</td>
            <td>{{collection.newmanOption.bail}}</td>
          </tr>
          <tr>
            <td>collection file</td>
            <td>
              <a :href="downloadLink('', 'collectionFile')">Download</a>
            </td>
          </tr>
          <tr v-for="(distribute, name) in collection.distributes">
            <td>{{name}}</td>
            <td>
              {{distribute.status}}
              <span v-show="distribute.eye" v-on:click="eyeSlash(name, true)" style="float: right;margin-right: 1.2rem;color: #888888;cursor:pointer;">
              <icon name="eye"></icon>
              </span>
              <span v-show="!distribute.eye" v-on:click="eyeSlash(name, false)" style="float: right;margin-right: 1.2rem;color: #888888;cursor:pointer;">
              <icon name="eye-slash"></icon>
              </span>
              <a v-if="collection.iterationData[name]" :href="downloadLink(name, 'iterationData')">Download iterationData</a>
              <a v-if="collection.environment[name]" :href="downloadLink(name, 'environment')">Download environment</a>
            </td>
          </tr>
          <tr>
            <td>
              start time:
              <input class="form-control" type="text" v-model="startTime" style="width: auto;display: inline-block;">
            </td>
            <td>
              end time:
              <input class="form-control" type="text" v-model="endTime" style="width: auto;display: inline-block;">
              <button type="button" class="btn btn-outline-primary" v-on:click="go()" style="float: right;cursor: pointer;">Go</button>
            </td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row" style="margin-bottom: 50px;">
      <div class="col-5" v-if="assertionsFailures">
        <table class="table">
          <thead>
            <tr>
              <th colspan="2" style="text-align: center">Assertions Failures</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(count, name) in assertionsFailures">
              <td>{{name}}</td>
              <td>{{count}}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="col-2"></div>
      <div class="col-5" v-if="testScriptsFailures">
        <table class="table">
          <thead>
          <tr>
            <th colspan="2" style="text-align: center">TestScripts Failures</th>
          </tr>
          </thead>
          <tbody>
          <tr v-for="(count, name) in testScriptsFailures">
            <td>{{name}}</td>
            <td>{{count}}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div class="row" v-show="!showLine">
      <h1 style="margin: auto;color: #9e9e9e;">Loading...</h1>
    </div>
    <show-chart v-show="showLine" :collectionId="collectionId" :summary="summary" :distribute="distribute" :key="distribute" v-for="(summary, distribute) in summaries"></show-chart>
  </div>
</template>

<script>
  import ShowChart from './ShowLineChart'

  export default {
    name: 'collectionShow',
    components: {
      ShowChart,
    },
    data() {
      // from: http://www.cnblogs.com/zhangpengshou/archive/2012/07/19/2599053.html
      Date.prototype.Format = function (fmt) { //author: meizz
        const o = {
          "M+": this.getMonth() + 1, //月份
          "d+": this.getDate(), //日
          "H+": this.getHours(), //小时
          "m+": this.getMinutes(), //分
          "s+": this.getSeconds(), //秒
          "q+": Math.floor((this.getMonth() + 3) / 3), //季度
          "S": this.getMilliseconds() //毫秒
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (let k in o)
          if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
      };
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 2*3600*1000);
      return {
        collectionId: this.$route.params.id,
        startTime: startTime.Format("yyyy-MM-dd HH:mm:ss"),
        endTime: endTime.Format("yyyy-MM-dd HH:mm:ss"),
        collection: {newmanOption: {}, distributes: {}},
        summaries: {},
        eyeSlashSummaries: {},
        assertionsFailures: null,
        testScriptsFailures: null,
        showLine: false,
        distributes: [],
        errModal: {
          show: false
        },
      }
    },
    mounted() {
      const collectionId = this.$route.params.id;
      this.$http.get('/collection/'+collectionId)
        .then(resp => {
          this.eye(resp.data);
          this.collection = resp.data;
          this.go();
        }).catch(error => {
          this.$bus.$emit('error', 'http request: '+'/collection/'+collectionId, error.message);
        });
    },
    methods: {
      eye(collection) {
        for (let name in collection.distributes) {
          collection.distributes[name]['eye'] = true;
          this.distributes.push(name);
        }
      },
      eyeSlash(name, val) {
        this.collection.distributes[name].eye = !val;
        let change = false;
        if (val) {
          const index = this.distributes.indexOf(name);
          if (index > -1) {
            this.distributes.splice(index, 1);
          }
          if (this.summaries[name]) {
            this.eyeSlashSummaries[name] = this.summaries[name];
            delete this.summaries[name];
            change = true;
          }
        } else if (this.eyeSlashSummaries[name]) {
          this.summaries[name] = this.eyeSlashSummaries[name];
          this.distributes.push(name);
          change = true;
        }
        if (change) {
          this.update(this.summaries, false);
        } else {
          this.$nextTick();
        }
      },
      go() {
        const s = (new Date(this.startTime)).getTime();
        if (isNaN(s)) {
          this.$bus.$emit('error', 'time picker', 'invalid startTime: ' + this.startTime);
          return;
        }
        const e = (new Date(this.endTime)).getTime();
        if (isNaN(e)) {
          this.$bus.$emit('error', 'time picker', 'invalid endTime: ' + this.endTime);
          return;
        }
        const collectionId = this.$route.params.id;
        const uri = '/collection/'+collectionId+'/summaries?s='+s+'&e='+e+'&distributes='+this.distributes.join(",");
        this.$http.get(uri)
          .then(resp => {
            this.update(resp.data, true);
          }).catch(error => {
            this.$bus.$emit('error', 'http request: '+uri, error.message);
          });
      },
      update(summaries, jsonParse) {
        let assertionsFailures = {};
        let testScriptsFailures = {};
        for (let distribute in summaries) {
          for (let index in summaries[distribute]) {
            if (jsonParse) {
              summaries[distribute][index] = JSON.parse(summaries[distribute][index]);
            }
            let failures = summaries[distribute][index].assertions.failures;
            for (let id in failures) {
              const key = distribute+'-'+failures[id];
              if (assertionsFailures[key]) {
                assertionsFailures[key]++;
              } else {
                assertionsFailures[key] = 1;
              }
            }
            failures = summaries[distribute][index].testScripts.failures;
            for (let id in failures) {
              const key = distribute+'-'+failures[id];
              if (testScriptsFailures[key]) {
                testScriptsFailures[key]++;
              } else {
                testScriptsFailures[key] = 1;
              }
            }
          }
        }
        if (Object.keys(assertionsFailures).length > 0) {
          this.assertionsFailures = assertionsFailures;
        } else {
          this.assertionsFailures = null;
        }
        if (Object.keys(testScriptsFailures).length > 0) {
          this.testScriptsFailures = testScriptsFailures;
        } else {
          this.testScriptsFailures = null;
        }

        this.summaries = summaries;
        this.showLine = true;
      },
      downloadLink(distribute, type) {
        return "/collection/" + this.collectionId + "/download/" + type + "?distribute=" + distribute;
      },
    }
  }
</script>
