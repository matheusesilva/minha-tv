package com.iptv.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class WebController {

    // Mapeia qualquer rota que não seja da API para o index.html
    @RequestMapping(value = { "/", "/{path:[^\\.]*}" })
    public String redirect() {
        return "forward:/index.html";
    }
}
