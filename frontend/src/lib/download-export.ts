// Downloads everything stored about the signed-in person as a file. A plain fetch, not api(): the
// answer is a file, not JSON. The cookie goes along by itself. Throws when it did not work.
export async function downloadMyData(): Promise<void> {
  const res = await fetch('/api/profile/me/export', { credentials: 'same-origin' });
  if (!res.ok) throw new Error(String(res.status));
  const name =
    /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ??
    'portfolio-data.json';
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
