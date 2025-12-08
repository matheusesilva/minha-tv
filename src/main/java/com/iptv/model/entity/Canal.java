package com.iptv.model.entity;

import lombok.Data;

@Data
public class Canal {
    private Integer id;
    private String idCanal;
    private String nome;
    private String logoUrl;
    private String url;
    private Integer numeroCanal;
    private String nomeGrupo;
    private Integer listaId;
    private String listaNome;
}