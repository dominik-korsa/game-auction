import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/home.vue';
import Join from '@/views/join.vue';
import Auction from '@/views/auction.vue';
import Create from '@/views/create.vue';
import CreateList from '@/views/create-types/list.vue';
import CreateBritish from '@/views/create-types/british.vue';
import CreateDutch from '@/views/create-types/dutch.vue';
import CreateSealedBid from '@/views/create-types/sealed-bid.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/j/:code',
    name: 'Join',
    component: Join,
  },
  {
    path: '/auction',
    name: 'Auction',
    component: Auction,
  },
  {
    path: '/create',
    component: Create,
    children: [
      {
        path: '/',
        name: 'CreateList',
        component: CreateList,
      },
      {
        path: 'british',
        name: 'CreateBritish',
        component: CreateBritish,
      },
      {
        path: 'dutch',
        name: 'CreateDutch',
        component: CreateDutch,
      },
      {
        path: 'sealed-bid',
        name: 'CreateSealedBid',
        component: CreateSealedBid,
      },
    ],
  },
  {
    path: '*',
    redirect: '/',
  },
];

const router = new VueRouter({
  mode: 'history',
  routes,
});

export default router;
