import { searchNyaa } from "./nyaa.js";
import { addTorrent, getFiles } from "./torbox.js";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Referer": "https://animeflv.net",
  "Origin": "https://animeflv.net"
};

// 🔐 decrypt seguro (mejorado)
function unpackJS(packed) {
  try {
    if (packed.includes("eval(function")) {
      return Function('"use strict";return (' + packed + ')')();
    }
    return packed;
  } catch {
    return packed;
  }
}

// 🎥 extraer video (más robusto)
function extractM3U8(html) {
  return html.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/)?.[0];
}

// 🎥 mirrors múltiples mejorado
function extractMirrors(html) {
  const matches = [
    ...html.matchAll(/source src="([^"]+)"/g),
    ...html.matchAll(/iframe[^>]+src="([^"]+)"/g)
  ];

  return [...new Set(matches.map(m => m[1]))];
}

// 🌎 subtítulos avanzados
function extractSubs(html) {
  const matches = [
    ...html.matchAll(/https?:\/\/[^"' ]+\.(vtt|srt)/g)
  ];

  return dedupeSubs(matches.map(m => ({
    url: m[0],
    lang: detectLang(m[0])
  })));
}

// 🧠 idioma mejorado
function detectLang(url) {
  const u = url.toLowerCase();

  if (u.includes("lat")) return "Español LAT";
  if (u.includes("cast")) return "Español";
  if (u.includes("es")) return "Español";
  if (u.includes("en")) return "English";
  if (u.includes("pt")) return "Português";
  if (u.includes("jp")) return "Japanese";

  return "Unknown";
}

// limpiar duplicados
function dedupeSubs(subs) {
  const map = new Map();
  subs.forEach(s => map.set(s.url, s));
  return [...map.values()];
}

// 🎚 calidad
function detectQuality(text = "") {
  text = text.toLowerCase();
  if (text.includes("1080")) return "1080p";
  if (text.includes("720")) return "720p";
  if (text.includes("480")) return "480p";
  return "auto";
}

// 🎧 audio
function detectAudio(text = "") {
  text = text.toLowerCase();
  if (text.includes("lat") || text.includes("dub")) return "LAT";
  return "SUB";
}

// fetch helper
async function fetchText(url) {
  try {
    const res = await fetch(url, { headers: HEADERS });
    return await res.text();
  } catch {
    return "";
  }
}

// 🔄 normalizar nombre para torrents
function cleanQuery(name) {
  return name
    .replace(/-/g, " ")
    .replace(/\b(ep|episode|capitulo)\b/gi, "")
    .replace(/\d+$/, "")
    .trim();
}

// 🧠 ordenar + limpiar
function finalize(results) {
  const seen = new Set();

  return results
    .filter(r => {
      if (!r.url || seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    })
    .sort((a, b) => {
      const q = x =>
        x.quality.includes("1080") ? 3 :
        x.quality.includes("720") ? 2 : 1;

      const audio = x => (x.audio === "LAT" ? 1 : 0);

      return q(b) - q(a) || audio(b) - audio(a);
    });
}

// ==================
// 🔥 CORE FINAL
// ==================

export async function getSources(epId) {
  let results = [];

  try {
    const html = await fetchText(`https://tu-sitio.com/${epId}`);

    // ======================
    // 🔹 SCRAPING DIRECTO
    // ======================
    const mirrors = extractMirrors(html);

    for (const mirror of mirrors) {
      try {
        const playerHtml = await fetchText(mirror);

        const unpacked = unpackJS(playerHtml);

        const video = extractM3U8(unpacked);
        const subs = extractSubs(unpacked);

        if (video) {
          results.push({
            url: video,
            quality: detectQuality(video),
            audio: detectAudio(video),
            subtitles: subs,
            source: "Mirror"
          });
        }

      } catch {}
    }

    // ✅ si ya hay streams buenos → salir rápido
    if (results.length >= 2) {
      return finalize(results);
    }

    // ======================
    // 🔥 TORBOX + NYAA
    // ======================

    const [name, ep] = epId.split("-ep-");
    const query = `${cleanQuery(name)} ${ep}`;

    const magnets = await searchNyaa(query);

    for (const magnet of magnets.slice(0, 2)) {
      try {
        const torrent = await addTorrent(magnet);

        if (!torrent?.id) continue;

        // ⏱ espera corta
        await new Promise(r => setTimeout(r, 800));

        const files = await getFiles(torrent.id);

        for (const f of files) {
          if (!f.stream_url) continue;
          if (!f.name.match(/\.(mp4|mkv|avi)/i)) continue;

          results.push({
            url: f.stream_url,
            quality: detectQuality(f.name),
            audio: detectAudio(f.name),
            subtitles: [],
            source: "Torbox"
          });
        }

      } catch {}
    }

    // ======================
    // 🔹 FALLBACK FINAL
    // ======================

    if (!results.length) {
      const video = extractM3U8(html);
      const subs = extractSubs(html);

      if (video) {
        results.push({
          url: video,
          quality: detectQuality(video),
          audio: detectAudio(video),
          subtitles: subs,
          source: "Fallback"
        });
      }
    }

  } catch (err) {
    console.log("Extractor error:", err);
  }

  return finalize(results);
}