const BASE_URL = "http://127.0.0.1:5000";
export const apiService = {
  async getDBStatus() {
    const response = await fetch(`${BASE_URL}/db_status`);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async getChannels() {
    const response = await fetch(`${BASE_URL}/canais`);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async uploadUrls(type, urls) {
    let endpoint;
    switch (type) {
      case "m3u":
        endpoint = "/upload";
        break;
      case "epg":
        endpoint = "/upload_xmltv";
        break;
      case "images":
        endpoint = "/upload_images";
        break;
      default:
        throw new Error("Tipo desconhecido");
    }
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        urls
      })
    });
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async deleteSource(endpoint, url) {
    const response = await fetch(`${BASE_URL}/${endpoint}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url
      })
    });
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async searchChannels(query, limit = 20) {
    const response = await fetch(`${BASE_URL}/buscar_canal?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async searchImages(query, limit = 20) {
    const response = await fetch(`${BASE_URL}/buscar_imagens?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  },
  async searchEPGIds(ids) {
    const response = await fetch(`${BASE_URL}/buscar_id`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ids
      })
    });
    if (!response.ok) throw new Error(`Erro: ${response.status}`);
    return await response.json();
  }
};