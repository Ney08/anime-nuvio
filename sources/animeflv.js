export const animeflv = {
  name: "AnimeFLV",

  async search(q) {
    const html = await fetch(
      `https://www3.animeflv.net/browse?q=${q}`
    ).then(r => r.text());

    const matches = [...html.matchAll(/href="\/anime\/([^"]+)".*?title="([^"]+)"/g)];

    return matches.map(m => ({
      id: `flv-${m[1]}`,
      title: m[2]
    }));
  },

  async episodes(id) {
    const slug = id.replace("flv-", "");

    const html = await fetch(
      `https://www3.animeflv.net/anime/${slug}`
    ).then(r => r.text());

    const eps = [...html.matchAll(/data-id="(\d+)"/g)];

    return eps.map((e, i) => ({
      id: `${id}-ep-${i + 1}`,
      number: i + 1
    }));
  },

  async sources(epId) {
    // aquí normalmente necesitas decrypt JS
    return []; // placeholder (anti-bot real)
  }
};