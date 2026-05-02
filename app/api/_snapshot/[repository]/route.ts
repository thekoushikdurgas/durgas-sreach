import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function PUT(request: Request, context: { params: Promise<{ repository: string }> }) {
  try {
    const { repository } = await context.params;
    const body = await request.json();
    
    // Validate repository type
    if (!['fs', 's3', 'gcs', 'azure'].includes(body.type)) {
      return NextResponse.json({ error: { type: "repository_exception", reason: `[${repository}] location [${body.type}] doesn't match any of the locations specified by path.repo` } }, { status: 400 });
    }

    // Mock specific implementations for stateless mode
    if (body.type === 's3' && body.settings?.client === 'default') {
        body.settings.mocked = true;
    }

    engine.putRepository(repository, body);

    return NextResponse.json({ acknowledged: true });
  } catch (err: any) {
    return NextResponse.json({ error: { type: "parse_exception", reason: err.message } }, { status: 400 });
  }
}

export async function GET(request: Request, context: { params: Promise<{ repository: string }> }) {
  const { repository } = await context.params;
  const repo = engine.getRepository(repository);
  if (!repo) {
    return NextResponse.json({ error: { type: "repository_missing_exception", reason: `[${repository}] missing` } }, { status: 404 });
  }
  return NextResponse.json({ [repository]: repo });
}

export async function DELETE(request: Request, context: { params: Promise<{ repository: string }> }) {
  const { repository } = await context.params;
  const deleted = engine.deleteRepository(repository);
  if (!deleted) {
    return NextResponse.json({ error: { type: "repository_missing_exception", reason: `[${repository}] missing` } }, { status: 404 });
  }
  return NextResponse.json({ acknowledged: true });
}
