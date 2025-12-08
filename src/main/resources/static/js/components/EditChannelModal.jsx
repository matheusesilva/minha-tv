function EditChannelModal({ show, channel, onHide, onSave }) {
  const [formData, setFormData] = React.useState({
    nome: "",
    numero_canal: "",
    id_canal: "",
    nome_grupo: "",
    url: "",
    logo_url: "",
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
        logo_url: channel.logo_url || "",
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
      logo_url: "",
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
      const response = await fetch(
        `/api/xmltv/buscar_canal?q=${encodeURIComponent(formData.nome)}&limit=20`,
      );
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
  const selectIdSuggestion = (suggestion) => {
    setFormData((prev) => ({
      ...prev,
      id_canal: suggestion.canal_id || suggestion.id_canal,
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
      const response = await fetch(
        `/api/images/buscar?q=${encodeURIComponent(formData.nome)}&limit=20`,
      );
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
  const selectLogo = (logoUrl) => {
    setFormData((prev) => ({
      ...prev,
      logo_url: logoUrl,
    }));
    setShowLogoGrid(false);
  };

  // Handler para mudanças no form
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!show) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex="-1"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered m-auto">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Editar Canal</h5>
            <button
              type="button"
              className="btn-close"
              onClick={handleClose}
            ></button>
          </div>
          <div className="modal-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label">Nome do Canal *</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Nome do canal"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Número do Canal</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.numero_canal}
                  onChange={(e) =>
                    handleInputChange("numero_canal", e.target.value)
                  }
                  placeholder="Número"
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">ID EPG</label>
                <div className="input-group">
                  <input
                    type="text"
                    className="form-control"
                    value={formData.id_canal}
                    onChange={(e) =>
                      handleInputChange("id_canal", e.target.value)
                    }
                    placeholder="ID do EPG"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={searchIdSuggestions}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="bi bi-search"></i>
                    )}
                  </button>
                </div>
                {/* Dropdown de sugestões de ID */}
                {showIdSuggestions && idSuggestions.length > 0 && (
                  <div
                    className="dropdown-menu show w-100 mt-1"
                    style={{
                      maxHeight: "200px",
                      overflowY: "auto",
                      zIndex: 1000,
                    }}
                  >
                    {idSuggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        className="dropdown-item text-wrap"
                        onClick={() => selectIdSuggestion(suggestion)}
                      >
                        <p className="m-0">
                          {suggestion.nome} ({suggestion.arquivo})
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label">Grupo</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.nome_grupo}
                  onChange={(e) =>
                    handleInputChange("nome_grupo", e.target.value)
                  }
                  placeholder="Grupo do canal"
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">URL do Stream</label>
                <input
                  type="url"
                  className="form-control"
                  value={formData.url}
                  onChange={(e) => handleInputChange("url", e.target.value)}
                  placeholder="https://exemplo.com/stream.m3u8"
                />
              </div>
              <div className="col-12 mb-3">
                <label className="form-label">Logo do Canal</label>
                <div className="d-flex align-items-center mb-2">
                  <img
                    src={formData.logo_url || "/assets/placeholder-logo.png"}
                    alt="Logo preview"
                    className="logo-preview me-3"
                    style={{
                      width: "60px",
                      height: "60px",
                      objectFit: "contain",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={searchLogoImages}
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner-border spinner-border-sm me-1"></span>
                    ) : (
                      <i className="bi bi-image me-1"></i>
                    )}
                    Buscar Logos
                  </button>
                  <input
                    type="text"
                    className="form-control ms-2"
                    value={formData.logo_url}
                    onChange={(e) =>
                      handleInputChange("logo_url", e.target.value)
                    }
                    placeholder="URL do logo"
                  />
                </div>
                {/* Grid de imagens */}
                {showLogoGrid && logoImages.length > 0 && (
                  <div className="border rounded p-3 mt-2">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted">Selecione um logo:</small>
                      <button
                        type="button"
                        className="btn-close btn-sm"
                        onClick={() => setShowLogoGrid(false)}
                      ></button>
                    </div>
                    <div className="row row-cols-4 g-2">
                      {logoImages.map((image, index) => (
                        <div key={index} className="col">
                          <img
                            src={image.url || image}
                            alt={`Logo ${index}`}
                            className="img-fluid img-thumbnail cursor-pointer"
                            style={{
                              cursor: "pointer",
                              height: "60px",
                              objectFit: "contain",
                            }}
                            onClick={() => selectLogo(image.url || image)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
