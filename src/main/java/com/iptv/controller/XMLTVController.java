package com.iptv.controller;

import com.iptv.model.dto.ChannelSearchRequest;
import com.iptv.model.dto.DeleteRequest;
import com.iptv.model.entity.Programa;
import com.iptv.model.dto.UploadRequest;
import com.iptv.util.FuzzySearch;
import com.iptv.util.XMLTVParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.web.bind.annotation.*;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.*;

import org.w3c.dom.*;

@RestController
@RequestMapping("/api/xmltv")
public class XMLTVController {

    private final XMLTVParser XMLTVParser = new XMLTVParser();
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private FuzzySearch fuzzySearch;

    @PostMapping("/upload")
    public Map<String, Object> uploadXmltv(@RequestBody UploadRequest request) {
        List<String> urls = request.getUrls();
        if (urls == null || urls.isEmpty()) {
            throw new IllegalArgumentException("É necessário enviar 'urls' como lista de URLs");
        }

        List<String> loaded = new ArrayList<>();
        int totalCanais = 0;
        int totalProgramas = 0;

        for (String url : urls) {
            try {
                Map<String, Object> parseResult = XMLTVParser.parseXmltvFromUrl(url);
                List<Map<String, Object>> canais = (List<Map<String, Object>>) parseResult.get("canais");
                List<Map<String, Object>> programas = (List<Map<String, Object>>) parseResult.get("programas");
                String arquivoNome = (String) parseResult.get("arquivoNome");

                // Insert EPG with GeneratedKeyHolder
                KeyHolder keyHolder = new GeneratedKeyHolder();
                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO epgs (nome, url, canais) VALUES (?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                    );
                    ps.setString(1, arquivoNome);
                    ps.setString(2, url);
                    ps.setInt(3, canais.size());
                    return ps;
                }, keyHolder);

                Long epgId = ((Number) keyHolder.getKeys().get("id")).longValue();

                // Insert channels with GeneratedKeyHolder
                Map<String, Long> channelMap = new HashMap<>();
                for (Map<String, Object> canal : canais) {
                    KeyHolder channelKeyHolder = new GeneratedKeyHolder();
                    jdbcTemplate.update(connection -> {
                        PreparedStatement ps = connection.prepareStatement(
                                "INSERT INTO canais_xmltv (channel_id, nome, logo_url, arquivo, epg_id) VALUES (?, ?, ?, ?, ?)",
                                Statement.RETURN_GENERATED_KEYS
                        );
                        ps.setString(1, (String) canal.get("channel_id"));
                        ps.setString(2, (String) canal.get("nome"));
                        ps.setString(3, (String) canal.get("logo_url"));
                        ps.setString(4, (String) canal.get("arquivo"));
                        ps.setLong(5, epgId);
                        return ps;
                    }, channelKeyHolder);

                    Long channelId = channelKeyHolder.getKey().longValue();
                    channelMap.put((String) canal.get("channel_id"), channelId);
                }
                totalCanais += canais.size();

                // Insert programs
                for (Map<String, Object> prog : programas) {
                    Long canalFk = channelMap.get(prog.get("channel_id"));
                    if (canalFk != null) {
                        jdbcTemplate.update("""
                            INSERT INTO programas (canal_id, inicio, fim, titulo, descricao)
                            VALUES (?, ?, ?, ?, ?)
                        """,
                                canalFk,
                                prog.get("inicio"),
                                prog.get("fim"),
                                prog.get("titulo"),
                                prog.get("descricao")
                        );
                    }
                }
                totalProgramas += programas.size();

                loaded.add(arquivoNome);

            } catch (Exception e) {
                System.err.println("Erro no parse/inserção XMLTV: " + e.getMessage());
            }
        }

        return Map.of(
                "message", "XMLTV carregado(s): " + loaded.size(),
                "arquivos", loaded,
                "total_canais", totalCanais,
                "total_programas", totalProgramas
        );
    }

    @GetMapping("/buscar_canal")
    public List<Map<String, Object>> buscarCanal(
            @RequestParam(value = "q", defaultValue = "") String termo,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {

        if (termo.trim().isEmpty()) {
            return List.of();
        }

        List<Map<String, Object>> canais = jdbcTemplate.queryForList(
                "SELECT channel_id, nome, arquivo FROM canais_xmltv"
        );

        if (canais.isEmpty()) {
            return List.of();
        }

        // Use fuzzy search
        List<FuzzySearch.SearchResult<Map<String, Object>>> results = fuzzySearch.fuzzySearch(
                canais, termo, limit, 2, canal -> (String) canal.get("nome")
        );

        return results.stream()
                .map(result -> {
                    Map<String, Object> canal = result.getItem();
                    Map<String, Object> response = new HashMap<>();
                    response.put("canal_id", canal.get("channel_id"));
                    response.put("nome", canal.get("nome"));
                    response.put("score", result.getScore());
                    response.put("arquivo", canal.get("arquivo"));
                    return response;
                })
                .toList();
    }

    @PostMapping("/buscar_id")
    public List<Map<String, Object>> buscarId(@RequestBody ChannelSearchRequest request) {
        List<String> ids = request.getIds();
        if (ids == null || ids.isEmpty()) {
            throw new IllegalArgumentException("É necessário enviar uma lista de channel_id");
        }

        String placeholders = String.join(",", ids.stream().map(s -> "?").toList());
        String query = String.format("""
            SELECT e.id, e.nome, e.url, cx.channel_id
            FROM epgs e
            JOIN canais_xmltv cx ON cx.epg_id = e.id
            WHERE cx.channel_id IN (%s)
        """, placeholders);

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(query, ids.toArray());

        // Group results by EPG
        Map<Long, Map<String, Object>> epgsDict = new HashMap<>();
        for (Map<String, Object> row : rows) {
            Long epgId = ((Number) row.get("id")).longValue();

            if (!epgsDict.containsKey(epgId)) {
                Map<String, Object> epgInfo = new HashMap<>();
                epgInfo.put("id", epgId);
                epgInfo.put("nome", row.get("nome"));
                epgInfo.put("url", row.get("url"));
                epgInfo.put("matched_channels", new ArrayList<String>());
                epgsDict.put(epgId, epgInfo);
            }

            @SuppressWarnings("unchecked")
            List<String> channels = (List<String>) epgsDict.get(epgId).get("matched_channels");
            channels.add((String) row.get("channel_id"));
        }

        return new ArrayList<>(epgsDict.values());
    }

    @GetMapping("/programas/{canalId}")
    public List<Programa> listarProgramas(
            @PathVariable Integer canalId,
            @RequestParam(value = "limit", defaultValue = "200") int limit) {

        return jdbcTemplate.query("""
            SELECT inicio, fim, titulo, descricao
            FROM programas
            WHERE canal_id = ?
            ORDER BY inicio
            LIMIT ?
        """, (rs, rowNum) -> {
            Programa programa = new Programa();
            programa.setInicio(rs.getString("inicio"));
            programa.setFim(rs.getString("fim"));
            programa.setTitulo(rs.getString("titulo"));
            programa.setDescricao(rs.getString("descricao"));
            return programa;
        }, canalId, limit);
    }

    @DeleteMapping("/epg")
    public Map<String, Object> deleteEpgByUrl(@RequestBody DeleteRequest request) {
        String epgUrl = request.getUrl();
        if (epgUrl == null) {
            throw new IllegalArgumentException("É necessário fornecer a URL do EPG");
        }

        List<Map<String, Object>> epgs = jdbcTemplate.queryForList(
                "SELECT id, nome FROM epgs WHERE url = ?", epgUrl
        );

        if (epgs.isEmpty()) {
            throw new RuntimeException("EPG não encontrado");
        }

        Long epgId = ((Number) epgs.get(0).get("id")).longValue();
        String epgNome = (String) epgs.get(0).get("nome");

        // Get channel IDs
        List<Map<String, Object>> canalIds = jdbcTemplate.queryForList(
                "SELECT id FROM canais_xmltv WHERE arquivo = ?", epgNome
        );

        if (!canalIds.isEmpty()) {
            List<Long> ids = canalIds.stream()
                    .map(row -> ((Number) row.get("id")).longValue())
                    .toList();

            // Delete programs
            String programPlaceholders = String.join(",", ids.stream().map(s -> "?").toList());
            jdbcTemplate.update(
                    String.format("DELETE FROM programas WHERE canal_id IN (%s)", programPlaceholders),
                    ids.toArray()
            );
        }

        // Delete channels
        jdbcTemplate.update("DELETE FROM canais_xmltv WHERE arquivo = ?", epgNome);

        // Delete EPG
        jdbcTemplate.update("DELETE FROM epgs WHERE id = ?", epgId);

        return Map.of("message", "EPG com URL '" + epgUrl + "' deletado com sucesso");
    }
}