import { getSources } from "../utils/extractor.js";
import { cache } from "../utils/cache.js";

// 🌐 fuentes de búsqueda
const API_ANIKOTO = "https://anikoto-api.onrender.com";

export default {
  id: "animehub",
  name: "🔥 AnimeHub GOD",
  languages: ["es", "en"],

  // 🔍 BÚSQUEDA REAL
  async search(query) {
    const results = [];

    try {
      const res = await fetch(
        `${API_ANIKOTO}/info?name=${encodeURIComponent(query)}`
      );
      const data = await res.json();

      if (data?.title) {
        results.push({
          id: `anikoto-${data.slug}`,
          title: data.title,
          poster: data.poster || "",
          description: data.synopsis || "",
          source: "Anikoto"
        });
      }
    } catch {}

    return results;
  },

  // 📺 EPISODIOS REALES
  async episodes(id) {
    try {
      // detectar fuente
      if (id.startsWith("anikoto-")) {
        const slug = id.replace("anikoto-", "");

        const res = await fetch(
          `${API_ANIKOTO}/episodes?name=${slug}`
        );
        const data = await res.json();

        return data.episodes.map(ep => ({
          id: `${id}-ep-${ep.number}`,
          number: ep.number,
          title: `Episode ${ep.number}`
        }));
      }

    } catch {}

    return [];
  },

  // 🎬 STREAMS PRO (con cache)
  async sources(epId) {
    const cached = cache.get(epId);
    if (cached) return cached;

    const sources = await getSources(epId);

    // ✅ orden extra (mejor calidad + lat primero)
    sources.sort((a, b) => {
      const qualityScore = q => {
        if (q.includes("1080")) return 3;
        if (q.includes("720")) return 2;
        return 1;
      };

      const audioScore = a => (a === "LAT" ? 1 : 0);

      return (
        qualityScore(b.quality) - qualityScore(a.quality) ||
        audioScore(b.audio) - audioScore(a.audio)
      );
    });

    cache.set(epId, sources);

    return sources;
  },

  // ▶️ AUTO NEXT INTELIGENTE
  async nextEpisode(currentEpId) {
    try {
      const [base, ep] = currentEpId.split("-ep-");
      const nextEp = parseInt(ep) + 1;

      return `${base}-ep-${nextEp}`;
    } catch {
      return null;
    }
  },

  // 🧠 EXTRA (tipo Netflix)
  async details(id) {
    try {
      if (id.startsWith("anikoto-")) {
        const slug = id.replace("anikoto-", "");

        const res = await fetch(
          `${API_ANIKOTO}/info?name=${slug}`
        );
        const data = await res.json();

        return {
          title: data.title,
          poster: data.poster,
          banner: data.poster,
          description: data.synopsis,
          genres: data.genres || [],
          rating: data.rating || "N/A"
        };
      }
    } catch {}

    return null;
  }
};