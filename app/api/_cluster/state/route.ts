import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function GET() {
  return NextResponse.json({
    cluster_name: "durgas-cluster",
    cluster_uuid: "cluster-uuid",
    version: 1,
    state_uuid: "state-uuid",
    master_node: "node-1-id",
    blocks: {},
    nodes: engine.nodes().nodes,
    metadata: {
      cluster_coordination: {
        term: 1,
        last_committed_config: ["node-1-id"],
        last_accepted_config: ["node-1-id"],
        voting_config_exclusions: []
      },
      templates: {},
      indices: Array.from(engine.indices.keys()).reduce((acc: any, index: string) => {
        acc[index] = {
          state: "open",
          settings: {
            index: {
              creation_date: Date.now().toString(),
              number_of_shards: "1",
              number_of_replicas: "1",
              uuid: `${index}-uuid`,
              version: {
                created: "1000000"
              },
              provided_name: index
            }
          },
          mappings: {
             properties: engine.indices.get(index)?.stats().fields.reduce((acc: any, field: string) => ({ ...acc, [field]: { type: "text" } }), {}) || {}
          },
          aliases: [],
          primary_terms: { "0": 1 },
          in_sync_allocations: { "0": ["alloc-id"] }
        };
        return acc;
      }, {}),
      "index-graveyard": {
        tombstones: []
      }
    },
    routing_table: {
      indices: Array.from(engine.indices.keys()).reduce((acc: any, index: string) => {
        acc[index] = {
          shards: {
            "0": [
              {
                state: "STARTED",
                primary: true,
                node: "node-1-id",
                relocating_node: null,
                shard: 0,
                index: index,
                allocation_id: {
                  id: "alloc-id"
                }
              }
            ]
          }
        };
        return acc;
      }, {})
    },
    routing_nodes: {
      unassigned: [],
      nodes: {
        "node-1-id": Array.from(engine.indices.keys()).map((index: string) => ({
          state: "STARTED",
          primary: true,
          node: "node-1-id",
          relocating_node: null,
          shard: 0,
          index: index,
          allocation_id: {
            id: "alloc-id"
          }
        }))
      }
    }
  });
}
