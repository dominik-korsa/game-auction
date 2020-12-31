import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '@/views/home.vue';
import Join from '@/views/join.vue';
import Auction from '@/views/auction.vue';
import Create from '@/views/create.vue';

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
    name: 'Create',
    component: Create,
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
