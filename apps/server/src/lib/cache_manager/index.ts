import FileAdapter from './adapters/file_adapter'

export default class CacheManager {
  private adapter

  constructor(adapter = new FileAdapter()) {
    this.adapter = adapter
  }

  public find(key: string, ttl?: number) {
    return this.adapter.get(key, ttl)
  }

  public set(key: string, value: string | Blob) {
    this.adapter.set(key, value)
  }
}
