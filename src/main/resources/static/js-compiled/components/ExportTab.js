function ExportTab() {
  const [filename, setFilename] = React.useState("minha_lista");
  const [githubUsername, setGithubUsername] = React.useState("");
  const [githubToken, setGithubToken] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Obter canais do localStorage
  const getChannels = () => {
    const cachedChannels = localStorage.getItem("iptv_channels");
    return cachedChannels ? JSON.parse(cachedChannels) : [];
  };

  // Calcular estatísticas
  const getStats = () => {
    const channels = getChannels();
    return {
      totalChannels: channels.length,
      totalGroups: [...new Set(channels.map(c => c.nome_grupo).filter(Boolean))].length,
      withLogos: channels.filter(c => c.logo_url).length,
      withEpgId: channels.filter(c => c.id_canal).length,
      hasChannels: channels.length > 0
    };
  };
  const stats = getStats();

  // Download da lista M3U
  const downloadM3U = async () => {
    if (!stats.hasChannels) {
      alert("Nenhum canal disponível para exportar.");
      return;
    }
    setLoading(true);
    setStatus("Exportando lista M3U...");
    try {
      // Buscar EPGs para os canais
      const channels = getChannels();
      const channelIds = channels.map(c => c.id_canal).filter(Boolean);
      let epgUrls = [];
      if (channelIds.length > 0) {
        const response = await fetch("api/xmltv/buscar_id", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ids: channelIds
          })
        });
        if (response.ok) {
          const data = await response.json();
          epgUrls = data.map(epg => epg.URL || epg.url);
        }
      }

      // Montar conteúdo M3U
      let m3uContent = "#EXTM3U\n";

      // Adicionar tvg-url se houver EPGs
      if (epgUrls.length > 0) {
        m3uContent = `#EXTM3U tvg-url="${epgUrls.join(",")}"\n`;
      }

      // Adicionar canais
      channels.forEach(channel => {
        m3uContent += `#EXTINF:-1 tvg-id="${channel.id_canal || ""}" tvg-chno="${channel.numero_canal || ""}" tvg-logo="${channel.logo_url || ""}" group-title="${channel.nome_grupo || ""}",${channel.nome}\n${channel.url}\n`;
      });

      // Criar arquivo para download
      const blob = new Blob([m3uContent], {
        type: "audio/x-mpegurl"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}.m3u`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus("✅ Lista M3U exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar M3U:", error);
      setStatus("❌ Erro ao exportar a lista M3U");
    } finally {
      setLoading(false);
    }
  };

  // Upload para Gist
  const uploadToGist = async () => {
    if (!stats.hasChannels) {
      alert("Nenhum canal disponível para exportar.");
      return;
    }
    if (!githubUsername || !githubToken) {
      alert("Por favor, preencha usuário e token do GitHub.");
      return;
    }
    setLoading(true);
    setStatus("Enviando para Gist...");
    try {
      // Montar conteúdo M3U
      const channels = getChannels();
      let m3uContent = "#EXTM3U\n";
      channels.forEach(channel => {
        m3uContent += `#EXTINF:-1 tvg-id="${channel.id_canal || ""}" tvg-chno="${channel.numero_canal || ""}" tvg-logo="${channel.logo_url || ""}" group-title="${channel.nome_grupo || ""}",${channel.nome}\n${channel.url}\n`;
      });

      // Criar Gist
      const gistData = {
        description: `Lista IPTV - ${new Date().toLocaleDateString()}`,
        public: false,
        files: {
          [`${filename}.m3u`]: {
            content: m3uContent
          }
        }
      };
      const response = await fetch("https://api.github.com/gists", {
        method: "POST",
        headers: {
          Authorization: `token ${githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json"
        },
        body: JSON.stringify(gistData)
      });
      if (response.ok) {
        const result = await response.json();
        setStatus(`✅ Gist criado com sucesso! URL: ${result.html_url}`);

        // Limpar campos sensíveis
        setGithubToken("");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar Gist");
      }
    } catch (error) {
      console.error("Erro ao criar Gist:", error);
      setStatus(`❌ Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Exportar Config JSON
  const exportConfigJSON = () => {
    if (!stats.hasChannels) {
      alert("Nenhum canal disponível para exportar.");
      return;
    }
    try {
      // Criar estrutura de configuração
      const channels = getChannels();
      const config = {
        version: "1.0",
        exportDate: new Date().toISOString(),
        totalChannels: channels.length,
        channels: channels.map(channel => ({
          id: channel.id,
          name: channel.nome,
          number: channel.numero_canal,
          group: channel.nome_grupo,
          logo: channel.logo_url,
          tvgId: channel.id_canal,
          url: channel.url
        })),
        groups: [...new Set(channels.map(c => c.nome_grupo).filter(Boolean))]
      };

      // Criar arquivo para download
      const blob = new Blob([JSON.stringify(config, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${filename}_config.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setStatus("✅ Configuração JSON exportada com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar JSON:", error);
      setStatus("❌ Erro ao exportar configuração JSON");
    }
  };
  return /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "card section-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-graph-up me-2"
  }), "Estat\xEDsticas da Lista")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row text-center mb-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border rounded p-2 bg-light"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-primary mb-1"
  }, stats.totalChannels), /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "Total de Canais"))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border rounded p-2 bg-light"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-success mb-1"
  }, stats.totalGroups), /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "Grupos"))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border rounded p-2 bg-light"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-warning mb-1"
  }, stats.withLogos), /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "Com Logo"))), /*#__PURE__*/React.createElement("div", {
    className: "col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "border rounded p-2 bg-light"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-info mb-1"
  }, stats.withEpgId), /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, "Com ID EPG")))), status && /*#__PURE__*/React.createElement("div", {
    className: `alert ${status.includes("✅") ? "alert-success" : status.includes("❌") ? "alert-danger" : "alert-info"} mb-0`
  }, /*#__PURE__*/React.createElement("div", {
    className: "d-flex align-items-center"
  }, /*#__PURE__*/React.createElement("i", {
    className: `bi ${status.includes("✅") ? "bi-check-circle-fill" : status.includes("❌") ? "bi-exclamation-circle-fill" : "bi-info-circle-fill"} me-2`
  }), /*#__PURE__*/React.createElement("span", null, status))), !stats.hasChannels && /*#__PURE__*/React.createElement("div", {
    className: "alert alert-warning mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-exclamation-triangle me-2"
  }), "Nenhum canal encontrado. Adicione canais na aba \"Customizar Lista\" primeiro."))), /*#__PURE__*/React.createElement("div", {
    className: "card section-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-download"
  }), " Exportar M3U")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row align-items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "m3u-filename",
    className: "form-label"
  }, "Nome do arquivo"), /*#__PURE__*/React.createElement("div", {
    className: "input-group"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "m3u-filename",
    className: "form-control",
    placeholder: "minha_lista",
    value: filename,
    onChange: e => setFilename(e.target.value)
  }), /*#__PURE__*/React.createElement("span", {
    className: "input-group-text"
  }, ".m3u"))), /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn btn-success w-100",
    onClick: downloadM3U,
    disabled: loading || !stats.hasChannels
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm me-2"
  }), "Exportando...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-cloud-download me-2"
  }), "Download M3U")))))), /*#__PURE__*/React.createElement("div", {
    className: "card section-card mb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-github"
  }), " Upload para Gist")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "row"
  }, /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "github-username",
    className: "form-label"
  }, "Usu\xE1rio GitHub"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    id: "github-username",
    className: "form-control",
    value: githubUsername,
    onChange: e => setGithubUsername(e.target.value),
    placeholder: "seu-usuario"
  })), /*#__PURE__*/React.createElement("div", {
    className: "col-md-6 mb-3"
  }, /*#__PURE__*/React.createElement("label", {
    htmlFor: "github-token",
    className: "form-label"
  }, "Token de Acesso"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    id: "github-token",
    className: "form-control",
    value: githubToken,
    onChange: e => setGithubToken(e.target.value),
    placeholder: "ghp_xxxxxxxx"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "mb-3"
  }, /*#__PURE__*/React.createElement("small", {
    className: "text-muted"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-info-circle me-1"
  }), "Crie um token em GitHub Settings \u2192 Developer settings \u2192 Personal access tokens")), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-dark",
    onClick: uploadToGist,
    disabled: loading || !githubUsername || !githubToken || !stats.hasChannels
  }, loading ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "spinner-border spinner-border-sm me-2"
  }), "Enviando...") : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-cloud-upload me-2"
  }), "Upload para Gist")))), /*#__PURE__*/React.createElement("div", {
    className: "card section-card"
  }, /*#__PURE__*/React.createElement("div", {
    className: "card-header section-header"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "mb-0"
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-filetype-json"
  }), " Exportar Config JSON")), /*#__PURE__*/React.createElement("div", {
    className: "card-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-muted mb-3"
  }, "Exporte a configura\xE7\xE3o completa da sua lista em formato JSON para backup ou migra\xE7\xE3o."), /*#__PURE__*/React.createElement("button", {
    className: "btn btn-primary",
    onClick: exportConfigJSON,
    disabled: !stats.hasChannels
  }, /*#__PURE__*/React.createElement("i", {
    className: "bi bi-file-earmark-arrow-down me-2"
  }), "Baixar config.json"))));
}