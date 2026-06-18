const TORBOX_API = "https://api.torbox.app/v1";
const API_KEY = "TU_API_KEY";

// 📥 agregar torrent
export async function addTorrent(magnet) {
  const res = await fetch(`${TORBOX_API}/torrents`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      magnet
    })
  });

  return await res.json();
}

// 📂 obtener archivos
export async function getFiles(torrentId) {
  const res = await fetch(
    `${TORBOX_API}/torrents/${torrentId}/files`,
    {
      headers: {
        "Authorization": `Bearer ${API_KEY}`
      }
    }
  );

  return await res.json();
}
