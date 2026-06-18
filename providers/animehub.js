import { getSources } from "../utils/extractor.js";
import { cache } from "../utils/cache.js";

const API_ANIKOTO = "https://anikoto-api.onrender.com";

export default {
  id: "animehub",
  name: "AnimeHub GOD",
  languages: ["es", "en"],

  // 🔍 SEARCH
  async search(query) {
    const results = [];

    try {
      const res = await fetch(
        `${API_ANIKOTO}/info?name=${encodeURIComponent(query)}`
      );

      const data = await res.json();

      if (data && data.title) {
        results.push({
          id: `anikoto-${data.slug}`,
          title: data.title,
          poster: data.poster || ""
        });
      }

    } catch (e) {
      console.log("Search error:", e);
    }

    return results;
  },

  // 📺 EPISODES
  async episodes(id) {
    try {
      if (id.startsWith("anikoto-")) {
        const slug = id.replace("anikoto-", "");

        const res = await fetch(
          `${API_ANIKOTO}/episodes?name=${slug}`
        );

        const data = await res.json();

        if (!data?.episodes) return [];

        return data.episodes.map(ep => ({
          id: `${id}-ep-${ep.number}`,
          number: ep.number,
          title: `Episode ${ep.number}`
        }));
      }

    } catch (e) {
      console.log("Episodes error:", e);
    }

    return [];
  },

  // 🎬 SOURCES
  async sources(epId) {
    try {
      const cached = cache.get(epId);
      if (cached) return cached;

      let sources = await getSources(epId);

      // ordenar
      sources = sources.sort((a, b) => {
        const q = x =>
          x?.quality?.includes("1080") ? 3 :
          x?.quality?.includes("720") ? 2 : 1;

        const audio = x => (x?.audio === "LAT" ? 1 : 0);

        return q(b) - q(a) || audio(b) - audio(a);
      });

      cache.set(epId, sources);

      return sources;

    } catch (e) {
      console.log("Sources error:", e);
      return [];
    }
  },

  // ▶️ NEXT EPISODE
  async nextEpisode(currentEpId) {
    try {
      const [base, ep] = currentEpId.split("-ep-");
      return `${base}-ep-${parseInt(ep) + 1}`;
    } catch {
      return null;
    }
  },

  // 📖 DETAILS
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
          description: data.synopsis || "",
          genres: data.genres || [],
          rating: data.rating || "N/A"
        };
      }
    } catch {}

    return null;
  }
};