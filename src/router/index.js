import Vue from 'vue'
import Router from 'vue-router'
import Hello from '@/components/Hello'
import Home from '@/components/Home'

import CollectionCreate from '@/components/collection/Create'
import CollectionUpdate from '@/components/collection/Update'
import CollectionShow from '@/components/collection/Show'
import Collection from '@/components/collection/Collection'

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/hello',
      name: 'Hello',
      component: Hello
    },
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/collection/create',
      name: 'Collection',
      component: CollectionCreate
    },
    {
      path: '/collection/:id',
      component: Collection,
      children: [
        {
          path: '',
          name: 'CollectionShow',
          component: CollectionShow
        },
        {
          path: 'update',
          name: 'CollectionUpdate',
          component: CollectionUpdate
        }
      ]
    }
  ]
})
