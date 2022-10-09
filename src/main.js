import { createApp } from 'vue'
import App from './App.vue'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';
import * as Icons from '@ant-design/icons-vue';
import router from "@/router";
import Buffer from "vue-buffer";
import utils from './utils';
import { message } from 'ant-design-vue';
const stream = require('stream')
const Minio = require('minio')

import UUID from "vue-uuid";


const app = createApp(App);
router.beforeEach((to, from, next) => {
    console.log(to, from, next)
    next()
})

// 全局挂载baseService
import { axiosService } from './api/request'
app.config.globalProperties.$axios = axiosService
app.config.globalProperties.$message = axiosService
app.config.globalProperties.$Minio = Minio
app.config.globalProperties.$stream = stream
app.config.globalProperties.$uuid = UUID

// 挂载在原型上
window.Buffer = require("vue-buffer");
app.config.globalProperties.$utils = utils;

// 全局使用图标
const icons = Icons;
for (const i in icons) {
    app.component(i, icons[i]);
}
app.use(Antd)
    .use(router)
    .use(UUID)
    .mount('#app');