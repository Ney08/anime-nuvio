const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
  "Referer": "https://animeflv.net",
  "Origin": "https://animeflv.net"
};

// 🔐 decrypt seguro (evita romper Hermes)
function unpackJS(packed) {
  try {
    // evita eval directo peligroso
    if (packed.includes("eval(function")) {
      return Function('"use strict";return (' + packed + ')')();
    }
    return packed;
  } catch {
    return packed;
  }
}

// 🎥 extraer .m3u8
function extractM3U8(html) {
  return html.match(/https?:\/\/[^"' ]+\.m3u8[^"' ]*/)?.[0];
}

// 🎥 mirrors múltiples
function extractMirrors(html) {
  const matches = [...html.matchAll(/source src="([^"]+)"/g)];
  return matches.map(m => m[1]);
}

// 🌎 extraer subtítulos
function extractSubs(html) {
  const subs = [];

  const matches = [
    ...html.matchAll(/https?:\/\/[^"' ]+\.(vtt|srt)/g)
  ];

  for (const m of matches) {
    subs.push({
      url: m[0],
      lang: detectLang(m[0])
    });
  }

  return dedupeSubs(subs);
}

// 🧠 detectar idioma
function detectLang(url) {
  const u = url.toLowerCase();

  if (u.includes("lat")) return "Español LAT";
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
function detectQuality(url) {
  if (url.includes("1080")) return "1080p";
  if (url.includes("720")) return "720p";
  if (url.includes("480")) return "480p";
  return "auto";
}

// 🎧 audio
function detectAudio(url) {
  const u = url.toLowerCase();
  if (u.includes("lat") || u.includes("dub")) return "LAT";
  return "SUB";
}

// fetch helper
async function fetchText(url) {
  const res = await fetch(url, { headers: HEADERS });
  return await res.text();
}

// 🧠 CORE PRO
export async function getSources(epId) {
  let results = [];

  try {
    const html = await fetchText(`https://tu-sitio.com/${epId}`);

    // 🔹 1. mirrors
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
            source: mirror
          });
        }

      } catch {}
    }

    // 🔹 2. fallback directo
    if (!results.length) {
      const fallbackVideo = extractM3U8(html);
      const subs = extractSubs(html);

      if (fallbackVideo) {
        results.push({
          url: fallbackVideo,
          quality: detectQuality(fallbackVideo),
          audio: detectAudio(fallbackVideo),
          subtitles: subs,
          source: "fallback"
        });
      }
    }

    // 🔹 3. ordenar calidad
    results.sort((a, b) => {
      const score = q => {
        if (q.includes("1080")) return 3;
        if (q.includes("720")) return 2;
        if (q.includes("480")) return 1;
        return 0;
      };

      return score(b.quality) - score(a.quality);
    });

    // 🔹 4. evitar duplicados de video
    const seen = new Set();
    results = results.filter(r => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });

  } catch (err) {
    console.log("Extractor error:", err);
  }

  return results;
}