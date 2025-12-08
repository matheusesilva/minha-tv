function DatabaseTab() {
  const [sources, setSources] = React.useState({
    listas: [],
    epgs: [],
    repositorios_img: []
  });
  const [dbStatus, setDbStatus] = React.useState({
    num_canais: 0,
    num_canais_xmltv: 0,
    num_logos_canais: 0,
    num_logos_xmltv: 0,
    num_images_repos: 0
  });
  const [sourceType, setSourceType] = React.useState("m3u");
  const [sourceUrl, setSourceUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null); // Controla qual item está sendo deletado

  // Carregar status do DB
  const loadDBStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/status/db_status");
      if (response.ok) {
        const data = await response.json();
        console.log("Dados recebidos:", data);
        setDbStatus(data);
        setSources({
          listas: data.listas || [],
          epgs: data.epgs || [],
          repositorios_img: data.repositorios_img || []
        });
      }
    } catch (error) {
      console.error("Erro ao carregar status:", error);
      alert("Erro ao carregar status do banco de dados.");
    } finally {
      setLoading(false);
    }
  };

  // Carregar URLs
  const loadUrls = async () => {
    const urls = sourceUrl.split("\n").map(url => url.trim()).filter(url => url !== "");
    if (urls.length === 0) {
      alert("Por favor, insira pelo menos uma URL.");
      return;
    }
    let endpoint;
    switch (sourceType) {
      case "m3u":
        endpoint = "m3u/upload";
        break;
      case "epg":
        endpoint = "xmltv/upload";
        break;
      case "images":
        endpoint = "images/upload";
        break;
      default:
        return;
    }
    try {
      setLoading(true);
      const response = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          urls
        })
      });
      if (response.ok) {
        await loadDBStatus();
        setSourceUrl("");
        alert("URLs carregadas com sucesso!");
      } else {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao carregar URLs:", error);
      alert("Erro ao carregar URLs: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Deletar fonte
  const deleteSource = async (source, type) => {
    const sourceName = source.NOME || source.nome || "esta fonte";
    if (!confirm(`Tem certeza que deseja excluir "${sourceName}"?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    // Identificador único para o item sendo deletado
    const deleteId = `${type}-${source.URL || source.url}`;
    setDeleting(deleteId);
    try {
      let endpoint = "";
      switch (type) {
        case "M3U":
          endpoint = "m3u/lista";
          break;
        case "EPG":
          endpoint = "xmltv/epg";
          break;
        case "Logos":
          endpoint = "images/repositorio";
          break;
        default:
          return;
      }
      const response = await fetch(`/api/${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: source.URL || source.url
        })
      });
      if (response.ok) {
        const result = await response.json();
        console.log("Fonte deletada com sucesso:", result);

        // Recarregar status para atualizar a lista
        await loadDBStatus();
        alert(`"${sourceName}" foi excluído com sucesso!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Erro ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Erro ao deletar fonte:", error);
      alert(`Erro ao excluir "${sourceName}": ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  // Carregar status ao montar o componente
  React.useEffect(() => {
    loadDBStatus();
  }, []);
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "row mb-4 text-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "text-muted"
  }, "Canais"), /*#__PURE__*/React.createElement("h4", null, dbStatus.num_canais || 0)))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "text-muted"
  }, "Programa\xE7\xE3o"), /*#__PURE__*/React.createElement("h4", null, dbStatus.num_canais_xmltv || 0)))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card shadow-sm border-0"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("h6", {
    className: "text-muted"
  }, "Logos"), /*#__PURE__*/React.createElement("h4", null, (dbStatus.num_logos_canais || 0) + (dbStatus.num_logos_xmltv || 0) + (dbStatus.num_images_repos || 0)))))), /*#__PURE__*/React.createElement("div", {
    className: "input-group mb-4"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    placeholder: "Cole o link aqui...",
    value: sourceUrl,
    onChange: e => setSourceUrl(e.target.value),
    disabled: loading
  }), /*#__PURE__*/React.createElement("select", {
    className: "form-select",
    value: sourceType,
    onChange: e => setSourceType(e.target.value),
    disabled: loading
  }, /*#__PURE__*/React.createElement("option", {
    value: "m3u"
  }, "Lista M3U"), /*#__PURE__*/React.createElement("option", {
    value: "epg"
  }, "Guia EPG (XMLTV)"), /*#__PURE__*/React.createElement("option", {
    value: "images"
  }, "Reposit\xF3rio de Imagens")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: loadUrls,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm me-2"
  }), "Carregando...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-cloud-upload me-2"
  }), "Carregar"))), /*#__PURE__*/React.createElement("div", {
    className: "card section-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header d-flex justify-content-between align-items-center"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-collection"
  }), " Fontes Carregadas"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark me-2"
  }, "Listas: ", sources.listas.length), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark me-2"
  }, "EPGs: ", sources.epgs.length), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark"
  }, "Reposit\xF3rios: ", sources.repositorios_img.length))), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "table-responsive"
  }, /*#__PURE__*/React.createElement("table", {
    className: "table table-hover table-sm"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Nome"), /*#__PURE__*/React.createElement("th", null, "Tipo"), /*#__PURE__*/React.createElement("th", {
    className: "text-center"
  }, "N\xBA Canais"), /*#__PURE__*/React.createElement("th", null, "Link"), /*#__PURE__*/React.createElement("th", {
    width: "100px",
    className: "text-center"
  }, "A\xE7\xF5es"))), /*#__PURE__*/React.createElement("tbody", null, sources.listas.length === 0 && sources.epgs.length === 0 && sources.repositorios_img.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "5",
    className: "text-center text-muted"
  }, "Nenhuma fonte carregada")) : /*#__PURE__*/React.createElement(React.Fragment, null, sources.listas.map((lista, index) => /*#__PURE__*/React.createElement(SourceRow, {
    key: `lista-${index}`,
    source: lista,
    type: "M3U",
    onDelete: () => deleteSource(lista, "M3U"),
    isDeleting: deleting === `M3U-${lista.URL || lista.url}`
  })), sources.epgs.map((epg, index) => /*#__PURE__*/React.createElement(SourceRow, {
    key: `epg-${index}`,
    source: epg,
    type: "EPG",
    onDelete: () => deleteSource(epg, "EPG"),
    isDeleting: deleting === `EPG-${epg.URL || epg.url}`
  })), sources.repositorios_img.map((repo, index) => /*#__PURE__*/React.createElement(SourceRow, {
    key: `repo-${index}`,
    source: repo,
    type: "Logos",
    onDelete: () => deleteSource(repo, "Logos"),
    isDeleting: deleting === `Logos-${repo.URL || repo.url}`
  })))))))));
}

// Componente SourceRow atualizado com estado de loading
function SourceRow({
  source,
  type,
  onDelete,
  isDeleting
}) {
  return /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center"
  }, source.NOME || source.nome || "(sem nome)", isDeleting && /*#__PURE__*/React.createElement("span", {
    className: "badge bg-warning ms-2"
  }, "Excluindo..."))), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
    className: `badge ${type === "M3U" ? "bg-primary" : type === "EPG" ? "bg-success" : "bg-info"}`
  }, type)), /*#__PURE__*/React.createElement("td", {
    className: "text-center"
  }, source.CANAIS || source.canais || "-"), /*#__PURE__*/React.createElement("td", {
    className: "text-truncate",
    style: {
      maxWidth: "300px"
    },
    title: source.URL || source.url
  }, source.URL || source.url), /*#__PURE__*/React.createElement("td", {
    className: "text-center"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-sm btn-outline-danger",
    onClick: onDelete,
    disabled: isDeleting,
    title: isDeleting ? "Excluindo..." : `Excluir ${type}`
  }, isDeleting ? /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm",
    style: {
      width: "1rem",
      height: "1rem"
    }
  }) : /*#__PURE__*/React.createElement("i", {
    className: "bi bi-trash"
  }))));
}