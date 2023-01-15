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
  return JSON.parse(await res.text())
}

describe("Base controller", () => {
  let user, sampleContent, res, token

  beforeAll(async () => {
    await baseController.install({ kv })
  })

  afterAll(async () => {
    await post('/delete', { id: sampleContent.id }, token)
    await post('/delete', { id: user.id }, token, true)
  })

  it("regist", async () => {
    user = await post('/open/regist', config.sampleUser)
    expect(user.id).toBeTruthy()
  })

  it("login", async () => {
    res = await post('/open/login', config.sampleUser)
    token = res.token
    expect(token).toBeTruthy()  
  })

  it("upsert", async () => {
    sampleContent = await post('/upsert', { entity: 'sample', body: JSON.stringify({ hello: 'world'}) }, token)
    expect(sampleContent.id).toBeTruthy()
    res = await post('/upsert', { entity: 'sample', body: JSON.stringify({ hello: 'world2'}), id: sampleContent.id }, token)
    expect(res.body.hello).toBe('world2')
  })

  it("get, find", async () => {
    res = await post('/get', { id: sampleContent.id }, token)
    expect(res.body.hello).toBe('world2')
    res = await post('/find', { entity: res.entity, contains: {hello: 'world2'}}, token)
    expect(res.length).toBe(1)
  })

  it("Invalid methods", async () => {
    for (const p in router) {
      const res = await getReq(p)
      expect(res.status).toBe(404)
    }
  })
  
  it("Duplicated user regist", async () => {
    res = await postRaw('/open/regist', config.sampleUser)
    expect(res.status).toBe(400)
  })

  it("Invalid login", async () => {
    res = await postRaw('/open/login', { email: config.sampleUser.email, password: 'invalid' })
    expect(res.status).toBe(404)
  })

  it("Try to request on blocked entity", async () => {
    for (const p of ['upsert', 'get', 'find']) {
      res = await postRaw(`/${p}`, { entity: 'user'}, token)
      expect(res.status).toBe(401)
    }
  })
})

