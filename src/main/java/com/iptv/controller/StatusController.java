package com.iptv.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/status")
public class StatusController {
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    @GetMapping("/db_status")
    public Map<String, Object> getDbStatus() {
        // M3U Lists
        List<Map<String, Object>> listas = jdbcTemplate.queryForList(
            "SELECT id, nome, url, canais, data_upload FROM listas"
        );
        
        // M3U Channels count
        Integer numCanais = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM canais", Integer.class
        );
        
        // EPGs
        List<Map<String, Object>> epgs = jdbcTemplate.queryForList(
            "SELECT id, nome, url, canais, data_upload FROM epgs"
        );
        
        // XMLTV Channels count
        Integer numCanaisXmltv = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM canais_xmltv", Integer.class
        );
        
        // Image repositories
        List<Map<String, Object>> reposImg = jdbcTemplate.queryForList(
            "SELECT id, url, nome, canais, data_upload FROM repositorios_img"
        );
        
        // Logo counts
        Integer numLogosCanais = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM canais WHERE logo_url IS NOT NULL AND logo_url != ''", Integer.class
        );
        
        Integer numLogosXmltv = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM canais_xmltv WHERE logo_url IS NOT NULL AND logo_url != ''", Integer.class
        );
        
        Integer numImagesRepos = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM images", Integer.class
        );
        
        return Map.of(
            "listas", listas,
            "num_canais", numCanais,
            "epgs", epgs,
            "num_canais_xmltv", numCanaisXmltv,
            "repositorios_img", reposImg,
            "num_logos_canais", numLogosCanais,
            "num_logos_xmltv", numLogosXmltv,
            "num_images_repos", numImagesRepos
        );
    }
}