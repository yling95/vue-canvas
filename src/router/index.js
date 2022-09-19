import { createRouter, createWebHistory } from 'vue-router'
// 自动加载 global 目录下的 .vue 结尾的文件

const routerList = []
// 引入路由
function importAll(r) {
    r.keys().forEach(
        key => r(key).default ? routerList.push( ...r(key).default) : ''
    );
}

// require.context是webpack的API，动态引入文件
// 参数1.路径2.是否匹配子集3.规则(此规则需以.router.js结尾)
importAll(require.context('./', true, /\.js$/))
const routes = [
    {path: '/login',name:'login',component: () => import('@/view/login/login')},
    {
        path: '/',
        name: 'Layout',
        redirect:'/manager'
    }
    // {
    //     path: '/',
    //     name: 'Layout',
    //     component: () => import('@/view/layout/layout'),
    //     children:[

    //     ]
    // }
]
// routes[1].children.push(...routerList)
routes.push(...routerList)
const router = createRouter({

    history: createWebHistory(process.env.BASE_URL),

    routes //上面的路由数组

})
export default router