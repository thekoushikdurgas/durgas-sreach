import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

export async function GET() {
  return NextResponse.json(engine.nodesStats());
}
