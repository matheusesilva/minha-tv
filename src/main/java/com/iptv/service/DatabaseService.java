package com.iptv.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

@Service
public class DatabaseService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void initDb() {
        // Create M3U tables - using IDENTITY for H2
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS listas (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255),
                url VARCHAR(1000),
                canais INTEGER,
                data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS canais (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                id_canal VARCHAR(255),
                nome VARCHAR(255),
                logo_url VARCHAR(1000),
                url VARCHAR(1000),
                numero_canal INTEGER,
                nome_grupo VARCHAR(255),
                lista_id BIGINT,
                FOREIGN KEY(lista_id) REFERENCES listas(id)
            )
        """);

        // Create XMLTV tables
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS epgs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255),
                url VARCHAR(1000),
                canais INTEGER,
                data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS canais_xmltv (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                channel_id VARCHAR(255),
                nome VARCHAR(255),
                logo_url VARCHAR(1000),
                arquivo VARCHAR(255),
                epg_id BIGINT,
                FOREIGN KEY(epg_id) REFERENCES epgs(id)
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS programas (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                canal_id BIGINT,
                inicio VARCHAR(50),
                fim VARCHAR(50),
                titulo VARCHAR(500),
                descricao TEXT,
                FOREIGN KEY(canal_id) REFERENCES canais_xmltv(id)
            )
        """);

        // Create image tables
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS repositorios_img (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                url VARCHAR(1000),
                nome VARCHAR(255),
                canais INTEGER,
                data_upload TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """);

        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS images (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(255),
                url_raw VARCHAR(1000),
                repositorio_id BIGINT,
                FOREIGN KEY(repositorio_id) REFERENCES repositorios_img(id)
            )
        """);

        System.out.println("Database tables initialized successfully");
    }
}