import Vue from 'vue';
import App from './app.vue';
import vuetify from './plugins/vuetify';
import 'roboto-fontface/css/roboto/roboto-fontface.css';
import '@mdi/font/css/materialdesignicons.css';
import router from './router';

Vue.config.productionTip = false;

const serverHostURL = new URL('/', window.location);
if (process.env.VUE_APP_SERVER_PORT) serverHostURL.port = process.env.VUE_APP_SERVER_PORT;

Vue.prototype.$app = {
  serverHost: serverHostURL.toString(),
};

new Vue({
  vuetify,
  router,
  render: (h) => h(App),
}).$mount('#app');
