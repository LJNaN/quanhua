import axios from 'axios'
import { showMessage } from './status' // 引入状态码文件
import { ElMessage } from 'element-plus' // 引入el 提示框，这个项目里用什么组件库这里引什么

// 设置接口超时时间
const env = import.meta.env
axios.defaults.timeout = 60000
axios.defaults.baseURL = ''
const BASE_URL = env.DEV ? 'http://192.168.0.103:5173/api' : window.location.protocol == 'https:' ? 'https://www.kantu3d.com/gxq' : 'http://219.153.117.212:92'

//http request 拦截器
axios.interceptors.request.use(
  (config) => {
    // 配置请求头
    config.headers = {
      //'Content-Type':'application/x-www-form-urlencoded',   // 传参方式表单
      'Content-Type': 'application/json;charset=UTF-8' // 传参方式json
      //   'token':'80c483d59ca86ad0393cf8a98416e2a1'              // 这里自定义配置，这里传的是token
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

//http response 拦截器
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error
    if (response) {
      // 请求已发出，但是不在2xx的范围
      showMessage(response.status) // 传入响应码，匹配响应码对应信息
      return Promise.reject(response.data)
    } else {
      ElMessage.warning('网络连接异常,请稍后再试!')
    }
  }
)

// 封装 GET POST 请求并导出
export function request(url = '', params = {}, type = 'POST') {
  //设置 url params type 的默认值
  return new Promise((resolve, reject) => {
    let promise
    if (type.toUpperCase() === 'GET') {
      promise = axios({
        baseURL: BASE_URL,
        url,
        params
      })
    } else if (type.toUpperCase() === 'POST') {
      promise = axios({
        method: 'POST',
        baseURL: BASE_URL,
        url,
        data: params
      })
    }
    //处理返回
    promise
      .then((res) => {
        resolve(res)
      })
      .catch((err) => {
        reject(err)
      })
  })
}
