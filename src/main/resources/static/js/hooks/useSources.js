import { useState, useEffect, useCallback } from "react";
import { apiService } from "../services/api";

export const useSources = () => {
  const [sources, setSources] = useState({
    listas: [],
    epgs: [],
    repositorios_img: [],
  });
  const [dbStatus, setDbStatus] = useState({
    num_canais: 0,
    num_canais_xmltv: 0,
    num_logos_canais: 0,
    num_logos_xmltv: 0,
    num_images_repos: 0,
  });
  const [channelsDB, setChannelsDB] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar status do DB
  const loadDBStatus = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.getDBStatus();
      setDbStatus(data);
      setSources({
        listas: data.listas || [],
        epgs: data.epgs || [],
        repositorios_img: data.repositorios_img || [],
      });

      // Carregar canais do DB se houver
      if (data.num_canais > 0) {
        const channels = await apiService.getChannels();
        setChannelsDB(channels);
      }
    } catch (error) {
      console.error("Erro ao carregar status do banco:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carregar URLs
  const loadUrls = useCallback(
    async (type, urlsText) => {
      const urls = urlsText
        .split("\n")
        .map((url) => url.trim())
        .filter((url) => url !== "");

      if (urls.length === 0) {
        alert("Por favor, insira pelo menos uma URL.");
        return false;
      }

      try {
        setLoading(true);
        await apiService.uploadUrls(type, urls);
        await loadDBStatus(); // Recarregar status
        return true;
      } catch (error) {
        console.error("Erro ao enviar URLs:", error);
        alert("Erro ao carregar URLs. Verifique o console.");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [loadDBStatus],
  );

  // Deletar fonte
  const deleteSource = useCallback(
    async (source) => {
      if (!confirm(`Tem certeza que deseja excluir ${source.nome}?`)) return;

      let endpoint = "";
      switch (source.tipo) {
        case "M3U":
          endpoint = "lista";
          break;
        case "EPG":
          endpoint = "epg";
          break;
        case "Logos":
          endpoint = "repositorio";
          break;
        default:
          return;
      }

      try {
        setLoading(true);
        await apiService.deleteSource(endpoint, source.url);
        await loadDBStatus(); // Recarregar status
      } catch (error) {
        console.error("Erro ao deletar source:", error);
        alert("Erro ao deletar a fonte.");
      } finally {
        setLoading(false);
      }
    },
    [loadDBStatus],
  );

  // Buscar sugestões de ID
  const searchIdSuggestions = useCallback(async (searchTerm) => {
    try {
      return await apiService.searchChannels(searchTerm);
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
      return [];
    }
  }, []);

  // Buscar imagens
  const searchImages = useCallback(async (channelName) => {
    try {
      return await apiService.searchImages(channelName);
    } catch (error) {
      console.error("Erro ao buscar imagens:", error);
      return [];
    }
  }, []);

  useEffect(() => {
    loadDBStatus();
  }, [loadDBStatus]);

  return {
    sources,
    dbStatus,
    channelsDB,
    loading,
    loadDBStatus,
    loadUrls,
    deleteSource,
    searchIdSuggestions,
    searchImages,
  };
};
