import jwt from '@tsndr/cloudflare-worker-jwt'
import DB from '../data/notion/notionDb'

const blockedEntities = ['user']

const e404 = () => new Response('Not found', { status: 404 })

const isPost = req => req.method === 'POST'
const buildPassword = u => sha256(`${u.email}${u.password}`)
const sha256 = str => crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(h => Array.from(new Uint8Array(h)).map(b => b.toString(16).padStart(2, '0')).join(''))

const ctx = { jwtSecret: '' }
const isExistsEmail = email => findOnBody('user', { email }).then(r => r.length > 0)
const verifyToken = token => jwt.verify(token, ctx.jwtSecret)
const hasValidToken = req => req.headers.get('authorization') && verifyToken(req.headers.get('authorization'))
const getUserObject = (req) => {
  const user = jwt.decode(req.headers.get('authorization')).payload
  delete user.iat
  return user
}
const findOnBody = (entity, contains, userid) => db.find({entity, contains: Object.keys(contains).map(k => ({key: 'body', value: `"${k}":"${contains[k]}"`})), owner: userid})

const db = new DB()
const baseController = {
  router: {
    '/open/regist': async (req) => {
      if (!isPost(req)) return e404()
      const body = JSON.parse(await req.text())
      if(await isExistsEmail(body.email)) return new Response('Already exists', { status: 400 })
      body.password = await buildPassword(body)
      return new Response(JSON.stringify(await db.upsert({entity: 'user', body: JSON.stringify(body)})))
    },
    '/open/login': async (req, env) => {
      if (!isPost(req)) return e404()
      const obj = JSON.parse(await req.text())
      obj.password = await buildPassword(obj)
      const result = await findOnBody('user', obj)
      if (result.length === 0) return new Response('Not found', { status: 404 })
      const token = await jwt.sign({ id: result[0].id, email: obj.email }, await env.kv.get('jwt_secret'))
      return new Response(JSON.stringify({token}))
    },
    '/upsert': async (req, env) => {
      if (!isPost(req)) return e404()
      const { entity, body, id } = JSON.parse(await req.text())
      if (blockedEntities.includes(entity)) return new Response('Unauthorized', { status: 401 })
      const user = getUserObject(req)
      if (id && (await db.get(id)).owner !== user.id) return new Response('Unauthorized', { status: 401 })
      return new Response(JSON.stringify(await db.upsert({entity, body, owner: user.id, id})))
    },
    '/find': async (req, env) => {
      if (!isPost(req)) return e404()
      const { entity, contains } = JSON.parse(await req.text())
      if (blockedEntities.includes(entity)) return new Response('Unauthorized', { status: 401 })
      const user = getUserObject(req)
      return new Response(JSON.stringify(await findOnBody(entity, contains, user.id)))
    },
    '/get': async (req, env) => {
      if (!isPost(req)) return e404()
      const { id } = JSON.parse(await req.text())
      const user = getUserObject(req)
      if ((await db.get(id)).owner !== user.id) return new Response('Unauthorized', { status: 401 })
      return new Response(JSON.stringify(await db.get(id)))
    },  
    '/delete': async (req, env) => {
      if (!isPost(req)) return e404()
      const { id } = JSON.parse(await req.text())
      const user = getUserObject(req)
      if ((await db.get(id)).owner !== user.id) return new Response('Unauthorized', { status: 401 })
      return new Response(JSON.stringify(await db.delete(id)))
    }    
  },
  install: async (env) => {
    await db.init({ kv: env.kv })
    ctx.jwtSecret = await env.kv.get('jwt_secret')
  }
}

const authorizeFilter = async (req, env, ctx, next) => {
  return ((new URL(req.url)).pathname.indexOf('/open/') < 0 && !await hasValidToken(req))
    ? new Response('Unauthorized', { status: 401 })
    : await next(req, env, ctx)
}

export { baseController, authorizeFilter, verifyToken }
