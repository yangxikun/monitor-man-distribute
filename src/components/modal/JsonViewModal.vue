<template>
  <div v-show="show">
    <div class="modal fade show" tabindex="-1" role="dialog" style="display: block;">
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">{{title}}</h5>
            <button type="button" class="close" v-on:click="close()">
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div class="modal-body">
            <div>
              <select v-model="failureSelected" style="height: 2.2rem">
                <option :value="id" v-for="(name, id, index) in failures">{{name}}</option>
              </select>
            </div>
            <div class="json-view" v-show="failureData">
              <tree-view :data="failureData" :options="{maxDepth: 3}"></tree-view>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-backdrop fade show"></div>
  </div>
</template>

<script>
  export default {
    props: {
      title: String,
      failures: Object,
      show: Boolean,
      collectionInfo: Object
    },
    data() {
      return {
        failureSelected: null,
        failureData: null
      };
    },
    watch: {
      failures(val) {
        this.failureSelected = Object.keys(val)[0];
      },
      failureSelected(id) {
        console.log(this.collectionInfo)
        this.$http.get('/collection/'+this.collectionInfo.id+'/'+this.collectionInfo.distribute+'/failure/' + id).then(resp => {
          this.failureData = resp.data;
        }).catch(error => {
          console.log(error);
        });
      }
    },
    methods: {
      close() {
        this.$emit('close');
      }
    }
  }
</script>

<style lang="stylus" scoped>
  select
    background-color: #fff
    padding: 0.25rem
    border-radius: 0.2rem
  .modal-dialog
    max-width: 50%
    max-height: 50%
  .json-view
    overflow-y: scroll
    max-height: 80vh
    margin: 20px 10px
</style>

<style lang="stylus">
  .tree-view-item-value-string
    white-space: normal
</style>
