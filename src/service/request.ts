import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios'
import { env } from "@/config/env";

// 1. 创建 axios 实例
const service = axios.create({
  baseURL: env.API_BASE_URL + '/api/v1',
  timeout: 10000, // 请求超时时间：10秒
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

// 2. 请求拦截器：在请求发送前做一些处理（比如加 Token）
service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 从 localStorage 或 Pinia 获取 Token
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器：对响应数据做统一处理
service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data

    // 如果后端有统一的 code 规范（例如非 200/20000 代表业务报错）可以在此拦截
    // 这里以标准 Restful 或常见格式为例：
    return res
  },
  (error: AxiosError) => {
    // 统一处理 HTTP 网络错误
    let message = '网络异常，请稍后重试'
    if (error.response) {
      const status = error.response.status
      switch (status) {
        case 401:
          message = '登录状态已过期，请重新登录'
          // 可以在这里清空 Token 并跳转到登录页
          break
        case 403:
          message = '拒绝访问 (403)'
          break
        case 404:
          message = '请求地址出错 (404)'
          break
        case 500:
          message = '服务器内部错误 (500)'
          break
        default:
          message = `连接错误 ${status}`
      }
    }
    console.error(message)
    // 实际开发中可以结合 Shadcn 的 Toast 组件进行弹窗报错
    return Promise.reject(error)
  }
)

export default service