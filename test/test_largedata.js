import { baseController } from '../base'
import { KV } from './worker/dummy'
import config from './test.config'

const router = baseController.router
const kv = new KV(config.kv)
const getPostRequest = (body, token) => {
  let headers

  if (token) {
    headers = new Headers()
    headers.set('authorization', token)
  }

  return new Request('http://dummy', {
    method: 'POST', body: JSON.stringify(body), headers
  })
}

const getReq = async (uri) => await router[uri](new Request('http://dummy'), { kv })
const postRaw = async (uri, body, token, force) => {
  return await router[uri](getPostRequest(body, token), { kv }, force)
}

const post = async (uri, body, token, force) => {
  const res = await postRaw(uri, body, token, force)
  try {
    return JSON.parse(await res.text())
  } catch {
    return {}
  }
}

const beforeAll = async () => {
  await baseController.install({ kv })
}

let token, res

const login = async () => {
  res = await post('/open/login', config.sampleUser)
  token = res.token  
}

const commandMap = {
  'create-largedata': async () => {
    await beforeAll()
    const largeSize = 250
    await post('/open/regist', config.sampleUser)
    await login()
    for (let i = 0; i < largeSize; i++) {
      await post('/upsert', { entity: 'large-data', body: JSON.stringify({ type: 'large-sata', mod10: (i % 10), idx: i}) }, token)
    }
  },
  'test-largedata': async () => {
    await beforeAll()
    await login()
    res = await post('/find', { entity: 'large-data', size: 3 }, token)
    console.log(res.list.length)
  },
  'clear-largedata': async () => {
    await beforeAll()
  }
}

const command = process.argv.slice(2)[0]
commandMap[command]()
