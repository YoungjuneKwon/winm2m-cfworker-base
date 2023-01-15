class KV {
  constructor (dict) {
    this.dict = dict
  }

  get = async k => this.dict[k]
}

export { KV }