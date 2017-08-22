<template>
  <div>
    <div class="card" v-for="item in items">
      <h5 class="card-header" style="color: #308ede;">
        <router-link :to="{ name: 'CollectionShow', params: {id: item.id, item: item} }">
          {{item.name}}
        </router-link>
        <span class="badge badge-default" style="margin: 0 5px;" v-for="tag in item.tag">{{tag}}</span>
        <span v-on:click="showConfirm('Delete collection', 'delete '+item.name, item.id, remove)" class="click" style="float: right;margin-left: 10px;">
        <icon name="remove"></icon>
        </span>
        <router-link :to="{ name: 'CollectionUpdate', params: {id: item.id, item: item} }" style="float: right;">
          <icon name="edit"></icon>
        </router-link>
      </h5>
      <div class="card-block">
        <p class="card-text" v-if="item.description">{{item.description}}</p>
        <table class="table">
          <tbody>
            <tr :class="{ 'distribute-warn': info.summary && (info.summary.assertions.failed > 0 || info.summary.testScripts.failed > 0) }" v-for="(info, distribute) in item.distributes">
              <td>
                <button class="btn btn-default btn-sm">
                  {{distribute}}
                </button>
              </td>
              <td v-if="info.status == 'running' && info.summary">
                <button class="btn btn-success btn-sm click" v-on:click="showConfirm('Change collection status', 'stop '+item.name+' '+distribute, {id: item.id, distribute: distribute, status: 'stop'}, setStatus)">
                  running
                </button>
              </td>
              <td v-if="info.status == 'running' && !info.summary">
                <button class="btn btn-warning btn-sm click" v-on:click="showConfirm('Change collection status', 'stop '+item.name+' '+distribute, {id: item.id, distribute: distribute, status: 'stop'}, setStatus)">
                  running
                </button>
              </td>
              <td v-if="info.status == 'stop'">
                <button class="btn btn-danger btn-sm click" v-on:click="showConfirm('Change collection status', 'start '+item.name+' '+distribute, {id: item.id, distribute: distribute, status: 'running'}, setStatus)">
                  stop
                </button>
              </td>
              <td>
                <button class="btn btn-primary btn-sm" disabled="disabled" v-if="info.summary">
                  Cost <span class="badge my-badge-primary badge-pill">{{info.summary.cost}}ms</span>
                </button>
              </td>
              <td>
                <button class="btn btn-default btn-sm" disabled="disabled" v-if="info.summary">
                  {{info.summary.started}} - {{info.summary.completed}}
                </button>
              </td>
              <td>
                <button class="btn btn-success btn-sm" disabled="disabled" v-if="info.summary">
                  Assertions Success <span class="badge my-badge-success badge-pill">{{info.summary.assertions.success}}</span>
                </button>
              </td>
              <td>
                <button class="btn btn-danger btn-sm" disabled="disabled" v-if="info.summary && info.summary.assertions.failed == 0">
                  Assertions failure <span class="badge my-badge-danger badge-pill">{{info.summary.assertions.failed}}</span>
                </button>
                <button class="btn btn-danger btn-sm click" v-on:click="showFailures(item.id, distribute, info.summary.assertions.failures, 'Assertions Failures')" v-else-if="info.summary">
                  Assertions failure <span class="badge my-badge-danger badge-pill">{{info.summary.assertions.failed}}</span>
                </button>
              </td>
              <td>
                <button class="btn btn-success btn-sm" disabled="disabled" v-if="info.summary">
                  TestScripts Success <span class="badge my-badge-success badge-pill">{{info.summary.testScripts.success}}</span>
                </button>
              </td>
              <td>
                <button class="btn btn-danger btn-sm" disabled="disabled" v-if="info.summary && info.summary.testScripts.failed == 0">
                  TestScripts failure <span class="badge my-badge-danger badge-pill">{{info.summary.testScripts.failed}}</span>
                </button>
                <button class="btn btn-danger btn-sm click" v-on:click="showFailures(item.id, distribute, info.summary.testScripts.failures, 'TestScripts Failures')" v-else-if="info.summary">
                  TestScripts failure <span class="badge my-badge-danger badge-pill">{{info.summary.testScripts.failed}}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <modal :collectionInfo="modal.collectionInfo" :title="modal.title" :show="modal.show" :failures="modal.failures" v-on:close="modal.show = false"></modal>
    <confirm-modal :title="confirmModal.title" :show="confirmModal.show" :message="confirmModal.message" v-on:close="confirmModal.show = false" v-on:confirm="confirmModal.callback(confirmModal)"></confirm-modal>
  </div>
</template>

<script>
  import Bus from '../Bus'
  import Modal from './Modal/JsonViewModal'
  import ConfirmModal from './Modal/ConfirmModal'
  export default {
    name: 'home',
    components: {
      Modal,
      ConfirmModal
    },
    data () {
      return {
        items: [],
        modal: {
          show: false
        },
        confirmModal: {
          show: false,
          data: null
        }
      }
    },
    created() {
      let tag = this.$cookie.get('tag');
      if (!tag) {
        tag = '';
      }
      this.fetchData(tag);
      Bus.$on('tag', tag => {
        this.$cookie.set('tag', tag, 30);
        this.fetchData(tag);
      });
    },
    methods: {
      fetchData(tag) {
        let uri = '/collection';
        if (tag !== '') {
          uri += '/tag/' + tag;
        }
        this.$http.get(uri).then(resp => {
          this.items = resp.data;
        }).catch(error => {
          console.log(error);
        });
      },
      showFailures(id, distribute, failures, title) {
        this.modal.failures = failures;
        this.modal.show = true;
        this.modal.title = title;
        this.modal.collectionInfo = {
          id: id,
          distribute: distribute
        };
      },
      showConfirm(title, message, data, callback) {
        this.confirmModal = {
          title: title,
          message: message,
          show: true,
          data: data,
          callback: callback
        };
      },
      remove(confirmModal) {
        confirmModal.show = false;
        this.$http.delete('/collection/'+confirmModal.data)
          .then(resp => {
            this.fetchData('');
          }).catch(error => {
            console.log(error);
          });
      },
      setStatus(confirmModal) {
        confirmModal.show = false;
        const data = confirmModal.data;
        this.$http.post('/collection/'+data.id+'/'+data.distribute+'/'+data.status)
          .then(resp => {
            this.fetchData('');
          }).catch(error => {
            console.log(error);
          });
      }
    }
  }
</script>

<style lang="stylus" scoped>
  a
    text-decoration: none
  .card
    margin-bottom: 20px
  .my-badge-primary
    color: #337ab7
    background-color: #fff
  .my-badge-success
    color: #5cb85c
    background-color: #fff
  .my-badge-danger
    color: #d9534f
    background-color: #fff
  .btn-sm
    font-size: 0.78rem
  .btn-default
    color: #333
    background-color: #fff
    border-color: #ccc
  .click
    cursor: pointer
  .distribute-warn
    background-color: #ffd0d0
</style>
