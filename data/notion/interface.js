const prefix = 'https://api.notion.com/v1'
const headers = {
  'content-type': 'application/json',
  'notion-version': '2021-05-13'
}

const initToken = async (token) => {
  headers['Authorization'] = `Bearer ${token}`
}

const fetchJSON = async (uri, init) => {
  init = init || { method: 'GET' }
  init.headers = headers
  const response = await fetch(`${prefix}${uri}`, init)
  return await response.json()
}

const postJSON = async (uri, body) => {
  return await fetchJSON(uri, { method: 'POST', body: JSON.stringify(body) })
}

const search = async (query) => {
  return await postJSON('/search', query)
}

const findDatabase = async (title) => {
  const result = await search({query: title, filter: {property: 'object', value: 'database'}})
  return result.results.shift()
}

const queryDatabase = async (dbId, query) => {
  return await postJSON(`/databases/${dbId}/query`, query)
}

const createPage = async (body) => {
  return await postJSON('/pages', body)
}

const getPage = async (id) => {
  return await fetchJSON(`/pages/${id}`)
}

const patchPage = async (id, body) => {
  return await fetchJSON(`/pages/${id}`, { method: 'PATCH', body: JSON.stringify(body) })
}

export { fetchJSON, postJSON, search, initToken, findDatabase, queryDatabase, createPage, getPage, patchPage }