# Editor de Listas M3U

Aplicação full-stack para gerenciamento, edição e exportação de listas **M3U** e **XMLTV**, construída com **Java + Spring Boot** no back-end e **React + JavaScript + Bootstrap** no front-end. O sistema oferece uma plataforma intuitiva para organizar canais, guias de programação e logos, com recursos avançados como **fuzzy search** para otimizar buscas.

---
## 🌐 Live Demo

Acesse a versão hospedada no Render:  
**https://minha-iptv.onrender.com/**

## 🚀 Funcionalidades Principais

### Back-end (Java + Spring Boot)
- API REST desenvolvida com Spring Boot.
- Banco de dados H2 embarcado.
- Dependências gerenciadas com Maven.
- Fuzzy search para otimizar buscas de canais.
- Manipulação de listas M3U, arquivos XMLTV e logos.

### Front-end (React + JS + Bootstrap)
Interface web organizada em três seções principais:

## 📚 1. Base de Dados

Nesta aba, o usuário pode adicionar diferentes fontes de dados à base interna.  
O sistema é compatível com recursos amplamente utilizados pela comunidade IPTV.

### Exemplos de fontes suportadas:

#### **Listas M3U (Ex.: iptv-org)**
Listas gratuitas para testes estão disponíveis no projeto:  
```bash
https://github.com/iptv-org/iptv
```

Exemplo de URL M3U:
```bash
https://raw.githubusercontent.com/iptv-org/iptv/refs/heads/master/streams/br.m3u
```
#### **Guias de Programação XMLTV**
EPGs podem ser encontrados em:  
```bash
https://epg.pw/xmltv.html
```
Exemplo de URL XMLTV:
```bash
https://epg.pw/xmltv/epg.xml 
```

#### **Repositórios de Logos PNG**
O sistema permite adicionar repositórios GitHub contendo logos PNG.

Exemplo:
```bash
https://github.com/tv-logo/tv-logos/tree/main/countries/united-states
```

Esses recursos alimentam os módulos de customização, busca de EPG, busca de logos e edição de listas.

## 🎛️ 2. Customização

Ferramentas para criar ou editar listas M3U.

O usuário pode:

- Criar uma nova lista do zero  
- Editar uma lista existente (upload via URL)  
- Adicionar canais de qualquer lista cadastrada na aba Base de Dados  
- Editar cada canal individualmente:

  - Nome  
  - Número  
  - Grupo  
  - ID do guia de programação (EPG ID)  
  - URL do stream  
  - Logo do canal  

### Recursos inteligentes:
- **Busca de EPG (ícone de lupa):** retorna IDs de XMLTV compatíveis com o canal.  
- **Buscar logos:** encontra logos semelhantes ao nome do canal, baseados nos repositórios cadastrados.
- **Cache da lista:** lista em edição é salva em cache no navegador, evitando que a lista se perda ao servidor dormir (Render plano gratuito).

## 📤 3. Exportar

Funcionalidades disponíveis:

- Download da lista M3U final.  
- Upload direto para um **Gist** usando usuário e token do GitHub.

## 🛠️ Tecnologias Utilizadas

**Back-end**
- Java 17+  
- Spring Boot  
- Spring Web  
- H2 Database  
- Maven  
- Fuzzy search  

**Front-end**
- React  
- JavaScript  
- Bootstrap  

## 🌐 Deploy

O projeto pode ser publicado facilmente no **Render**.  
Basta fazer *fork* deste repositório e fazer o deploy usando a imagem Docker.

## Futuras Melhorias

- Implementação de **cache** para listas M3U, XMLTV e repositórios de logos, reduzindo requisições repetidas.  
- **Autostart** da aplicação sempre que o servidor Render "acordar", garantindo inicialização automática das fontes.  
- Função de **upload para Gist** capaz de **atualizar um Gist existente**, não apenas criar novos.  
- Geração de **XMLTV customizado** com base apenas nos canais presentes na lista editada/criada.  
- Suporte para **upload de arquivos locais** (M3U, XMLTV, pacotes de logos) diretamente na aba Base de Dados.
