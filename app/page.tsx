'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Database, Play, Server, Layers, FileJson } from 'lucide-react';

export default function DurgasSearchConsole() {
  const [method, setMethod] = useState('GET');
  const [endpoint, setEndpoint] = useState('/api');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState<string>('// Response will appear here...');
  const [clusterInfo, setClusterInfo] = useState<any>(null);

  useEffect(() => {
    fetchClusterInfo();
  }, []);

  const fetchClusterInfo = async () => {
    try {
      const res = await fetch('/api/_cluster/health');
      if (res.ok) {
        setClusterInfo(await res.json());
      }
    } catch (e) {}
  };

  const handleRequest = async () => {
    setResponse('Loading...');
    try {
      const options: RequestInit = {
        method,
        headers: {},
      };
      
      if (['POST', 'PUT'].includes(method) && body) {
         if (endpoint.includes('_bulk')) {
            (options.headers as any)['Content-Type'] = 'application/x-ndjson';
            options.body = body;
         } else {
            (options.headers as any)['Content-Type'] = 'application/json';
            options.body = body;
         }
      }

      const res = await fetch(endpoint, options);
      const data = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(data), null, 2));
      } catch (e) {
        setResponse(data);
      }
      fetchClusterInfo(); // Update health after request
    } catch (err: any) {
      setResponse(`Error: ${err.message}`);
    }
  };

  const loadExample = (ex: any) => {
    setMethod(ex.method);
    setEndpoint(ex.endpoint);
    setBody(ex.body);
  };

  const examples = [
    { name: 'Cluster Health', method: 'GET', endpoint: '/api/_cluster/health', body: '' },
    { name: 'Node Info', method: 'GET', endpoint: '/api', body: '' },
    { name: 'Nodes Configuration', method: 'GET', endpoint: '/api/_nodes', body: '' },
    { name: 'Nodes Stats', method: 'GET', endpoint: '/api/_nodes/stats', body: '' },
    { name: 'Cluster State', method: 'GET', endpoint: '/api/_cluster/state', body: '' },
    { name: 'Create S3 Repo Mock', method: 'PUT', endpoint: '/api/_snapshot/my_s3_backup', body: '{\n  "type": "s3",\n  "settings": {\n    "bucket": "my-bucket",\n    "client": "default"\n  }\n}' },
    { name: 'Create Snapshot', method: 'PUT', endpoint: '/api/_snapshot/my_s3_backup/snapshot_1?wait_for_completion=true', body: '{\n  "indices": "my-index",\n  "ignore_unavailable": true,\n  "include_global_state": false\n}' },
    { name: 'Get Snapshots', method: 'GET', endpoint: '/api/_snapshot/my_s3_backup/_all', body: '' },
    { name: 'Create Index', method: 'PUT', endpoint: '/api/my-index', body: '' },
    { name: 'Index Document', method: 'POST', endpoint: '/api/my-index/_doc', body: '{\n  "title": "Welcome to Durgas Search",\n  "content": "A lightweight distributed engine"\n}' },
    { name: 'Bulk Ingest', method: 'POST', endpoint: '/api/_bulk', body: '{"index":{"_index":"my-index","_id":"2"}}\n{"title":"Second Doc","content":"Bulk test"}\n{"index":{"_index":"my-index","_id":"3"}}\n{"title":"Third Doc","content":"Another document"}\n' },
    { name: 'Search Query', method: 'POST', endpoint: '/api/my-index/_search', body: '{\n  "query": {\n    "match": {\n      "content": "distributed"\n    }\n  }\n}' }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-6 overflow-hidden flex flex-col md:flex-row gap-6">
      {/* Sidebar */}
      <div className="w-full md:w-72 flex flex-col gap-6 border-r border-slate-800 pr-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20 shrink-0">
            <span className="font-bold text-white text-lg">DS</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white flex items-center">
              Durgas Search
            </h1>
            <p className="text-xs text-slate-500 font-mono">v1.2.0-LTS</p>
          </div>
        </div>

        <div className="text-sm">
          <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2">
            <Layers size={14} /> Cluster Status
          </h2>
          {clusterInfo ? (
             <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 shadow-sm text-[13px] space-y-2 font-mono">
               <div className="flex justify-between items-center text-slate-300">
                 <span className="flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${clusterInfo.status === 'green' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500 animate-pulse'}`}></span>Status:</span>
                 <span className={clusterInfo.status === 'green' ? 'text-emerald-400 font-bold' : 'text-yellow-400 font-bold'}>{clusterInfo.status}</span>
               </div>
               <div className="flex justify-between items-center text-slate-300">
                 <span>Nodes:</span>
                 <span className="text-slate-200">{clusterInfo.number_of_nodes}</span>
               </div>
               <div className="flex justify-between items-center text-slate-300">
                 <span>Active Shards:</span>
                 <span className="text-slate-200">{clusterInfo.active_primary_shards}</span>
               </div>
             </div>
          ) : (
            <div className="text-xs text-slate-500 font-mono">Fetching...</div>
          )}
        </div>

        <div className="text-sm flex-1 flex flex-col min-h-0">
          <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-3 flex items-center gap-2">
            <FileJson size={14} /> API Specs & Examples
          </h2>
          <ul className="space-y-1.5 overflow-y-auto">
            {examples.map((ex, i) => {
               const methodColors: Record<string, string> = {
                  GET: 'bg-blue-600/20 text-blue-400',
                  POST: 'bg-emerald-600/20 text-emerald-400',
                  PUT: 'bg-purple-600/20 text-purple-400',
                  DELETE: 'bg-orange-600/20 text-orange-400'
               };
               return (
               <li key={i}>
                 <button 
                  onClick={() => loadExample(ex)}
                  className="text-left w-full hover:bg-slate-900 p-2.5 rounded-lg text-xs truncate flex items-center justify-between group transition-all border border-transparent hover:border-slate-800/50"
                 >
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${methodColors[ex.method] || 'bg-slate-600/20 text-slate-400'}`}>
                     {ex.method}
                   </span>
                   <span className="group-hover:text-white text-slate-400 ml-3 truncate flex-grow">{ex.name}</span>
                 </button>
               </li>
               );
            })}
          </ul>
        </div>
      </div>

      {/* Main Console */}
      <div className="flex-1 flex flex-col gap-6 min-w-0">
        <div className="flex flex-col sm:flex-row gap-3">
           <select 
             value={method} 
             onChange={(e) => setMethod(e.target.value)}
             className="bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-bold text-sm max-w-[110px] shadow-sm appearance-none"
           >
             <option>GET</option>
             <option>POST</option>
             <option>PUT</option>
             <option>DELETE</option>
           </select>
           <input 
             type="text" 
             value={endpoint} 
             onChange={(e) => setEndpoint(e.target.value)}
             className="flex-1 bg-slate-900 border border-slate-800 text-slate-300 px-4 py-2.5 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-sm shadow-sm"
             placeholder="/api/..."
           />
           <button 
             onClick={handleRequest}
             className="bg-indigo-600 hover:bg-indigo-500 transition-colors text-white px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-indigo-900/20 whitespace-nowrap"
           >
             <Play size={16} fill="currentColor" /> Send
           </button>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-0">
           <div className="flex flex-col gap-3 h-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">Request Body</label>
              <textarea 
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex-1 bg-black border border-slate-800 text-slate-300 p-4 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-[13px] leading-relaxed resize-none shadow-inner"
                placeholder="{}"
                spellCheck={false}
              />
           </div>
           
           <div className="flex flex-col gap-3 h-full">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-between shrink-0">
                 <span className="flex items-center gap-2"><Terminal size={14} className="text-indigo-400" /> Response Output</span>
                 <div className="flex gap-1.5 opacity-50">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-700"></div>
                 </div>
              </label>
              <pre className="flex-1 bg-black border border-slate-800 p-4 rounded-xl overflow-auto font-mono text-[13px] text-emerald-400 leading-relaxed shadow-inner whitespace-pre-wrap break-all relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600/20"></div>
                {response}
              </pre>
           </div>
        </div>
      </div>
    </div>
  );
}
