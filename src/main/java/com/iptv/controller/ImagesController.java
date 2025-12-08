package com.iptv.controller;

import com.iptv.model.dto.DeleteRequest;
import com.iptv.model.entity.Image;
import com.iptv.model.dto.UploadRequest;
import com.iptv.service.DatabaseService;
import com.iptv.util.FuzzySearch;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import java.sql.PreparedStatement;
import java.sql.Statement;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import java.io.IOException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.HashMap;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/images")
public class ImagesController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @Autowired
    private FuzzySearch fuzzySearch;

    @Autowired
    private DatabaseService databaseService;
    
    @PostMapping("/upload")
    public Map<String, Object> uploadImages(@RequestBody UploadRequest request) {
        List<String> urls = request.getUrls();
        if (urls == null || urls.isEmpty()) {
            throw new IllegalArgumentException("É necessário enviar uma lista de URLs");
        }
        
        int totalInseridos = 0;
        
        for (String url : urls) {
            try {
                List<Map<String, String>> imagens = parseGithubImages(url);
                
                URI uri = new URI(url);
                String path = uri.getPath().trim();
                String[] pathParts = path.split("/");
                String nome = pathParts[1] + "/" + pathParts[pathParts.length - 1];

                KeyHolder keyHolder = new GeneratedKeyHolder();

                jdbcTemplate.update(connection -> {
                    PreparedStatement ps = connection.prepareStatement(
                            "INSERT INTO repositorios_img (url, nome, canais) VALUES (?, ?, ?)",
                            Statement.RETURN_GENERATED_KEYS
                    );
                    ps.setString(1, url);
                    ps.setString(2, nome);
                    ps.setInt(3, imagens.size());
                    return ps;
                }, keyHolder);

                // Get the generated ID
                Long repId = ((Number) keyHolder.getKeys().get("ID")).longValue();
                
                for (Map<String, String> img : imagens) {
                    try {
                        jdbcTemplate.update(
                            "INSERT INTO images (nome, url_raw, repositorio_id) VALUES (?, ?, ?)",
                            img.get("nome"), img.get("url_raw"), repId
                        );
                        totalInseridos++;
                    } catch (Exception e) {
                        System.err.println("Erro ao inserir " + img.get("nome") + ": " + e.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Erro ao parsear " + url + ": " + e.getMessage());
            }
        }
        
        return Map.of("message", totalInseridos + " imagens inseridas com sucesso");
    }
    
    @GetMapping("/buscar")
    public List<Image> buscarImagens(
            @RequestParam(value = "q", defaultValue = "") String termo,
            @RequestParam(value = "limit", defaultValue = "20") int limit) {

        System.out.println(termo);
        System.out.println(limit);
        
        List<Image> githubImgs = jdbcTemplate.query(
            "SELECT nome, url_raw FROM images",
            (rs, rowNum) -> {
                Image img = new Image();
                img.setNome(rs.getString("nome"));
                img.setUrl(rs.getString("url_raw"));
                return img;
            }
        );
        
        List<Image> canaisImgs = jdbcTemplate.query(
            "SELECT nome, logo_url FROM canais WHERE logo_url IS NOT NULL",
            (rs, rowNum) -> {
                Image img = new Image();
                img.setNome(rs.getString("nome"));
                img.setUrl(rs.getString("logo_url"));
                return img;
            }
        );
        
        List<Image> xmltvImgs = jdbcTemplate.query(
            "SELECT nome, logo_url FROM canais_xmltv WHERE logo_url IS NOT NULL",
            (rs, rowNum) -> {
                Image img = new Image();
                img.setNome(rs.getString("nome"));
                img.setUrl(rs.getString("logo_url"));
                return img;
            }
        );
        
        List<Image> todasImgs = new ArrayList<>();
        todasImgs.addAll(githubImgs);
        todasImgs.addAll(canaisImgs);
        todasImgs.addAll(xmltvImgs);

        System.out.println(todasImgs);
        
        if (!termo.trim().isEmpty()) {
            // Use Apache Commons Text fuzzy search
            List<FuzzySearch.SearchResult<Image>> results = fuzzySearch.fuzzySearch(
                todasImgs, termo, limit, 5, Image::getNome
            );
            
            return results.stream()
                .map(result -> {
                    Image img = result.getItem();
                    img.setScore(result.getScore());
                    return img;
                })
                .toList();
        } else {
            return todasImgs.stream().limit(limit).toList();
        }
    }
    
    @DeleteMapping("/repositorio")
    public Map<String, Object> deleteRepositorio(@RequestBody DeleteRequest request) {
        String repoUrl = request.getUrl();
        if (repoUrl == null) {
            throw new IllegalArgumentException("É necessário fornecer a URL do repositório");
        }
        
        List<Map<String, Object>> repos = jdbcTemplate.queryForList(
            "SELECT id, nome FROM repositorios_img WHERE url = ?", repoUrl
        );
        
        if (repos.isEmpty()) {
            throw new RuntimeException("Repositório não encontrado");
        }
        
        Long repoId = (Long) repos.get(0).get("id");
        
        jdbcTemplate.update("DELETE FROM images WHERE repositorio_id = ?", repoId);
        jdbcTemplate.update("DELETE FROM repositorios_img WHERE id = ?", repoId);
        
        return Map.of("message", "Repositório com URL '" + repoUrl + "' e suas imagens foram deletados com sucesso");
    }
    
    // Image parsing
    public static List<Map<String, String>> parseGithubImages(String url) throws IOException, InterruptedException {
        // Exemplo de URL: https://github.com/tv-logo/tv-logos/tree/main/countries/brazil
        String[] parts = url.replace("https://github.com/", "").split("/");

        if (parts.length < 5 || !"tree".equals(parts[2])) {
            throw new IllegalArgumentException("URL inválida. Formato esperado: https://github.com/owner/repo/tree/branch/path");
        }

        String owner = parts[0];
        String repo = parts[1];
        String branch = parts[3];
        String path = String.join("/", java.util.Arrays.copyOfRange(parts, 4, parts.length));

        // Monta URL da API GitHub
        String apiUrl = String.format("https://api.github.com/repos/%s/%s/contents/%s?ref=%s", owner, repo, path, branch);

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IOException("Falha ao acessar GitHub API: " + response.statusCode());
        }

        // Parse JSON com Jackson
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(response.body());

        List<Map<String, String>> imagens = new ArrayList<>();

        for (JsonNode item : root) {
            String type = item.get("type").asText();
            String name = item.get("name").asText();

            if ("file".equals(type) && name.toLowerCase().matches(".*\\.(png|jpg|jpeg)$")) {
                Map<String, String> img = new HashMap<>();
                img.put("nome", name);
                img.put("url_raw", item.get("download_url").asText());
                imagens.add(img);
            }
        }

        return imagens;
    }
}