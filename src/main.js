import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import router from "@/router";
import Buffer from "vue-buffer";
import utils from './utils';

const app = createApp(App);
router.beforeEach((to, from, next) => {
    console.log(to, from, next)
    next()
})
var Minio = require('minio')
var minioClient = new Minio.Client({
    endPoint: '192.168.15.135',
    port: 9000,
    useSSL: false,
    accessKey: 'NNK9SB8FLHRAG3CSVPVS',
    secretKey: 'ZbAv7s+YtKNEH60R+YQ+mwNzD4jsyb8FUNGYYjuM'
});
// 挂载在原型上
window.Buffer = require("vue-buffer");
app.config.globalProperties.$utils = utils;
app.config.globalProperties.$minioClient = minioClient;
app.use(Antd)
    .use(router)
    .mount('#app');