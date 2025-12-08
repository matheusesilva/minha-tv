function CustomizationTab() {
  const [channels, setChannels] = React.useState([]);
  const [filteredChannels, setFilteredChannels] = React.useState([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedChannels, setSelectedChannels] = React.useState(new Set());
  const [m3uUrl, setM3uUrl] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterTerm, setFilterTerm] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [searchResults, setSearchResults] = React.useState([]);
  const [showSearchResults, setShowSearchResults] = React.useState(false);
  const [channelsDB, setChannelsDB] = React.useState([]);
  const [fuse, setFuse] = React.useState(null);
  const [editingChannel, setEditingChannel] = React.useState(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [sortOrder, setSortOrder] = React.useState("asc");
  const ITEMS_PER_PAGE = 10;

  // Configuração do Fuse.js para busca fuzzy
  const fuseOptions = {
    keys: ["nome", "nome_grupo", "id_canal"],
    includeMatches: true,
    threshold: 0.3,
    minMatchCharLength: 2
  };

  // Carregar canais do cache
  React.useEffect(() => {
    const cachedChannels = localStorage.getItem("iptv_channels");
    if (cachedChannels) {
      const parsedChannels = JSON.parse(cachedChannels);
      setChannels(parsedChannels);
      setFilteredChannels(parsedChannels);
    }
  }, []);

  // Carregar canais da base de dados para busca
  React.useEffect(() => {
    loadChannelsDB();
  }, []);

  // Inicializar Fuse.js quando channelsDB carregar
  React.useEffect(() => {
    if (channelsDB && channelsDB.length > 0) {
      setFuse(new window.Fuse(channelsDB, fuseOptions));
    }
  }, [channelsDB]);

  // Buscar canais na base de dados
  const loadChannelsDB = async () => {
    try {
      const response = await fetch("/api/m3u/canais");
      if (response.ok) {
        const data = await response.json();
        setChannelsDB(data);
      }
    } catch (error) {
      console.error("Erro ao carregar canais da base:", error);
    }
  };

  // Buscar canais fuzzy
  const searchChannels = term => {
    setSearchTerm(term);
    if (!term || !fuse) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    const results = fuse.search(term).slice(0, 20); // Limita a 10 resultados
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  // Selecionar canal da busca
  const selectSearchResult = channel => {
    const uniqueId = crypto.randomUUID();
    const newChannel = {
      ...channel,
      id: uniqueId,
      selected: false
    };

    // Adiciona no início da lista
    const newChannels = [newChannel, ...channels];
    setChannels(newChannels);
    setFilteredChannels(newChannels);

    // Salvar no cache
    localStorage.setItem("iptv_channels", JSON.stringify(newChannels));

    // Limpar busca
    setSearchTerm("");
    setSearchResults([]);
    setShowSearchResults(false);

    // Feedback visual
    setStatus(`Canal "${channel.nome}" adicionado com sucesso!`);
    setTimeout(() => setStatus(""), 3000);
  };

  // Filtrar canais quando o termo mudar
  React.useEffect(() => {
    if (!filterTerm.trim()) {
      setFilteredChannels(channels);
    } else {
      const filtered = channels.filter(channel => channel.nome?.toLowerCase().includes(filterTerm.toLowerCase()) || channel.nome_grupo?.toLowerCase().includes(filterTerm.toLowerCase()) || channel.id_canal?.toLowerCase().includes(filterTerm.toLowerCase()));
      setFilteredChannels(filtered);
    }
    setCurrentPage(1);
  }, [filterTerm, channels]);

  // Função para ordenar os canais por número
  const getSortedChannels = React.useCallback(channelsList => {
    if (!channelsList || channelsList.length === 0) return channelsList;
    return [...channelsList].sort((a, b) => {
      const numA = a.numero_canal || 999999; // Coloca canais sem número no final
      const numB = b.numero_canal || 999999;
      if (sortOrder === "asc") {
        return numA - numB;
      } else {
        return numB - numA;
      }
    });
  }, [sortOrder]);

  // Aplicar ordenação aos canais filtrados
  const sortedChannels = React.useMemo(() => {
    return getSortedChannels(filteredChannels);
  }, [filteredChannels, getSortedChannels]);

  // Função para alternar ordenação
  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  // Obter ícone da ordenação
  const getSortIcon = () => {
    return sortOrder === "asc" ? "bi-arrow-up" : "bi-arrow-down";
  };

  // Obter texto do tooltip
  const getSortTooltip = () => {
    return sortOrder === "asc" ? "Ordenação crescente (1, 2, 3...) - Clique para ordem decrescente" : "Ordenação decrescente (3, 2, 1...) - Clique para ordem crescente";
  };

  // Calcular paginação
  const totalPages = Math.ceil(sortedChannels.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedChannels = sortedChannels.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Carregar canais da URL M3U
  const loadChannels = async () => {
    if (!m3uUrl.trim()) {
      alert("Por favor, insira uma URL válida.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(m3uUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const content = await response.text();
      const result = parseM3U(content);

      // Adicionar novos canais
      const newChannels = [...channels, ...result.channels];
      setChannels(newChannels);
      setFilteredChannels(newChannels);
      setM3uUrl("");

      // Salvar no cache
      localStorage.setItem("iptv_channels", JSON.stringify(newChannels));
      setStatus(`${result.channels.length} canais importados com sucesso!`);
      setTimeout(() => setStatus(""), 3000);
    } catch (error) {
      alert("Erro ao carregar a lista M3U: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Estado para mensagens de status
  const [status, setStatus] = React.useState("");

  // Limpar lista
  const clearChannels = () => {
    if (!confirm("Tem certeza que deseja excluir todos os canais da lista?")) return;
    setChannels([]);
    setFilteredChannels([]);
    setSelectedChannels(new Set());
    localStorage.removeItem("iptv_channels");
    setStatus("Lista limpa com sucesso!");
    setTimeout(() => setStatus(""), 3000);
  };

  // Selecionar/deselecionar todos
  const toggleSelectAll = checked => {
    if (checked) {
      const allIds = new Set(paginatedChannels.map(channel => channel.id));
      setSelectedChannels(allIds);
    } else {
      setSelectedChannels(new Set());
    }
  };

  // Selecionar/deselecionar canal individual
  const toggleChannelSelection = channelId => {
    setSelectedChannels(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(channelId)) {
        newSelection.delete(channelId);
      } else {
        newSelection.add(channelId);
      }
      return newSelection;
    });
  };

  // Deletar canal
  const deleteChannel = channel => {
    if (!confirm(`Tem certeza que deseja excluir o canal ${channel.nome}?`)) return;
    const newChannels = channels.filter(c => c.id !== channel.id);
    setChannels(newChannels);
    setFilteredChannels(newChannels.filter(c => !filterTerm || c.nome?.toLowerCase().includes(filterTerm.toLowerCase())));
    localStorage.setItem("iptv_channels", JSON.stringify(newChannels));
    setStatus(`Canal "${channel.nome}" excluído com sucesso!`);
    setTimeout(() => setStatus(""), 3000);
  };

  // Navegação de páginas
  const goToPrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Função para editar canal
  const editChannel = channel => {
    setEditingChannel(channel);
    setShowEditModal(true);
  };

  // Função para salvar alterações do canal
  const saveChannelChanges = updatedData => {
    if (!editingChannel) return;
    const updatedChannels = channels.map(channel => channel.id === editingChannel.id ? {
      ...channel,
      ...updatedData
    } : channel);
    setChannels(updatedChannels);
    setFilteredChannels(updatedChannels);
    localStorage.setItem("iptv_channels", JSON.stringify(updatedChannels));
    setStatus(`Canal "${updatedData.nome}" atualizado com sucesso!`);
    setTimeout(() => setStatus(""), 3000);
  };

  // Fechar dropdown quando clicar fora
  React.useEffect(() => {
    const handleClickOutside = event => {
      if (!event.target.closest(".search-container")) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card section-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-plus-circle"
  }), " Adicionar canais \xE0 lista")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "m3u-url-input",
    className: "form-label"
  }, "URL da lista M3U"), /*#__PURE__*/React.createElement("div", {
    className: "input-group"
  }, /*#__PURE__*/React.createElement("input", {
    type: "url",
    className: "form-control",
    id: "m3u-url-input",
    placeholder: "https://exemplo.com/lista.m3u",
    value: m3uUrl,
    onChange: e => setM3uUrl(e.target.value),
    disabled: loading
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadChannels,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm me-2"
  }), "Importando...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-box-arrow-in-down me-2"
  }), "Importar canais")))), /*#__PURE__*/React.createElement("div", {
    className: "mb-3 search-container"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "channel-search",
    className: "form-label"
  }, "Adicionar canal da base de dados"), /*#__PURE__*/React.createElement("div", {
    className: "position-relative"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "channel-search",
    className: "form-control",
    placeholder: "Digite o nome do canal...",
    value: searchTerm,
    onChange: e => searchChannels(e.target.value),
    onFocus: () => searchTerm && setShowSearchResults(true)
  }), showSearchResults && searchResults.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dropdown-menu show w-100 mt-1",
    style: {
      maxHeight: "200px",
      overflowY: "auto",
      zIndex: 1000
    }
  }, searchResults.map((result, index) => /*#__PURE__*/React.createElement("button", {
    key: index,
    type: "button",
    className: "dropdown-item text-wrap",
    onClick: () => selectSearchResult(result.item)
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex justify-content-between align-items-start"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "m-0"
  }, result.item.nome, " (", result.item.listaNome, ")"), result.item.nome_grupo && /*#__PURE__*/React.createElement("small", {
    className: "text-muted d-block"
  }, "Grupo: ", result.item.nome_grupo), result.item.id_canal && /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "ID: ", result.item.id_canal)), /*#__PURE__*/React.createElement("small", {
    className: "text-success ms-2"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-plus-circle"
  })))))), showSearchResults && searchResults.length === 0 && searchTerm && /*#__PURE__*/React.createElement("div", {
    className: "dropdown-menu show w-100 mt-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "dropdown-item text-muted"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-search me-2"
  }), "Nenhum canal encontrado")))), status && /*#__PURE__*/React.createElement("div", {
    className: `alert ${status.includes("sucesso") ? "alert-success" : "alert-info"} mb-0`
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi ${status.includes("sucesso") ? "bi-check-circle" : "bi-info-circle"} me-2`
  }), status))), /*#__PURE__*/React.createElement("div", {
    className: "card section-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-pencil"
  }), " Editar Lista"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark"
  }, channels.length, " canais")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "input-group mb-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "input-group-text"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-search"
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Filtrar canais da lista...",
    value: filterTerm,
    onChange: e => setFilterTerm(e.target.value)
  }), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-danger",
    onClick: clearChannels
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-trash me-1"
  }), " Limpar lista")), /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-hover table-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    width: "40px"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    onChange: e => toggleSelectAll(e.target.checked),
    checked: paginatedChannels.length > 0 && selectedChannels.size === paginatedChannels.length
  })), /*#__PURE__*/React.createElement("th", {
    width: "70px"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center justify-content-between gap-1"
  }, /*#__PURE__*/React.createElement("span", null, "N\xBA"), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-outline-secondary border-0 p-1",
    onClick: toggleSortOrder,
    title: getSortTooltip()
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi ${getSortIcon()} text-primary`
  })))), /*#__PURE__*/React.createElement("th", {
    width: "60px"
  }, "Logo"), /*#__PURE__*/React.createElement("th", null, "Nome"), /*#__PURE__*/React.createElement("th", null, "ID"), /*#__PURE__*/React.createElement("th", null, "Grupo"), /*#__PURE__*/React.createElement("th", null, "URL"), /*#__PURE__*/React.createElement("th", {
    width: "100px",
    className: "text-center"
  }, "A\xE7\xF5es"))), /*#__PURE__*/React.createElement("tbody", null, paginatedChannels.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "text-center text-muted"
  }, channels.length === 0 ? "Carregue uma lista ou adicione novos canais" : "Nenhum canal encontrado com o filtro atual")) : paginatedChannels.map(channel => /*#__PURE__*/React.createElement(ChannelRow, {
    key: channel.id,
    channel: channel,
    selected: selectedChannels.has(channel.id),
    onToggleSelection: () => toggleChannelSelection(channel.id),
    onEdit: () => editChannel(channel),
    onDelete: () => deleteChannel(channel)
  }))))), totalPages > 1 && /*#__PURE__*/React.createElement("nav", {
    "aria-label": "Navega\xE7\xE3o de canais",
    className: "mt-3"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "pagination justify-content-center"
  }, /*#__PURE__*/React.createElement("li", {
    className: `page-item ${currentPage === 1 ? "disabled" : ""}`
  }, /*#__PURE__*/React.createElement("button", {
    className: "page-link",
    onClick: goToPrevPage,
    disabled: currentPage === 1
  }, "Anterior")), /*#__PURE__*/React.createElement("li", {
    className: "page-item"
  }, /*#__PURE__*/React.createElement("span", {
    className: "page-text"
  }, "P\xE1gina ", currentPage, " de ", totalPages)), /*#__PURE__*/React.createElement("li", {
    className: `page-item ${currentPage === totalPages ? "disabled" : ""}`
  }, /*#__PURE__*/React.createElement("button", {
    className: "page-link",
    onClick: goToNextPage,
    disabled: currentPage === totalPages
  }, "Pr\xF3xima")))))), /*#__PURE__*/React.createElement(EditChannelModal, {
    show: showEditModal,
    channel: editingChannel,
    onHide: () => setShowEditModal(false),
    onSave: saveChannelChanges
  }));
}

// Componente para cada linha da tabela de canais (mantido igual)
function ChannelRow({
  channel,
  selected,
  onToggleSelection,
  onEdit,
  onDelete
}) {
  return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: selected,
    onChange: onToggleSelection
  })), /*#__PURE__*/React.createElement("td", null, channel.numero_canal || ""), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("img", {
    src: channel.logo_url || "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjZGRkIi8+Cjx0ZXh0IHg9IjIwIiB5PSIyMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gTG9nbzwvdGV4dD4KPC9zdmc+",
    alt: "Logo",
    className: "channel-logo"
  })), /*#__PURE__*/React.createElement("td", null, channel.nome), /*#__PURE__*/React.createElement("td", null, channel.id_canal || ""), /*#__PURE__*/React.createElement("td", null, channel.nome_grupo || ""), /*#__PURE__*/React.createElement("td", {
    className: "text-truncate",
    style: {
      maxWidth: "200px"
    },
    title: channel.url
  }, channel.url), /*#__PURE__*/React.createElement("td", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-outline-primary me-1",
    onClick: onEdit,
    title: "Editar canal"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-pencil"
  })), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-outline-danger",
    onClick: onDelete
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-trash"
  }))));
}

// Parser M3U (mantido igual)
function parseM3U(content) {
  const lines = content.split("\n");
  const channels = [];
  let currentChannel = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith("#EXTINF:")) {
      currentChannel = parseExtInf(trimmed);
    } else if (!trimmed.startsWith("#") && currentChannel) {
      currentChannel.url = trimmed;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  return {
    tvgUrls: [],
    channels
  };
}
function parseExtInf(line) {
  const uniqueId = crypto.randomUUID();
  const channel = {
    id: uniqueId,
    numero_canal: "",
    nome: "",
    nome_grupo: "",
    url: "",
    logo_url: "",
    id_canal: "",
    selected: false
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
}