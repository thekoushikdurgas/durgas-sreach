import MiniSearch from 'minisearch';

class Index {
  name: string;
  fields: Set<string>;
  docs: Map<string, any>;
  searcher: MiniSearch;

  constructor(name: string) {
    this.name = name;
    this.fields = new Set(['id']);
    this.docs = new Map();
    this.searcher = new MiniSearch({ fields: ['id'], idField: 'id' });
  }

  add(id: string, doc: any) {
    const docWithId = { ...doc, id };
    let fieldsChanged = false;
    for (const key of Object.keys(docWithId)) {
      if (!this.fields.has(key) && typeof docWithId[key] === 'string') {
        this.fields.add(key);
        fieldsChanged = true;
      }
    }
    
    if (fieldsChanged) {
      this.docs.set(id, docWithId);
      this.rebuildIndex();
    } else {
      const isExisting = this.docs.has(id);
      this.docs.set(id, docWithId);
      if (isExisting) {
        this.searcher.replace(docWithId);
      } else {
        this.searcher.add(docWithId);
      }
    }
    return docWithId;
  }

  get(id: string) {
    return this.docs.get(id);
  }

  delete(id: string) {
    if (this.docs.has(id)) {
      this.searcher.discard(id);
      this.docs.delete(id);
      return true;
    }
    return false;
  }

  rebuildIndex() {
    this.searcher = new MiniSearch({
      fields: Array.from(this.fields),
      idField: 'id',
      processTerm: (term: string) => term.toLowerCase()
    });
    this.searcher.addAll(Array.from(this.docs.values()));
  }

  search(query: string) {
    const results = this.searcher.search(query, { prefix: true, fuzzy: 0.2 });
    return results.map((r: any) => ({
      _index: this.name,
      _id: r.id,
      _score: r.score,
      _source: this.docs.get(r.id)
    }));
  }

  stats() {
    return {
      doc_count: this.docs.size,
      fields: Array.from(this.fields)
    };
  }
}

class Engine {
  indices: Map<string, Index>;
  repositories: Map<string, any>;
  snapshots: Map<string, any>;

  constructor() {
    this.indices = new Map();
    this.repositories = new Map();
    this.snapshots = new Map();
  }

  putRepository(name: string, config: any) {
    this.repositories.set(name, config);
    return true;
  }

  getRepository(name: string) {
    return this.repositories.get(name);
  }

  deleteRepository(name: string) {
    return this.repositories.delete(name);
  }

  createSnapshot(repoName: string, snapshotName: string, config: any) {
    if (!this.repositories.has(repoName)) {
      throw new Error(`repository [${repoName}] missing`);
    }
    const snapshotDate = new Date();
    const snapshotInfo = {
      snapshot: snapshotName,
      uuid: `${snapshotName}-${Date.now()}`,
      version_id: 1000000,
      version: "1.0.0",
      indices: Array.from(this.indices.keys()),
      data_streams: [],
      include_global_state: true,
      state: "SUCCESS",
      start_time: snapshotDate.toISOString(),
      start_time_in_millis: snapshotDate.getTime(),
      end_time: new Date(snapshotDate.getTime() + 1000).toISOString(),
      end_time_in_millis: snapshotDate.getTime() + 1000,
      duration_in_millis: 1000,
      failures: [],
      shards: {
        total: this.indices.size,
        failed: 0,
        successful: this.indices.size
      },
      ...config
    };
    this.snapshots.set(`${repoName}:${snapshotName}`, snapshotInfo);
    return snapshotInfo;
  }

  getSnapshot(repoName: string, snapshotName: string) {
    return this.snapshots.get(`${repoName}:${snapshotName}`);
  }

  getAllSnapshots(repoName: string) {
    const snaps = [];
    for (const [key, val] of this.snapshots.entries()) {
      if (key.startsWith(`${repoName}:`)) snaps.push(val);
    }
    return snaps;
  }

  deleteSnapshot(repoName: string, snapshotName: string) {
    return this.snapshots.delete(`${repoName}:${snapshotName}`);
  }

  getIndex(name: string): Index {
    if (!this.indices.has(name)) {
      this.indices.set(name, new Index(name));
    }
    return this.indices.get(name)!;
  }

  deleteIndex(name: string): boolean {
    return this.indices.delete(name);
  }

  clusterHealth() {
    return {
      cluster_name: "durgas-cluster",
      status: "green",
      timed_out: false,
      number_of_nodes: 1,
      number_of_data_nodes: 1,
      active_primary_shards: this.indices.size,
      active_shards: this.indices.size,
      relocating_shards: 0,
      initializing_shards: 0,
      unassigned_shards: 0,
      delayed_unassigned_shards: 0,
      number_of_pending_tasks: 0,
      number_of_in_flight_fetch: 0,
      task_max_waiting_in_queue_millis: 0,
      active_shards_percent_as_number: 100.0
    };
  }

  nodes() {
    return {
      _nodes: {
        total: 1,
        successful: 1,
        failed: 0
      },
      cluster_name: "durgas-cluster",
      nodes: {
        "node-1-id": {
          name: "node-1",
          transport_address: "127.0.0.1:9300",
          host: "127.0.0.1",
          ip: "127.0.0.1",
          version: "1.0.0",
          build_flavor: "default",
          build_type: "nextjs",
          build_hash: "abcd123",
          roles: ["master", "data", "ingest"],
          attributes: {
            ml: {
              machine_memory: "8589934592",
              max_open_jobs: "20"
            }
          },
          http: {
            bound_address: ["127.0.0.1:9200"],
            publish_address: "127.0.0.1:9200",
            max_content_length_in_bytes: 104857600
          }
        }
      }
    };
  }

  nodesStats() {
    return {
      _nodes: {
        total: 1,
        successful: 1,
        failed: 0
      },
      cluster_name: "durgas-cluster",
      nodes: {
        "node-1-id": {
          timestamp: Date.now(),
          name: "node-1",
          transport_address: "127.0.0.1:9300",
          host: "127.0.0.1",
          ip: "127.0.0.1",
          roles: ["master", "data", "ingest"],
          indices: {
            docs: {
              count: Array.from(this.indices.values()).reduce((acc, idx) => acc + idx.docs.size, 0),
              deleted: 0
            },
            store: {
              size_in_bytes: Array.from(this.indices.values()).reduce((acc, idx) => acc + idx.docs.size * 1024, 0)
            }
          },
          os: {
            timestamp: Date.now(),
            cpu: {
              percent: 5,
              load_average: {
                "1m": 1.5,
                "5m": 1.2,
                "15m": 1.0
              }
            },
            mem: {
              total_in_bytes: 8589934592,
              free_in_bytes: 4294967296,
              used_in_bytes: 4294967296,
              free_percent: 50,
              used_percent: 50
            }
          },
          jvm: {
            timestamp: Date.now(),
            uptime_in_millis: 3600000,
            mem: {
              heap_used_in_bytes: 536870912,
              heap_used_percent: 25,
              heap_max_in_bytes: 2147483648
            }
          }
        }
      }
    };
  }

  info() {
    return {
      name: "node-1",
      cluster_name: "durgas-cluster",
      version: {
        number: "1.0.0",
        build_flavor: "default",
        build_type: "nextjs",
        build_hash: "abcd123",
        build_date: new Date().toISOString(),
        build_snapshot: false,
        lucene_version: "minisearch-7.1.1",
        minimum_wire_compatibility_version: "1.0.0",
        minimum_index_compatibility_version: "1.0.0"
      },
      tagline: "You Know, for Search"
    };
  }
}

// Global instance to persist across requests during dev
const globalForEngine = global as unknown as { engine: Engine };
export const engine = globalForEngine.engine || new Engine();
if (process.env.NODE_ENV !== 'production') globalForEngine.engine = engine;
