export const m3uParser = {
  parseM3U(content) {
    const lines = content.split("\n");
    const channels = [];
    let currentChannel = null;
    let tvgUrls = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.startsWith("#EXTM3U")) {
        const urlMatch = trimmed.match(/tvg-url="([^"]*)"/);
        if (urlMatch) {
          tvgUrls = urlMatch[1]
            .split(",")
            .map((u) => u.trim())
            .filter((u) => u);
        }
        continue;
      }

      if (trimmed.startsWith("#EXTINF:")) {
        currentChannel = this.parseExtInf(trimmed);
      } else if (!trimmed.startsWith("#") && currentChannel) {
        currentChannel.url = trimmed;
        channels.push(currentChannel);
        currentChannel = null;
      }
    }

    return { tvgUrls, channels };
  },

  parseExtInf(line) {
    const uniqueId = crypto.randomUUID();
    const channel = {
      id: uniqueId,
      numero_canal: "",
      nome: "",
      nome_grupo: "",
      url: "",
      logo_url: "",
      id_canal: "",
      selected: false,
    };

    const matches = line.match(/#EXTINF:([-\d]+)\s*(.*),(.*)/);
    if (matches) {
      const attributesStr = matches[2] || "";
      channel.nome = matches[3].trim();

      // Extrair atributos
      const tvgIdMatch = attributesStr.match(/tvg-id="([^"]*)"/);
      if (tvgIdMatch) channel.id_canal = tvgIdMatch[1];

      const chnoMatch = attributesStr.match(/tvg-chno="([^"]*)"/);
      if (chnoMatch) channel.numero_canal = parseInt(chnoMatch[1]);

      const groupMatch = attributesStr.match(/group-title="([^"]*)"/);
      if (groupMatch) channel.nome_grupo = groupMatch[1];

      const logoMatch = attributesStr.match(/tvg-logo="([^"]*)"/);
      if (logoMatch) {
        const logo = logoMatch[1].trim();
        channel.logo_url = logo && logo.toLowerCase() !== "null" ? logo : "";
      }
    }

    return channel;
  },

  async fetchM3U(url) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      return this.parseM3U(content);
    } catch (error) {
      console.error("Erro ao carregar M3U:", error);
      throw error;
    }
  },
};
