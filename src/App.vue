<template>
  <html id="app">
    <head>
      <meta charset="utf-8">
      <title>monitor man</title>
    </head>
    <body>
    <nav class="navbar navbar-toggleable-md navbar-inverse bg-inverse">
      <button class="navbar-toggler navbar-toggler-right" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <router-link class="navbar-brand" to="/">monitor-man</router-link>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item" v-bind:class="{ active: nav == 'collection'}">
            <router-link class="nav-link" to="/collection/create">Collection</router-link>
          </li>
          <li class="nav-item" v-bind:class="{ active: nav == 'handler'}">
            <router-link class="nav-link" to="/handler">Handler</router-link>
          </li>
        </ul>
        <form class="form-inline my-2 my-lg-0" v-if="nav == 'home'">
          <label>Tag</label>
          <select v-model="tag">
            <option value=""></option>
            <option :value="tag" v-for="tag in tags">{{tag}}</option>
          </select>
        </form>
      </div>
    </nav>
      <div class="container-fluid">
        <div class="row">
          <div class="col-2"></div>
          <div class="col-8">
            <router-view></router-view>
          </div>
          <div class="col-2"></div>
        </div>
      </div>
    </body>
  </html>
</template>

<script>
  import Bus from './Bus'
  export default {
    name: 'app',
    data() {
      return {
        tags: [],
        tag: this.$cookie.get('tag'),
        nav: 'home'
      }
    },
    created() {
      this.$http.get('/tag')
        .then(resp => {
          this.tags = resp.data;
        }).catch(error => {
        console.log(error);
      });
    },
    watch: {
      tag(val) {
        if (val !== undefined) {
          Bus.$emit('tag', val);
        }
      },
      '$route': 'activateNav'
    },
    methods: {
      activateNav() {
        this.$http.get('/tag')
          .then(resp => {
            this.tags = resp.data;
          }).catch(error => {
          console.log(error);
        });
        if (this.$route.name === 'Home') {
          this.nav = 'home';
        } else if (this.$route.name.indexOf('Collection') === 0) {
          this.nav = 'collection';
        } else if (this.$route.name.indexOf('Handler') === 0) {
          this.nav = 'handler';
        }
      }
    }
  }
</script>

<style lang="stylus" scoped>
  nav
    margin-bottom: 20px

  form
    label
      color: #ffffff
      margin-right: 10px
    select
      background-color: #ffffff
      padding: 0.25rem
      border-radius: 0.2rem
      min-width: 100px
</style>
