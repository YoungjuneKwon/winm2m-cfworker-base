import db from '../db'
import { initToken, findDatabase, queryDatabase, createPage, getPage, patchPage } from './interface'

const notionDataConverter = r => ({
  id: r.id,
  createdAt: r.created_time,
  updatedAt: r.last_edited_time,
  entity: r.properties.entity.title[0].plain_text,
  body: JSON.parse(r.properties.body.rich_text[0].plain_text),
  owner: (r.properties.owner.relation[0] || {}).id
})

class notionDb extends db {
  constructor() {
    super()
    this.db = null
  }

  async init({ kv }) {
    initToken(await kv.get('notion_token'))
    this.db = await findDatabase(await kv.get('notion_db_title'))
  }

  async find({entity, contains, owner, offset, size, sort}) {
    const query = { filter: { and: [{property: 'entity', title: { contains: entity}}] } }
    if (contains) Object.keys(contains).forEach(k => { query.filter.and.push({property: 'body', rich_text: { contains: `"${k}":"${contains[k]}"`}}) })
    owner && query.filter.and.push({property: 'owner', relation: { contains: owner}})
    if (size) query.page_size = size
    if (offset) query.start_cursor = offset
    if (sort) query.sort = { timestamp: 'last_edited_time', direction: (sort.direction || 'asc') === 'asc' ? 'ascending' : 'descending'}
    const result = await queryDatabase(this.db.id, query)
    return {
      list: result.results.map(notionDataConverter),
      offset: result.next_cursor
    }
  }

  async upsert({entity, body, owner, id}) {
    const result = await (id
      ? patchPage(id, {properties: { body: { rich_text: [{ text: { content: body } }] } }})
      : createPage({
        parent: { database_id: this.db.id },
        properties: {
          entity: { title: [ {text: {content: entity}}]},
          body: { rich_text: [ {text: {content: body}}]},
          owner: owner ? { relation: [ {id: owner}]} : { relation: [] }
        }
      }))
    return notionDataConverter(result)
  }

  async get(id) {
    const result = await getPage(id)
    return notionDataConverter(result)
  }

  async delete(id) {
    return await patchPage(id, { archived: true })
  }
}

export default notionDb
