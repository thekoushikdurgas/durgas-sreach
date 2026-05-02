import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';
import { randomUUID } from 'crypto';

export async function POST(request: Request, context: { params: Promise<{ index: string }> }) {
  try {
    const { index } = await context.params;
    const body = await request.json();
    const docId = randomUUID();
    const idx = engine.getIndex(index);
    idx.add(docId, body);

    return NextResponse.json({
      _index: index,
      _id: docId,
      _version: 1,
      result: "created",
      _shards: {
        total: 2,
        successful: 1,
        failed: 0
      },
      _seq_no: 0,
      _primary_term: 1
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: { type: "parse_exception", reason: err.message } }, { status: 400 });
  }
}
