package com.iptv.controller;

import com.iptv.model.entity.Canal;
import com.iptv.model.dto.DeleteRequest;
import com.iptv.model.dto.UploadRequest;
import com.iptv.service.DatabaseService;
import com.iptv.util.M3UParser;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import java.sql.PreparedStatement;
import java.sql.Statement;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import java.io.IOException;

@RestController
@RequestMapping("/api/m3u")
public class M3UController {

    private final M3UParser m3UParser = new M3UParser();
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private DatabaseService databaseService;

    @PostMapping("/upload")
    public Map<String, Object> uploadM3U(@RequestBody UploadRequest request) {
        List<String> urls = request.getUrls();
        if (urls == null || urls.isEmpty()) {
            throw new IllegalArgumentException("É necessário enviar uma lista de URLs");
        }

        int totalCanais = 0;
        List<String> nomesListas = new ArrayList<>();

        for (String url : urls) {
            // Extrai nome da lista a partir da URL
            String listaNome = URLDecoder.decode(
                    url.substring(url.lastIndexOf('/') + 1).replace(".m3u", ""),
                    StandardCharsets.UTF_8
            );
            nomesListas.add(listaNome);

            try {
                // Faz download e parsing da lista M3U
                List<Map<String, Object>> canais = m3UParser.parseM3UFromUrl(url);

                // Salva a lista no banco
                KeyHolder keyHolder = new GeneratedKeyHolder();

                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO listas (nome, url, canais) VALUES (?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                    );
                    ps.setString(1, listaNome);
                    ps.setString(2, url);
                    ps.setInt(3, canais.size());
                    return ps;
                }, keyHolder);

                Long listaId = ((Number) keyHolder.getKeys().get("id")).longValue();

                // Insere canais
                for (Map<String, Object> canal : canais) {
                    jdbcTemplate.update("""
                    INSERT INTO canais (id_canal, nome, logo_url, url, numero_canal, nome_grupo, lista_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                            canal.get("id_canal"),
                            canal.get("nome"),
                            canal.get("logo_url"),
                            canal.get("url"),
                            canal.get("numero_canal"),
                            canal.get("nome_grupo"),
                            listaId
                    );
                    System.out.printf(
                            "Inserindo canal '%s' com lista_id=%s (%s)%n",
                            canal.get("nome"),
                            listaId,
                            listaId != null ? listaId.getClass().getSimpleName() : "null"
                    );
                }

                totalCanais += canais.size();
                System.out.println("✅ Lista '" + listaNome + "' processada com " + canais.size() + " canais.");

            } catch (IOException | InterruptedException e) {
                System.err.println("❌ Erro ao processar URL " + url + ": " + e.getMessage());
            } catch (Exception e) {
                System.err.println("⚠️ Erro inesperado ao processar " + url + ": " + e.getMessage());
            }
        }

        return Map.of(
                "message", totalCanais + " canais salvos com sucesso",
                "listas", nomesListas
        );
    }
    
    @GetMapping("/canais")
    public List<Canal> listarCanais() {
        return jdbcTemplate.query("""
            SELECT canais.id, canais.id_canal, canais.nome, canais.logo_url, canais.url,
                   canais.numero_canal, canais.nome_grupo, listas.nome as lista_nome, listas.id as lista_id
            FROM canais
            LEFT JOIN listas ON canais.lista_id = listas.id
        """, (rs, rowNum) -> {
            Canal canal = new Canal();
            canal.setId(rs.getInt("id"));
            canal.setIdCanal(rs.getString("id_canal"));
            canal.setNome(rs.getString("nome"));
            canal.setLogoUrl(rs.getString("logo_url"));
            canal.setUrl(rs.getString("url"));
            canal.setNumeroCanal(rs.getInt("numero_canal"));
            canal.setNomeGrupo(rs.getString("nome_grupo"));
            canal.setListaId(rs.getInt("lista_id"));
            canal.setListaNome(rs.getString("lista_nome"));
            return canal;
        });
    }
    
    @DeleteMapping("/lista")
    public Map<String, Object> deleteLista(@RequestBody DeleteRequest request) {
        String url = request.getUrl();
        if (url == null) {
            throw new IllegalArgumentException("É necessário enviar a URL da lista");
        }
        
        // Find list ID by URL
        List<Map<String, Object>> listas = jdbcTemplate.queryForList(
            "SELECT id FROM listas WHERE url = ?", url
        );
        
        if (listas.isEmpty()) {
            throw new RuntimeException("Lista não encontrada");
        }
        
        Long listaId = (Long) listas.get(0).get("id");
        
        // Delete related channels
        jdbcTemplate.update("DELETE FROM canais WHERE lista_id = ?", listaId);
        
        // Delete the list
        jdbcTemplate.update("DELETE FROM listas WHERE id = ?", listaId);
        
        return Map.of("message", "Lista com URL '" + url + "' e seus canais foram deletados com sucesso");
    }
}