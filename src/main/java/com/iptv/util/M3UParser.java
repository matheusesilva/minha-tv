package com.iptv.util;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class M3UParser {
    public M3UParser() {
    }

    // Regex patterns for M3U parsing
    private static final Pattern NAME_PATTERN = Pattern.compile(",(.+)$");
    private static final Pattern LOGO_PATTERN = Pattern.compile("tvg-logo=\"(.*?)\"");
    private static final Pattern GROUP_PATTERN = Pattern.compile("group-title=\"(.*?)\"");
    private static final Pattern ID_PATTERN = Pattern.compile("tvg-id=\"(.*?)\"");
    private static final Pattern NUMBER_PATTERN = Pattern.compile("tvg-chno=\"(\\d+)\"");

    // M3U parsing
    public List<Map<String, Object>> parseM3UFromUrl(String url)
            throws IOException, InterruptedException {

        List<Map<String, Object>> canais = new ArrayList<Map<String, Object>>();
        Map<String, Object> canal = null;

        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IOException("Falha ao baixar M3U: " + response.statusCode());
        }

        String[] linhas = response.body().split("\\r?\\n");
        for (String linha : linhas) {
            if (linha.startsWith("#EXTINF")) {
                Matcher nomeMatch = NAME_PATTERN.matcher(linha);
                Matcher logoMatch = LOGO_PATTERN.matcher(linha);
                Matcher grupoMatch = GROUP_PATTERN.matcher(linha);
                Matcher idMatch = ID_PATTERN.matcher(linha);
                Matcher numMatch = NUMBER_PATTERN.matcher(linha);

                canal = new HashMap<String, Object>();
                canal.put("id_canal", idMatch.find() ? idMatch.group(1) : null);
                canal.put("nome", nomeMatch.find() ? nomeMatch.group(1).trim() : "");
                canal.put("logo_url", logoMatch.find() ? logoMatch.group(1) : "");
                canal.put("nome_grupo", grupoMatch.find() ? grupoMatch.group(1) : "");

                if (numMatch.find()) {
                    try {
                        canal.put("numero_canal", Integer.parseInt(numMatch.group(1)));
                    } catch (NumberFormatException e) {
                        canal.put("numero_canal", null);
                    }
                } else {
                    canal.put("numero_canal", null);
                }

            } else if (canal != null && !linha.isEmpty() && !linha.startsWith("#")) {
                canal.put("url", linha.trim());
                canais.add(canal);
                canal = null;
            }
        }

        return canais;
    }
}