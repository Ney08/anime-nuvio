// 🔎 buscar torrent en Nyaa
export async function searchNyaa(query) {
  const url = `https://nyaa.si/?f=0&c=1_2&q=${encodeURIComponent(query)}`;

  const html = await fetch(url).then(r => r.text());

  // 🧲 extraer magnet
  const magnets = [
    ...html.matchAll(/magnet:\?xt=urn:[^"]+/g)
  ].map(m => m[0]);

  return magnets.slice(0, 3); // primeros 3 (mejores)
}