class db {
  constructor() {
    this.db = null
  }

  async init({ kv }) {}
  async find(query) {}
  async upsert(request) {}
  async remove(request) {}
}

export default db