import axios from "axios";
import { notification } from 'ant-design-vue'
let baseAxios = axios.create({
  timeout: 3000000,
  headers: {
    'Cache-Control': 'no-cache'
  }
})

// 请求的拦截处理,用于处理需要在请求前的操作
baseAxios.interceptors.request.use(
  config => {
    axios.defaults.headers['Cache-Control'] = 'no-cache'

    config.headers['token'] = localStorage.getItem('token') || 'mcr:user04'

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应的拦截处理,用于处理需要在请求返回后的操作
baseAxios.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    
    if (response.data.code == 200) {
      return Promise.resolve(response.data)
    } else {
      notification['error']({ message: '请求失败', description: response.data.message })
    }

  },
  error => {
    console.log(error);
    // 对响应错误做点什么
    if (error.response) {
      switch (error.response.status) {
        case 404:
          notification['error']({ message: '请求失败', description: '请求接口不存在' })
          break
        case 400:
          notification['error']({ message: '请求失败' })
          break

        case 500:
          notification['error']({ message: '请求失败', description: '内部服务器出错' })
          break
      }
    } else {
      // 断网 或者 请求超时 状态
      if (error.message.includes('timeout')) {
        notification['error']({ message: '请求超时', description: '请检查网络是否连接正常' })
      } else {
        notification['error']({ message: '请求失败', description: '请检查网络是否已连接' })
      }
    }
    return { code: -100 }
  }
)

export function axiosService(url, data, method = 'GET', type, cancelToken = '') {
  let queryData = { url: url, method: method }
  switch (method) {
    case 'GET':
      if (data) {
        Object.keys(data).forEach(key => {
          if (data[key] === '') {
            data[key] = undefined
          }
        })
      }
      queryData.params = data

      // 导出/导入>>使用GET方式
      if (type === 'EXPORT' || type === 'DownTemplate') {
        queryData.responseType = 'blob'
      }

      break

    case 'POST':
    case 'PUT':
    case 'DELETE':
      queryData.data = data

      // 导出>>使用POST或PUT方式
      if (type === 'EXPORT' || type === 'DownTemplate') {
        queryData.responseType = 'blob'
        // axios的取消函数
        if (cancelToken) {
          queryData.cancelToken = cancelToken
        }
      }

      break
  }

  return baseAxios(queryData)
}