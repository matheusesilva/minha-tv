package com.iptv.util;

import com.iptv.controller.XMLTVController;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.IOException;
import java.io.StringReader;
import java.net.URI;
import java.net.URLDecoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class XMLTVParser {
    public XMLTVParser() {
    }

    // Utilitário para extrair texto de tag
    private static String getTextSafe(Element parent, String tagName) {
        NodeList nodes = parent.getElementsByTagName(tagName);
        if (nodes.getLength() == 0) return null;
        Node node = nodes.item(0);
        return node.getTextContent();
    }

    public Map<String, Object> parseXmltvFromUrl(String url) throws Exception {
        Map<String, Object> result = new HashMap<String, Object>();
        List<Map<String, Object>> canais = new ArrayList<Map<String, Object>>();
        List<Map<String, Object>> programas = new ArrayList<Map<String, Object>>();

        // Nome do arquivo
        String arquivoNome = URLDecoder.decode(
                url.substring(url.lastIndexOf('/') + 1).replace(".xml", ""),
                StandardCharsets.UTF_8
        );
        result.put("arquivoNome", arquivoNome);

        // Faz download do XML
        HttpClient client = HttpClient.newHttpClient();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            throw new IOException("Falha ao baixar XMLTV: " + response.statusCode());
        }

        String xmlText = response.body();

        // Parse XML
        DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
        factory.setNamespaceAware(true);
        DocumentBuilder builder = factory.newDocumentBuilder();
        Document doc = builder.parse(new InputSource(new StringReader(xmlText)));
        doc.getDocumentElement().normalize();

        // Canais
        NodeList channelNodes = doc.getElementsByTagName("channel");
        Set<String> channelIds = new HashSet<String>();

        for (int i = 0; i < channelNodes.getLength(); i++) {
            Element ch = (Element) channelNodes.item(i);
            String chanId = ch.getAttribute("id");

            String display = getTextSafe(ch, "display-name");
            if (display == null || display.isEmpty()) {
                display = chanId != null ? chanId : "";
            }

            String logo = null;
            NodeList iconNodes = ch.getElementsByTagName("icon");
            if (iconNodes.getLength() > 0) {
                Element icon = (Element) iconNodes.item(0);
                logo = icon.getAttribute("src");
            }

            Map<String, Object> canal = new HashMap<String, Object>();
            canal.put("channel_id", chanId);
            canal.put("nome", display);
            canal.put("logo_url", logo);
            canal.put("arquivo", arquivoNome);

            canais.add(canal);
            channelIds.add(chanId);
        }

        // Programas
        NodeList programmeNodes = doc.getElementsByTagName("programme");
        for (int i = 0; i < programmeNodes.getLength(); i++) {
            Element prog = (Element) programmeNodes.item(i);
            String chRef = prog.getAttribute("channel");
            if (!channelIds.contains(chRef)) {
                continue;
            }

            String inicio = prog.getAttribute("start");
            String fim = prog.getAttribute("stop");
            String titulo = getTextSafe(prog, "title");
            String descricao = getTextSafe(prog, "desc");

            Map<String, Object> programa = new HashMap<String, Object>();
            programa.put("channel_id", chRef);
            programa.put("inicio", inicio);
            programa.put("fim", fim);
            programa.put("titulo", titulo);
            programa.put("descricao", descricao);

            programas.add(programa);
        }

        result.put("canais", canais);
        result.put("programas", programas);

        return result;
    }
}