const CACHE = new Map();

export const cache = {
  get(key) {
    return CACHE.get(key);
  },

  set(key, value) {
    CACHE.set(key, value);

    // limpiar después de 10 min
    setTimeout(() => CACHE.delete(key), 600000);
  }
};
