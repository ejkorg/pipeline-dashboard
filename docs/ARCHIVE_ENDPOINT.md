# Archive Endpoint Usage

Backend endpoint: `GET /pipelines/archived/{date_code}`

- Streams archived file for a pipeline record by `date_code`
- Sets correct MIME type
- Inline view for small files (if browser supports); forces download for large files
- Returns 404 if record/file not found
- Streams in chunks for scalability

The dashboard uses this endpoint in the Run Details modal for the "Archived File" actions.

## URL shape
```
${VITE_API_BASE_URL}/pipelines/archived/{date_code}
```
Default `VITE_API_BASE_URL` is `/pipeline-service`.

---
## Curl examples
```bash
BASE="http://your-host"     # host running the frontend+proxy
DC="20250903_180702"        # sample date_code

# Download with server-provided filename
curl -sS -L -X GET "$BASE/pipeline-service/pipelines/archived/$DC" -OJ

# Inspect headers (size, type)
curl -sS -I "$BASE/pipeline-service/pipelines/archived/$DC"

# Range fallback if HEAD returns 405
curl -sS -D - -H 'Range: bytes=0-0' "$BASE/pipeline-service/pipelines/archived/$DC" -o /dev/null
```

---
## Browser JavaScript (SPA)
```ts
const base = import.meta.env.VITE_API_BASE_URL || '/pipeline-service';
const url = `${base}/pipelines/archived/${encodeURIComponent(dateCode)}`;

// Open in new tab (server decides inline vs download)
window.open(url, '_blank');

// Get metadata (HEAD first, Range fallback)
async function getArchiveMeta(dateCode: string) {
  const url = `${base}/pipelines/archived/${encodeURIComponent(dateCode)}`;
  let resp = await fetch(url, { method: 'HEAD' });
  if (!resp.ok && resp.status !== 405) return { exists: false };
  if (resp.status === 405) {
    resp = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    if (!resp.ok) return { exists: false };
  }
  return {
    exists: true,
    size: resp.headers.get('content-length') ? parseInt(resp.headers.get('content-length')!, 10) : undefined,
    contentType: resp.headers.get('content-type') || undefined,
    lastModified: resp.headers.get('last-modified') || undefined,
  };
}
```

In this repo, the modal uses helpers from `src/services/fileService.ts`:
- `openArchiveByDateCode(dateCode)`
- `getArchiveMetadataByDateCode(dateCode)`

---
## Node (axios stream to disk)
```ts
import axios from 'axios';
import fs from 'node:fs';

async function downloadArchive(base: string, dateCode: string, outPath?: string) {
  const url = `${base}/pipelines/archived/${encodeURIComponent(dateCode)}`;
  const resp = await axios.get(url, { responseType: 'stream', validateStatus: () => true });
  if (resp.status !== 200) throw new Error(`HTTP ${resp.status}`);
  const cd = resp.headers['content-disposition'] || '';
  const match = /filename=\"?([^\";]+)\"?/i.exec(cd);
  const filename = outPath || match?.[1] || `${dateCode}.gz`;
  await new Promise<void>((resolve, reject) => {
    const ws = fs.createWriteStream(filename);
    resp.data.pipe(ws).on('finish', resolve).on('error', reject);
  });
  console.log(`Saved ${filename} (${resp.headers['content-type'] || 'unknown'})`);
}
```

---
## UI behavior summary
- If `date_code` exists on the run, the modal routes View/Info/Copy actions through the archive endpoint.
- If `date_code` is missing, it falls back to legacy path-based handling.
- The archived file path is displayed even if the backend uses alternate keys (e.g., `archive_path`, `archivedFile`) thanks to alias detection.
