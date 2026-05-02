import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function PUT(request: Request, context: { params: Promise<{ index: string; id: string }> }) {
  try {
    const { index, id } = await context.params;
    const body = await request.json();
    const idx = engine.getIndex(index);
    const existing = idx.get(id);
    idx.add(id, body);

    return NextResponse.json({
      _index: index,
      _id: id,
      _version: existing ? 2 : 1,
      result: existing ? "updated" : "created",
      _shards: {
        total: 2,
        successful: 1,
        failed: 0
      },
      _seq_no: 0,
      _primary_term: 1
    }, { status: existing ? 200 : 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { type: "parse_exception", reason: err.message } }, { status: 400 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ index: string; id: string }> }) {
  const { index, id } = await context.params;
  const idx = engine.indices.get(index);
  if (!idx) {
      return NextResponse.json({ _index: index, _id: id, found: false }, { status: 404 });
  }
  const doc = idx.get(id);
  if (!doc) {
      return NextResponse.json({ _index: index, _id: id, found: false }, { status: 404 });
  }
  return NextResponse.json({
      _index: index,
      _id: id,
      _version: 1,
      _seq_no: 0,
      _primary_term: 1,
      found: true,
      _source: doc
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ index: string; id: string }> }) {
  const { index, id } = await context.params;
  const idx = engine.indices.get(index);
  if (!idx || !idx.get(id)) {
      return NextResponse.json({ _index: index, _id: id, _version: 1, result: "not_found", _shards: { total: 2, successful: 1, failed: 0 } }, { status: 404 });
  }
  idx.delete(id);
  return NextResponse.json({
      _index: index,
      _id: id,
      _version: 2,
      result: "deleted",
      _shards: {
        total: 2,
        successful: 1,
        failed: 0
      },
      _seq_no: 1,
      _primary_term: 1
  });
}
