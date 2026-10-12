import service from '@/service/request'

// 定义接口返回类型规范（示例）
export interface UserInfo {
    id: number
    name: string
    email: string
}

// 获取用户信息的 API 封装
export function getUserInfoApi() {
    // 泛型规范返回的数据结构
    return service.get<any, UserInfo>('/user/info')
}