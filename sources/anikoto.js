const API = "https://anikoto-api.onrender.com";
const SITE = "https://anikoto.to";

export const anikoto = {
  name: "Anikoto",

  async search(q) {
    const res = await fetch(`${API}/info?name=${q}`);
    const d = await res.json();

    return [{
      id: `anikoto-${d.slug}`,
      title: d.title,
      poster: d.poster
    }];
  },

  async episodes(id) {
    const slug = id.replace("anikoto-", "");
    const res = await fetch(`${API}/episodes?name=${slug}`);
    const d = await res.json();

    return d.episodes.map(ep => ({
      id: `${id}-ep-${ep.number}`,
      number: ep.number
    }));
  },

  async sources(epId) {
    const [, slug, num] = epId.match(/anikoto-(.*)-ep-(\d+)/);

    const html = await fetch(`${SITE}/${slug}-episode-${num}`)
      .then(r => r.text());

    const iframe = html.match(/iframe.*src="([^"]+)/)?.[1];

    if (!iframe) return [];

    const player = await fetch(iframe).then(r => r.text());

    const file = player.match(/https?:\/\/.*\.m3u8/)?.[0];

    if (!file) return [];

    return [{
      url: file,
      quality: "auto",
      source: "Anikoto"
    }];
  }
};