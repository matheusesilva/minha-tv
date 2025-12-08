function DatabaseTab() {
  const [sources, setSources] = React.useState({
    listas: [],
    epgs: [],
    repositorios_img: [],
  });

  const [dbStatus, setDbStatus] = React.useState({
    num_canais: 0,
    num_canais_xmltv: 0,
    num_logos_canais: 0,
    num_logos_xmltv: 0,
    num_images_repos: 0,
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
          repositorios_img: data.repositorios_img || [],
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
    const urls = sourceUrl
      .split("\n")
      .map((url) => url.trim())
      .filter((url) => url !== "");

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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
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
    if (
      !confirm(
        `Tem certeza que deseja excluir "${sourceName}"?\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: source.URL || source.url }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Fonte deletada com sucesso:", result);

        // Recarregar status para atualizar a lista
        await loadDBStatus();

        alert(`"${sourceName}" foi excluído com sucesso!`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Erro ${response.status}: ${response.statusText}`,
        );
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

  return (
    <div>
      {/* Indicadores */}
      <div className="row mb-4 text-center">
        <div className="col">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="text-muted">Canais</h6>
              <h4>{dbStatus.num_canais || 0}</h4>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="text-muted">Programação</h6>
              <h4>{dbStatus.num_canais_xmltv || 0}</h4>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h6 className="text-muted">Logos</h6>
              <h4>
                {(dbStatus.num_logos_canais || 0) +
                  (dbStatus.num_logos_xmltv || 0) +
                  (dbStatus.num_images_repos || 0)}
              </h4>
            </div>
          </div>
        </div>
      </div>

      {/* Input para carregar fontes */}
      <div className="input-group mb-4">
        <input
          type="text"
          className="form-control"
          placeholder="Cole o link aqui..."
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          disabled={loading}
        />
        <select
          className="form-select"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          disabled={loading}
        >
          <option value="m3u">Lista M3U</option>
          <option value="epg">Guia EPG (XMLTV)</option>
          <option value="images">Repositório de Imagens</option>
        </select>
        <button
          className="btn btn-primary"
          onClick={loadUrls}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Carregando...
            </>
          ) : (
            <>
              <i className="bi bi-cloud-upload me-2"></i>
              Carregar
            </>
          )}
        </button>
      </div>

      {/* Lista de fontes */}
      <div className="card section-card">
        <div className="card-header section-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-collection"></i> Fontes Carregadas
          </h5>
          <div>
            <span className="badge bg-light text-dark me-2">
              Listas: {sources.listas.length}
            </span>
            <span className="badge bg-light text-dark me-2">
              EPGs: {sources.epgs.length}
            </span>
            <span className="badge bg-light text-dark">
              Repositórios: {sources.repositorios_img.length}
            </span>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-sm">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th className="text-center">Nº Canais</th>
                  <th>Link</th>
                  <th width="100px" className="text-center">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {sources.listas.length === 0 &&
                sources.epgs.length === 0 &&
                sources.repositorios_img.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Nenhuma fonte carregada
                    </td>
                  </tr>
                ) : (
                  <>
                    {sources.listas.map((lista, index) => (
                      <SourceRow
                        key={`lista-${index}`}
                        source={lista}
                        type="M3U"
                        onDelete={() => deleteSource(lista, "M3U")}
                        isDeleting={
                          deleting === `M3U-${lista.URL || lista.url}`
                        }
                      />
                    ))}
                    {sources.epgs.map((epg, index) => (
                      <SourceRow
                        key={`epg-${index}`}
                        source={epg}
                        type="EPG"
                        onDelete={() => deleteSource(epg, "EPG")}
                        isDeleting={deleting === `EPG-${epg.URL || epg.url}`}
                      />
                    ))}
                    {sources.repositorios_img.map((repo, index) => (
                      <SourceRow
                        key={`repo-${index}`}
                        source={repo}
                        type="Logos"
                        onDelete={() => deleteSource(repo, "Logos")}
                        isDeleting={
                          deleting === `Logos-${repo.URL || repo.url}`
                        }
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente SourceRow atualizado com estado de loading
function SourceRow({ source, type, onDelete, isDeleting }) {
  return (
    <tr>
      <td>
        <div className="d-flex align-items-center">
          {source.NOME || source.nome || "(sem nome)"}
          {isDeleting && (
            <span className="badge bg-warning ms-2">Excluindo...</span>
          )}
        </div>
      </td>
      <td>
        <span
          className={`badge ${
            type === "M3U"
              ? "bg-primary"
              : type === "EPG"
                ? "bg-success"
                : "bg-info"
          }`}
        >
          {type}
        </span>
      </td>
      <td className="text-center">{source.CANAIS || source.canais || "-"}</td>
      <td
        className="text-truncate"
        style={{ maxWidth: "300px" }}
        title={source.URL || source.url}
      >
        {source.URL || source.url}
      </td>
      <td className="text-center">
        <button
          className="btn btn-sm btn-outline-danger"
          onClick={onDelete}
          disabled={isDeleting}
          title={isDeleting ? "Excluindo..." : `Excluir ${type}`}
        >
          {isDeleting ? (
            <span
              className="spinner-border spinner-border-sm"
              style={{ width: "1rem", height: "1rem" }}
            ></span>
          ) : (
            <i className="bi bi-trash"></i>
          )}
        </button>
      </td>
    </tr>
  );
}
