function App() {
  const [activeTab, setActiveTab] = React.useState("database");

  return (
    <div className="App">
      <header className="header py-3 mb-4">
        <div className="container-lg">
          <div className="d-flex justify-content-between align-items-center px-3">
            <h1 className="h3 mb-0">
              <i className="bi bi-tv"></i> Minha IPTV
            </h1>
            <span className="badge bg-light text-dark">v1.0</span>
          </div>
        </div>
      </header>

      <div className="container-lg">
        <ul className="nav nav-tabs">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "database" ? "active" : ""}`}
              onClick={() => setActiveTab("database")}
            >
              <i className="bi bi-database-fill"></i> Base de Dados
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "customization" ? "active" : ""}`}
              onClick={() => setActiveTab("customization")}
            >
              <i className="bi bi-wrench-adjustable"></i> Customizar Lista
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === "export" ? "active" : ""}`}
              onClick={() => setActiveTab("export")}
            >
              <i className="bi bi-box-arrow-up"></i> Exportar
            </button>
          </li>
        </ul>

        <div className="tab-content p-3 border border-top-0 rounded-bottom">
          {activeTab === "database" && <DatabaseTab />}
          {activeTab === "customization" && <CustomizationTab />}
          {activeTab === "export" && <ExportTab />}
        </div>
      </div>
    </div>
  );
}
