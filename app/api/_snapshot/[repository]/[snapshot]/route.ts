import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function PUT(request: Request, context: { params: Promise<{ repository: string; snapshot: string }> }) {
  try {
    const { repository, snapshot } = await context.params;
    
    let body = {};
    if (request.body) {
        try {
            body = await request.json();
        } catch(e) {}
    }

    try {
        const snap = engine.createSnapshot(repository, snapshot, body);
        return NextResponse.json({ accepted: true, snapshot: snap });
    } catch(e: any) {
        return NextResponse.json({ error: { type: "repository_missing_exception", reason: `[${repository}] missing` } }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: { type: "parse_exception", reason: err.message } }, { status: 400 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ repository: string; snapshot: string }> }) {
  const { repository, snapshot } = await context.params;
  
  if (!engine.getRepository(repository)) {
      return NextResponse.json({ error: { type: "repository_missing_exception", reason: `[${repository}] missing` } }, { status: 404 });
  }

  if (snapshot === '_all' || snapshot === '*') {
      const snaps = engine.getAllSnapshots(repository);
      return NextResponse.json({ snapshots: snaps });
  }

  const snap = engine.getSnapshot(repository, snapshot);
  if (!snap) {
    return NextResponse.json({ error: { type: "snapshot_missing_exception", reason: `[${repository}:${snapshot}] is missing` } }, { status: 404 });
  }
  return NextResponse.json({ snapshots: [snap] });
}

export async function DELETE(request: Request, context: { params: Promise<{ repository: string; snapshot: string }> }) {
  const { repository, snapshot } = await context.params;
  
  if (!engine.getRepository(repository)) {
      return NextResponse.json({ error: { type: "repository_missing_exception", reason: `[${repository}] missing` } }, { status: 404 });
  }

  const deleted = engine.deleteSnapshot(repository, snapshot);
  if (!deleted) {
      return NextResponse.json({ error: { type: "snapshot_missing_exception", reason: `[${repository}:${snapshot}] is missing` } }, { status: 404 });
  }
  return NextResponse.json({ acknowledged: true });
}
