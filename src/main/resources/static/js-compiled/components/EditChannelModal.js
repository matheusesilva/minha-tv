function EditChannelModal({
  show,
  channel,
  onHide,
  onSave
}) {
  const [formData, setFormData] = React.useState({
    nome: "",
    numero_canal: "",
    id_canal: "",
    nome_grupo: "",
    url: "",
    logo_url: ""
  });
  const [idSuggestions, setIdSuggestions] = React.useState([]);
  const [showIdSuggestions, setShowIdSuggestions] = React.useState(false);
  const [logoImages, setLogoImages] = React.useState([]);
  const [showLogoGrid, setShowLogoGrid] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  // Atualizar formData quando o canal mudar
  React.useEffect(() => {
    if (channel) {
      setFormData({
        nome: channel.nome || "",
        numero_canal: channel.numero_canal || "",
        id_canal: channel.id_canal || "",
        nome_grupo: channel.nome_grupo || "",
        url: channel.url || "",
        logo_url: channel.logo_url || ""
      });
    }
  }, [channel]);

  // Fechar modal
  const handleClose = () => {
    setFormData({
      nome: "",
      numero_canal: "",
      id_canal: "",
      nome_grupo: "",
      url: "",
      logo_url: ""
    });
    setIdSuggestions([]);
    setShowIdSuggestions(false);
    setLogoImages([]);
    setShowLogoGrid(false);
    onHide();
  };

  // Salvar alterações
  const handleSave = () => {
    if (!formData.nome.trim()) {
      alert("O nome do canal é obrigatório.");
      return;
    }
    onSave(formData);
    handleClose();
  };

  // Buscar sugestões de ID
  const searchIdSuggestions = async () => {
    if (!formData.nome.trim()) {
      alert("Informe o nome do canal primeiro.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/xmltv/buscar_canal?q=${encodeURIComponent(formData.nome)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setIdSuggestions(data);
        setShowIdSuggestions(true);
      }
    } catch (error) {
      console.error("Erro ao buscar sugestões:", error);
    } finally {
      setLoading(false);
    }
  };

  // Selecionar sugestão de ID
  const selectIdSuggestion = suggestion => {
    setFormData(prev => ({
      ...prev,
      id_canal: suggestion.canal_id || suggestion.id_canal
    }));
    setShowIdSuggestions(false);
    setIdSuggestions([]);
  };

  // Buscar imagens para logo
  const searchLogoImages = async () => {
    if (!formData.nome.trim()) {
      alert("Informe o nome do canal primeiro.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/images/buscar?q=${encodeURIComponent(formData.nome)}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setLogoImages(data);
        setShowLogoGrid(true);
      }
    } catch (error) {
      console.error("Erro ao buscar imagens:", error);
    } finally {
      setLoading(false);
    }
  };

  // Selecionar logo
  const selectLogo = logoUrl => {
    setFormData(prev => ({
      ...prev,
      logo_url: logoUrl
    }));
    setShowLogoGrid(false);
  };

  // Handler para mudanças no form
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  if (!show) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "modal fade show d-block",
    tabIndex: "-1",
    style: {
      backgroundColor: "rgba(0,0,0,0.5)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-dialog modal-lg modal-dialog-centered m-auto"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-content"
  }, /*#__PURE__*/React.createElement("div", {
    className: "modal-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "modal-title"
  }, "Editar Canal"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close",
    onClick: handleClose
  })), /*#__PURE__*/React.createElement("div", {
    className: "modal-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Nome do Canal *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: formData.nome,
    onChange: e => handleInputChange("nome", e.target.value),
    placeholder: "Nome do canal"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "N\xFAmero do Canal"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    className: "form-control",
    value: formData.numero_canal,
    onChange: e => handleInputChange("numero_canal", e.target.value),
    placeholder: "N\xFAmero"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "ID EPG"), /*#__PURE__*/React.createElement("div", {
    className: "input-group"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: formData.id_canal,
    onChange: e => handleInputChange("id_canal", e.target.value),
    placeholder: "ID do EPG"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary",
    onClick: searchIdSuggestions,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm"
  }) : /*#__PURE__*/React.createElement("i", {
    className: "bi bi-search"
  }))), showIdSuggestions && idSuggestions.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "dropdown-menu show w-100 mt-1",
    style: {
      maxHeight: "200px",
      overflowY: "auto",
      zIndex: 1000
    }
  }, idSuggestions.map((suggestion, index) => /*#__PURE__*/React.createElement("button", {
    key: index,
    type: "button",
    className: "dropdown-item text-wrap",
    onClick: () => selectIdSuggestion(suggestion)
  }, /*#__PURE__*/React.createElement("p", {
    className: "m-0"
  }, suggestion.nome, " (", suggestion.arquivo, ")"))))), /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Grupo"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control",
    value: formData.nome_grupo,
    onChange: e => handleInputChange("nome_grupo", e.target.value),
    placeholder: "Grupo do canal"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-12 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "URL do Stream"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    className: "form-control",
    value: formData.url,
    onChange: e => handleInputChange("url", e.target.value),
    placeholder: "https://exemplo.com/stream.m3u8"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-12 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "form-label"
  }, "Logo do Canal"), /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center mb-2"
  }, /*#__PURE__*/React.createElement("img", {
    src: formData.logo_url || "/assets/placeholder-logo.png",
    alt: "Logo preview",
    className: "logo-preview me-3",
    style: {
      width: "60px",
      height: "60px",
      objectFit: "contain",
      border: "1px solid #dee2e6",
      borderRadius: "4px"
    }
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-outline-secondary btn-sm",
    onClick: searchLogoImages,
    disabled: loading
  }, loading ? /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm me-1"
  }) : /*#__PURE__*/React.createElement("i", {
    className: "bi bi-image me-1"
  }), "Buscar Logos"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    className: "form-control ms-2",
    value: formData.logo_url,
    onChange: e => handleInputChange("logo_url", e.target.value),
    placeholder: "URL do logo"
  })), showLogoGrid && logoImages.length > 0 && /*#__PURE__*/React.createElement("div", {
    className: "border rounded p-3 mt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex justify-content-between align-items-center mb-2"
  }, /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "Selecione um logo:"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn-close btn-sm",
    onClick: () => setShowLogoGrid(false)
  })), /*#__PURE__*/React.createElement("div", {
    className: "row row-cols-4 g-2"
  }, logoImages.map((image, index) => /*#__PURE__*/React.createElement("div", {
    key: index,
    className: "col"
  }, /*#__PURE__*/React.createElement("img", {
    src: image.url || image,
    alt: `Logo ${index}`,
    className: "img-fluid img-thumbnail cursor-pointer",
    style: {
      cursor: "pointer",
      height: "60px",
      objectFit: "contain"
    },
    onClick: () => selectLogo(image.url || image)
  })))))))), /*#__PURE__*/React.createElement("div", {
    className: "modal-footer"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: handleClose
  }, "Cancelar"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: handleSave
  }, "Salvar Altera\xE7\xF5es")))));
}