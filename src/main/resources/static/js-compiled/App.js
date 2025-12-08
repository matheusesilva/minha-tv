function App() {
  const [activeTab, setActiveTab] = React.useState("database");
  return /*#__PURE__*/React.createElement("div", {
    className: "App"
  }, /*#__PURE__*/React.createElement("header", {
    className: "header py-3 mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "container-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex justify-content-between align-items-center px-3"
  }, /*#__PURE__*/React.createElement("h1", {
    className: "h3 mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-tv"
  }), " Minha IPTV"), /*#__PURE__*/React.createElement("span", {
    className: "badge bg-light text-dark"
  }, "v1.0")))), /*#__PURE__*/React.createElement("div", {
    className: "container-lg"
  }, /*#__PURE__*/React.createElement("ul", {
    className: "nav nav-tabs"
  }, /*#__PURE__*/React.createElement("li", {
    className: "nav-item"
  }, /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${activeTab === "database" ? "active" : ""}`,
    onClick: () => setActiveTab("database")
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-database-fill"
  }), " Base de Dados")), /*#__PURE__*/React.createElement("li", {
    className: "nav-item"
  }, /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${activeTab === "customization" ? "active" : ""}`,
    onClick: () => setActiveTab("customization")
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-wrench-adjustable"
  }), " Customizar Lista")), /*#__PURE__*/React.createElement("li", {
    className: "nav-item"
  }, /*#__PURE__*/React.createElement("button", {
    className: `nav-link ${activeTab === "export" ? "active" : ""}`,
    onClick: () => setActiveTab("export")
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-box-arrow-up"
  }), " Exportar"))), /*#__PURE__*/React.createElement("div", {
    className: "tab-content p-3 border border-top-0 rounded-bottom"
  }, activeTab === "database" && /*#__PURE__*/React.createElement(DatabaseTab, null), activeTab === "customization" && /*#__PURE__*/React.createElement(CustomizationTab, null), activeTab === "export" && /*#__PURE__*/React.createElement(ExportTab, null))));
}