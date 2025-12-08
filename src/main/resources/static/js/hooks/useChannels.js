import { useState, useEffect, useCallback } from "react";

const CHANNELS_STORAGE_KEY = "iptv_channels";
const ITEMS_PER_PAGE = 10;

export const useChannels = () => {
  const [channels, setChannels] = useState([]);
  const [filteredChannels, setFilteredChannels] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedChannels, setSelectedChannels] = useState(new Set());

  // Carregar canais do cache
  useEffect(() => {
    const cachedChannels = localStorage.getItem(CHANNELS_STORAGE_KEY);
    if (cachedChannels) {
      const parsedChannels = JSON.parse(cachedChannels);
      setChannels(parsedChannels);
      setFilteredChannels(parsedChannels);
    }
  }, []);

  // Atualizar paginação
  useEffect(() => {
    const total = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
    setTotalPages(total);
    if (currentPage > total && total > 0) {
      setCurrentPage(total);
    }
  }, [filteredChannels, currentPage]);

  // Salvar no cache
  const saveChannelsToCache = useCallback((channelsToSave) => {
    localStorage.setItem(CHANNELS_STORAGE_KEY, JSON.stringify(channelsToSave));
  }, []);

  // Adicionar canais
  const addChannels = useCallback(
    (newChannels) => {
      setChannels((prev) => {
        const updated = [...prev, ...newChannels];
        setFilteredChannels(updated);
        saveChannelsToCache(updated);
        return updated;
      });
    },
    [saveChannelsToCache],
  );

  // Atualizar canal
  const updateChannel = useCallback(
    (channelId, updatedData) => {
      setChannels((prev) => {
        const updated = prev.map((channel) =>
          channel.id === channelId ? { ...channel, ...updatedData } : channel,
        );
        setFilteredChannels(updated);
        saveChannelsToCache(updated);
        return updated;
      });
    },
    [saveChannelsToCache],
  );

  // Deletar canal
  const deleteChannel = useCallback(
    (channelId) => {
      setChannels((prev) => {
        const updated = prev.filter((channel) => channel.id !== channelId);
        setFilteredChannels(updated);
        saveChannelsToCache(updated);
        return updated;
      });
    },
    [saveChannelsToCache],
  );

  // Limpar todos os canais
  const clearChannels = useCallback(() => {
    setChannels([]);
    setFilteredChannels([]);
    setSelectedChannels(new Set());
    localStorage.removeItem(CHANNELS_STORAGE_KEY);
  }, []);

  // Selecionar/deselecionar canal
  const toggleChannelSelection = useCallback((channelId) => {
    setSelectedChannels((prev) => {
      const newSelection = new Set(prev);
      if (newSelection.has(channelId)) {
        newSelection.delete(channelId);
      } else {
        newSelection.add(channelId);
      }
      return newSelection;
    });
  }, []);

  // Selecionar todos
  const toggleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        const allIds = new Set(filteredChannels.map((channel) => channel.id));
        setSelectedChannels(allIds);
      } else {
        setSelectedChannels(new Set());
      }
    },
    [filteredChannels],
  );

  // Filtrar canais
  const filterChannels = useCallback(
    (query) => {
      if (!query.trim()) {
        setFilteredChannels(channels);
        return;
      }

      const filtered = channels.filter(
        (channel) =>
          channel.nome.toLowerCase().includes(query.toLowerCase()) ||
          channel.nome_grupo?.toLowerCase().includes(query.toLowerCase()) ||
          channel.id_canal?.toLowerCase().includes(query.toLowerCase()),
      );
      setFilteredChannels(filtered);
      setCurrentPage(1);
    },
    [channels],
  );

  // Paginação
  const getPaginatedChannels = useCallback(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredChannels.slice(startIndex, endIndex);
  }, [filteredChannels, currentPage]);

  const goToPrevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  return {
    channels,
    filteredChannels,
    currentPage,
    totalPages,
    selectedChannels,
    addChannels,
    updateChannel,
    deleteChannel,
    clearChannels,
    toggleChannelSelection,
    toggleSelectAll,
    filterChannels,
    getPaginatedChannels,
    goToPrevPage,
    goToNextPage,
    setCurrentPage,
  };
};
