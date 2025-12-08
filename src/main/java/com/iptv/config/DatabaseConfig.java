package com.iptv.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

@Configuration
public class DatabaseConfig {
    // No need for explicit DataSource configuration with H2 and Spring Boot autoconfiguration
    // Spring Boot will automatically create the DataSource based on application.properties
}