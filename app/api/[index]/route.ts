import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function PUT(request: Request, context: { params: Promise<{ index: string }> }) {
  const { index } = await context.params;
  engine.getIndex(index);
  return NextResponse.json({ acknowledged: true, shards_acknowledged: true, index });
}

export async function GET(request: Request, context: { params: Promise<{ index: string }> }) {
  const { index } = await context.params;
  const idx = engine.indices.get(index);
  if (!idx) {
    return NextResponse.json({ error: { type: "index_not_found_exception", reason: `no such index [${index}]`, index } }, { status: 404 });
  }
  return NextResponse.json({
    [index]: {
      aliases: {},
      mappings: {
        properties: idx.stats().fields.reduce((acc, field) => ({ ...acc, [field]: { type: "text" } }), {})
      },
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
      }
    }
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ index: string }> }) {
  const { index } = await context.params;
  const deleted = engine.deleteIndex(index);
  if (!deleted) {
    return NextResponse.json({ error: { type: "index_not_found_exception", reason: `no such index [${index}]`, index } }, { status: 404 });
  }
  return NextResponse.json({ acknowledged: true });
}
