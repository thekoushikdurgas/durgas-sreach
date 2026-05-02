import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';

async function handleSearch(request: Request, index: string) {
  let query = "";
  try {
      const url = new URL(request.url);
      query = url.searchParams.get("q") || "";
      if (request.method === "POST" && request.body) {
         try {
             const body = await request.json();
             // Simple extraction of a query string
             if (body?.query?.query_string?.query) {
                 query = body.query.query_string.query;
             } else if (body?.query?.match) {
                 const firstKey = Object.keys(body.query.match)[0];
                 if (firstKey) query = typeof body.query.match[firstKey] === 'string' ? body.query.match[firstKey] : body.query.match[firstKey].query;
             }
         } catch (e) {
             // Ignore body parse errors for GETs or empty bodies
         }
      }
  } catch(e) {}

  const idx = engine.indices.get(index);
  if (!idx) {
      return NextResponse.json({ error: { type: "index_not_found_exception", reason: `no such index [${index}]`, index } }, { status: 404 });
  }

  let hits: any[] = [];
  if (query) {
      hits = idx.search(query);
  } else {
      // return all if no query
      idx.docs.forEach((v, k) => {
          hits.push({
              _index: index,
              _id: k,
              _score: 1.0,
              _source: v
          });
      });
  }

  return NextResponse.json({
      took: 1,
      timed_out: false,
      _shards: {
          total: 1,
          successful: 1,
          skipped: 0,
          failed: 0
      },
      hits: {
          total: {
              value: hits.length,
              relation: "eq"
          },
          max_score: hits.length > 0 ? hits[0]._score : null,
          hits: hits
      }
  });
}

export async function GET(request: Request, context: { params: Promise<{ index: string }> }) {
  const { index } = await context.params;
  return handleSearch(request, index);
}

export async function POST(request: Request, context: { params: Promise<{ index: string }> }) {
  const { index } = await context.params;
  return handleSearch(request, index);
}
