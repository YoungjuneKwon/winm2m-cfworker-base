import { addCorsHeaders } from './cors'
import { baseController, authorizeFilter, verifyToken } from './base'

const e404 = () => new Response('Not found', { status: 404 })
const installModules = async (controller, env, ctx, modules) => {
  const appendPrefixForAllKeys = (prefix, o) => Object.keys(o).reduce((a, k) => { a[`${prefix}${k}`] = o[k]; return a }, {})
  for (const k in modules) {
    controller.router = { ...controller.router, ...appendPrefixForAllKeys(`/${k}`, modules[k].router) }
    await (modules[k].install || (() => {}))(env, ctx)
  }
}

class requestHandler {
  constructor (prefix, modules) {
    this.prefix = prefix
    this.modules = modules
  }

  stripPrefix = p => p === '/' ? p : p.replace(this.prefix, '')

  async handleRequest (request, env, ctx) {
    if (request.method === 'OPTIONS') return addCorsHeaders(new Response())
    const controller = { router: { '/': async () => new Response('{}') } }
    await installModules(controller, env, ctx, { base: baseController, ...this.modules})
    const { pathname } = new URL(request.url)
    try {
      const response = await authorizeFilter(request, env, ctx, controller.router[this.stripPrefix(pathname)] || e404)
      return addCorsHeaders(response)
    } catch (e) {
      return addCorsHeaders(new Response(e.message, { status: 500 }))
    }
  }
}

export { requestHandler, verifyToken }