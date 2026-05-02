import { NextResponse } from 'next/server';
import { engine } from '@/lib/engine';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    const items = [];
    let hasErrors = false;

    for (let i = 0; i < lines.length; i += 2) {
      try {
          const actionLine = JSON.parse(lines[i]);
          const action = Object.keys(actionLine)[0]; // index, create, update, delete
          const meta = actionLine[action];
          const indexMeta = meta._index || "default";
          const idMeta = meta._id || randomUUID();
          
          let doc = {};
          if (action !== "delete" && i + 1 < lines.length) {
              doc = JSON.parse(lines[i + 1]);
          }

          if (action === "index" || action === "create" || action === "update") {
              const idx = engine.getIndex(indexMeta);
              if (action === "update" && doc.hasOwnProperty("doc")) {
                  const existing = idx.get(idMeta) || {};
                  idx.add(idMeta, { ...existing, ...(doc as any).doc });
              } else {
                  idx.add(idMeta, doc);
              }
              items.push({
                  [action]: {
                      _index: indexMeta,
                      _id: idMeta,
                      _version: 1,
                      result: "created",
                      status: 201
                  }
              });
          } else if (action === "delete") {
              const idx = engine.indices.get(indexMeta);
              if (idx) idx.delete(idMeta);
              i--; // delete only has one line
              items.push({
                delete: {
                    _index: indexMeta,
                    _id: idMeta,
                    _version: 2,
                    result: "deleted",
                    status: 200
                }
              });
          }
      } catch (e: any) {
        hasErrors = true;
        items.push({
            error: {
                type: "parse_exception",
                reason: e.message
            },
            status: 400
        });
      }
    }

    return NextResponse.json({
        took: 10,
        errors: hasErrors,
        items
    });
  } catch (err: any) {
    return NextResponse.json({ error: { type: "parse_exception", reason: err.message } }, { status: 400 });
  }
}
