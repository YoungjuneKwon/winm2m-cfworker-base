# @winm2m/cf-worker-base

## Description

A library for creating basic CRUD endpoints for Cloudflare Workers. It use a notion page as database.

## Usage

### 0. Preparation
 - Create an API Token of Notion
 - Create a new Database in Notion
 - Create a new Service in Cloudflare Workers
 - Create a new KV Namespace
 - Below keys are required in KV Namespace
   - `jwt_secret` : JWT secret key
   - `notion_token` : Notion API token
   - `notion_db_title` : Title of Notion Database
 - [Install wrangler](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

### 1. Init wrangler project and install @winm2m/cf-worker-base
```bash
$ wrangler init
$ npm install --save @winm2m/cf-worker-base
```

### 2. Add kv namespace to wrangler.toml
```toml title=wrangler.toml
kv-namespaces = [
  { binding = "KV", id = "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" }
]
```

### 3. Update index.js

```js title=index.js
import { requestHandler } from '@winm2m/cfworker-base'

const handler = new requestHandler(`/api`)

export default {
  fetch: (request, env, ctx) => handler.handleRequest(request, env, ctx)
}
```

### Appendix - command to test largedata

```bash
$ npx -p @babel/core -p @babel/node babel-node --presets @babel/preset-env test/test_largedata.js create-largedata create-largedata
```