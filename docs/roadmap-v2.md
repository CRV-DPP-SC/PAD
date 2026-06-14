# Roadmap v2 — PAD Digital
**Polícia Penal SC · Sequência de Evolução do Sistema**
**Data:** 2026-06-14 | **Versão:** 1.0

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Estado Atual](#2-estado-atual)
3. [Sequência de Fases](#3-sequência-de-fases)
4. [Fase 2 — Modularização JS](#fase-2--modularização-js)
5. [Fase 3 — Segurança e Sanitização](#fase-3--segurança-e-sanitização)
6. [Fase 4 — Modelo de Dados v2](#fase-4--modelo-de-dados-v2)
7. [Fase 5 — Prazos e Notificações Automáticas](#fase-5--prazos-e-notificações-automáticas)
8. [Fase 6 — Portal do Defensor](#fase-6--portal-do-defensor)
9. [Fase 7 — Exportação e Backup](#fase-7--exportação-e-backup)
10. [Fase 8 — Persistência Avançada (IndexedDB)](#fase-8--persistência-avançada-indexeddb)
11. [Fase 9 — Backend Opcional](#fase-9--backend-opcional-longo-prazo)
12. [Mapa de Dependências](#12-mapa-de-dependências)
13. [Critérios de Pronto por Fase](#13-critérios-de-pronto-por-fase)

---

## 1. Visão Geral

O PAD Digital partiu de um único arquivo HTML monolítico de 24.291 linhas. A trajetória de evolução o transforma progressivamente em uma aplicação modular, segura e sustentável — mantendo 100% de compatibilidade com GitHub Pages (sem backend obrigatório) e sem quebrar funcionalidades em nenhuma fase.

**Princípio guia:** cada fase entrega valor imediato e deixa o sistema melhor do que encontrou. Nenhuma fase gera retrabalho na fase seguinte.

**Restrições permanentes:**
- Compatibilidade com GitHub Pages (arquivos estáticos, sem servidor)
- Sem frameworks (sem React/Vue/Angular) — JavaScript vanilla
- Sem build tools obrigatórias (sem webpack/vite) — arquivos diretos
- Sem dependências novas de CDN além das já presentes (Tabler Icons, PDF.js, docx)

---

## 2. Estado Atual

### Fases concluídas

| Fase | Status | Descrição |
|---|---|---|
| **Fase 0** | ✅ Concluída | CSS separado em 3 arquivos; bundle docx removido; CDN com versões fixadas |
| **Fase 1** | ✅ Concluída | `js/storage.js` criado; localStorage persistence para todos os dados |
| **Fase 1.5** | ✅ Concluída | Modelo de dados documentado; arquitetura mapeada; roadmap criado |

### Estrutura atual de arquivos

```
PAD/
├── index.html              # 3.944 linhas (era 24.291)
├── css/
│   ├── style.css           # Reset, base, print
│   ├── layout.css          # Topbar, nav, grids
│   └── components.css      # Cards, botões, timeline, etc.
├── js/
│   └── storage.js          # Camada localStorage
└── docs/
    ├── mapeamento-funcionalidades.md
    ├── modelo-de-dados.md
    └── roadmap-v2.md
```

### Dívidas técnicas conhecidas

| Criticidade | Item |
|---|---|
| Alta | Senhas em plaintext no `advDB` |
| Alta | XSS em innerHTML com dados não sanitizados |
| Alta | Não há cálculo de prazos — status manual |
| Média | JS monolítico (~3.500 linhas) em index.html |
| Média | Dashboard com métricas hardcoded |
| Média | `document.write()` para PDF/print |
| Baixa | Modelo de dados desnormalizado (Incidentado duplicado) |
| Baixa | `OCORR_B64` pode exceder quota do localStorage |

---

## 3. Sequência de Fases

```
CONCLUÍDO  ─── Fase 0 ──── Fase 1 ──── Fase 1.5
                                              │
PRÓXIMO    ──────────────────────────────── Fase 2
                                              │
                                           Fase 3
                                              │
                                           Fase 4
                                              │
                                    ┌─── Fase 5 ───┐
                                    │              │
                                 Fase 6         Fase 7
                                    │              │
                                    └──── Fase 8 ──┘
                                              │
                                           Fase 9
                                        (opcional)
```

**Estimativa de esforço por fase:**

| Fase | Esforço | Valor entregue |
|---|---|---|
| Fase 2 — Modularização | Médio (1-2 dias) | Manutenibilidade, legibilidade |
| Fase 3 — Segurança | Médio (1 dia) | Proteção de dados, senhas seguras |
| Fase 4 — Modelo v2 | Alto (2-3 dias) | Base para todas as fases seguintes |
| Fase 5 — Prazos | Médio (1-2 dias) | Valor de negócio imediato e alto |
| Fase 6 — Portal Defensor | Alto (2-3 dias) | Funcionalidade nova completa |
| Fase 7 — Backup/Exportação | Baixo (1 dia) | Segurança dos dados |
| Fase 8 — IndexedDB | Médio (1-2 dias) | Capacidade e performance |
| Fase 9 — Backend | Muito alto | Multi-usuário, multi-unidade |

---

## Fase 2 — Modularização JS

**Objetivo:** Extrair o JavaScript inline de `index.html` para arquivos `.js` separados, um por domínio funcional. Sem alterar comportamento.

**Pré-requisito:** Fase 1.5 (concluída)

### Estrutura de arquivos resultante

```
js/
├── storage.js          # já existe — sem alteração
├── app.js              # Inicialização, SESSAO, login, goTab, utilitários globais
├── util.js             # Funções puras: formatação de data, geração de ID, strings
├── dashboard.js        # renderPainel(), cálculo de métricas, atalhos
├── pad.js              # confirmarDados(), PADS_DB, busca, listagem
├── oitivas.js          # abrirModalOitiva(), salvarOitiva(), deletarOitiva()
├── documentos.js       # gerarDocx(), gerarPDFCompleto(), imprimirDoc(), modelos
├── acompanhamento.js   # abrirAcompanhamento(), renderAcomp(), timeline, etapas
├── notificacoes.js     # renderNotif(), atualizarBadgeMsgs(), alertas
├── acessos.js          # advDB, cadastro de defensores, portal de acesso
└── calendario.js       # renderCal(), eventos, marcações
```

### Ordem de carregamento no `<head>`

```html
<!-- Camada de dados -->
<script src="js/storage.js"></script>

<!-- Utilitários (sem dependências) -->
<script src="js/util.js"></script>

<!-- Módulos de domínio (dependem de util.js) -->
<script src="js/pad.js"></script>
<script src="js/oitivas.js"></script>
<script src="js/documentos.js"></script>
<script src="js/acompanhamento.js"></script>
<script src="js/notificacoes.js"></script>
<script src="js/acessos.js"></script>
<script src="js/calendario.js"></script>
<script src="js/dashboard.js"></script>

<!-- Controlador principal (depende de todos os módulos) -->
<script src="js/app.js"></script>
```

### Regras de extração

- Cada arquivo expõe funções globais (`window.fn = fn`) — sem módulos ES6 para manter compatibilidade
- Variáveis globais de estado (`padsData`, `PADS_DB`, `SESSAO`, etc.) permanecem declaradas em `app.js`
- `util.js` deve conter apenas funções puras (sem side effects, sem acesso a DOM ou globals de estado)
- Nenhuma funcionalidade é alterada — apenas movida

### Critério de conclusão

- `index.html` contém apenas HTML (zero linhas de JavaScript inline)
- Todos os testes funcionais da Fase 1 passam sem alteração

---

## Fase 3 — Segurança e Sanitização

**Objetivo:** Eliminar as três principais vulnerabilidades de segurança identificadas na Fase 0/1.

**Pré-requisito:** Fase 2 (código modular facilita localização das vulnerabilidades)

### 3.1 Hashing de senhas com Web Crypto API

**Problema atual:** `advDB` armazena senhas em plaintext no localStorage.

**Solução:**
```javascript
// Em js/acessos.js
async function hashSenha(senha) {
  var encoder = new TextEncoder();
  var data = encoder.encode(senha);
  var hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(function(b) { return b.toString(16).padStart(2, '0'); })
    .join('');
}
```

- Ao cadastrar defensor: salvar `senhaHash` ao invés de `senha`
- Ao logar: calcular hash e comparar com `senhaHash` armazenado
- Migração: na primeira abertura após update, detectar senhas sem hash e forçar redefinição

### 3.2 Sanitização de XSS

**Problema atual:** `innerHTML` é usado com dados do usuário em vários pontos.

**Solução:** Criar função `sanitize()` em `util.js`:
```javascript
function sanitize(str) {
  if (typeof str !== 'string') return '';
  var div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
```

Aplicar em todas as atribuições `element.innerHTML = dadoDoUsuario`.

### 3.3 Eliminação de `document.write()`

**Problema atual:** `gerarPDFCompleto()` e `imprimirDoc()` usam `document.write()` para abrir janelas de impressão.

**Solução:** Substituir por `blob URL + iframe`:
```javascript
function abrirJanelaImpressao(html) {
  var blob = new Blob([html], { type: 'text/html' });
  var url = URL.createObjectURL(blob);
  var win = window.open(url, '_blank');
  win.onload = function() {
    win.print();
    URL.revokeObjectURL(url);
  };
}
```

### Critério de conclusão

- `advDB` não contém nenhuma senha em texto puro
- Nenhuma atribuição `innerHTML` recebe dados do usuário sem passar por `sanitize()`
- Nenhuma chamada a `document.write()` no código

---

## Fase 4 — Modelo de Dados v2

**Objetivo:** Implementar o modelo normalizado descrito em `docs/modelo-de-dados.md`. Esta fase é a de maior impacto estrutural.

**Pré-requisito:** Fases 2 e 3

### 4.1 Novas entidades a implementar

| Entidade | Arquivo | Impacto |
|---|---|---|
| `Incidentado` | `js/pad.js` | Separar de `padsData` e `PADS_DB` |
| `Defensor` (completo) | `js/acessos.js` | Expandir campos do `advDB` atual |
| `Documento` (entidade) | `js/documentos.js` | Formalizar o que hoje é `docs: []` vazio |
| `PRAZO_PROCESSUAL` | `js/prazos.js` (novo) | Entidade completamente nova |
| `Notificacao` (entidade) | `js/notificacoes.js` | Substituir array hardcoded |
| `Usuario` | `js/acessos.js` | Formalizar o que hoje é apenas nome na sessão |

### 4.2 Migração de dados

A migração deve ser feita transparentemente no `storageInit()`:

```javascript
function migrarDadosV1paraV2() {
  var versao = Storage.get('versaoSchema') || '1';
  if (versao === '1') {
    // Extrair Incidentados de padsData para pad_incidentados
    // Normalizar advDB para estrutura Defensor completa
    // Criar PRAZO_PROCESSUAL para cada PAD existente
    Storage.set('versaoSchema', '2');
  }
}
```

### 4.3 Novos campos de localStorage

```
pad_incidentados    ← NOVO: Incidentado[]
pad_usuarios        ← NOVO: Usuario[]
pad_prazos          ← NOVO: Object<id, PRAZO_PROCESSUAL>
pad_notificacoes    ← NOVO: Notificacao[]
pad_versaoSchema    ← NOVO: string ('1' | '2' | ...)
```

### Critério de conclusão

- `padsData` não contém nome/IPEN duplicados — referencia `incidentado_ipen`
- `PADS_DB` é substituído por `pad_incidentados`
- Cada PAD tem um `PRAZO_PROCESSUAL` associado
- Migração automática ocorre na primeira abertura sem perda de dados

---

## Fase 5 — Prazos e Notificações Automáticas

**Objetivo:** Implementar cálculo automático de prazos e geração dinâmica de notificações. Esta fase tem o maior valor de negócio imediato.

**Pré-requisito:** Fase 4

### 5.1 Novo arquivo: `js/prazos.js`

Funções principais:
- `calcularPrazo(prazo)` — recalcula `diasRestantes` e `status`
- `recalcularTodosPrazos()` — chamado no `storageInit()` após carregar dados
- `adicionarProrrogacao(padPortaria, prorrogacao)` — registra prorrogação com histórico
- `gerarNotificacoesDePrazo()` — cria `Notificacao[]` baseadas nos status dos prazos

### 5.2 Alterações no Dashboard

- Métricas calculadas dinamicamente (não hardcoded)
- Barra de progresso por PAD baseada em `diasRestantes / prazoLegalDias`
- Destaque automático em vermelho para PADs com prazo vencido

### 5.3 Alterações nas Notificações

- `renderNotif()` passa a consumir `pad_notificacoes` (array real)
- Notificações de prazo geradas automaticamente no carregamento
- Badge da aba conta notificações não lidas (não hardcoded "0")

### Critério de conclusão

- Abrir o sistema com um PAD cujo prazo venceu → aparece automaticamente como `sp` (Crítico)
- Notificação de prazo gerada 10 dias antes do vencimento sem intervenção manual
- Dashboard mostra contagens reais derivadas dos dados

---

## Fase 6 — Portal do Defensor

**Objetivo:** Tornar o acesso do advogado/defensor completamente funcional — login real, visualização apenas dos seus PADs, troca de mensagens.

**Pré-requisito:** Fases 3 (senhas seguras) e 4 (Defensor como entidade)

### 6.1 Funcionalidades do perfil `adv`

- Login com e-mail + senha (hash SHA-256)
- Visualização apenas dos PADs onde é o defensor cadastrado
- Leitura da timeline e documentos do PAD
- Envio e recebimento de mensagens com o CEPEN
- Download de documentos gerados (portaria, intimação, etc.)

### 6.2 Funcionalidades do perfil `coord` para defensores

- Cadastro completo de defensores com todos os campos do modelo v2
- Vinculação/desvinculação de defensor a um PAD
- Envio de documentos gerados para o portal do defensor
- Visualização de confirmações de leitura

### Critério de conclusão

- Defensor cadastrado pode logar e ver apenas seus PADs
- Mensagens enviadas por coord aparecem para adv e vice-versa
- Login com senha errada é rejeitado

---

## Fase 7 — Exportação e Backup

**Objetivo:** Proteger os dados contra perda acidental (limpeza do navegador, troca de dispositivo) e permitir auditoria.

**Pré-requisito:** Fase 4 (modelo estável)

### 7.1 Funcionalidades

| Funcionalidade | Descrição |
|---|---|
| Exportar PAD único | JSON de um PAD com todos os dados relacionados (oitivas, docs, prazos) |
| Exportar todos os PADs | ZIP com um JSON por PAD + arquivo de índice |
| Importar PAD | Carregar JSON de um PAD previamente exportado |
| Backup geral | JSON completo de todo o localStorage `pad_*` |
| Restaurar backup | Carregar JSON de backup e substituir dados atuais |

### 7.2 Formato de exportação

```json
{
  "versaoSchema": "2",
  "exportadoEm": "2026-06-14T08:00:00.000Z",
  "exportadoPor": "usr-beltrano-001",
  "pad": { /* PAD completo */ },
  "incidentado": { /* Incidentado */ },
  "defensor": { /* Defensor */ },
  "oitivas": [ /* Oitiva[] */ ],
  "documentos": [ /* Documento[] */ ],
  "prazo": { /* PRAZO_PROCESSUAL */ },
  "mensagens": [ /* Mensagem[] */ ]
}
```

### Critério de conclusão

- Exportar PAD → importar em outro navegador → todos os dados preservados
- Botão de backup geral visível no painel do coord
- Importação valida `versaoSchema` e rejeita formatos incompatíveis

---

## Fase 8 — Persistência Avançada (IndexedDB)

**Objetivo:** Substituir localStorage por IndexedDB para suportar volumes maiores de dados, arquivos maiores e operações assíncronas.

**Pré-requisito:** Fases 4 e 7 (modelo estável e backup implementado)

### 8.1 Estratégia

A camada `Storage` em `js/storage.js` abstrai completamente o mecanismo de persistência. Para migrar para IndexedDB:

1. Criar `js/storage-idb.js` com a mesma API (`get`, `set`, `remove`, `clear`, `sizeKB`)
2. Substituir `<script src="js/storage.js">` por `<script src="js/storage-idb.js">`
3. **Zero mudanças no restante do código**

### 8.2 Benefícios do IndexedDB

| Aspecto | localStorage | IndexedDB |
|---|---|---|
| Limite de tamanho | 5–10 MB | Dezenas de GB |
| Tipo de dados | Apenas strings | Blobs, ArrayBuffers, objetos |
| Transações | Não | Sim (atomicidade) |
| Índices de busca | Não | Sim (busca eficiente) |
| Acesso | Síncrono | Assíncrono (Promise) |

### 8.3 Impacto nas funções de storage

Todas as funções `storageSalvar*` e `storageCarregar*` precisarão retornar Promises:

```javascript
// Antes (síncrono):
function storageCarregarPads() {
  var saved = Storage.get('padsData');
  if(saved) padsData = saved;
}

// Depois (assíncrono):
async function storageCarregarPads() {
  var saved = await Storage.get('padsData');
  if(saved) padsData = saved;
}
```

E `storageInit()` se torna assíncrono, chamado com `await` no DOMContentLoaded.

### Critério de conclusão

- Todos os dados migrados automaticamente de localStorage para IndexedDB na primeira abertura
- Documentos com `b64` acima de 1 MB armazenados sem erro
- Performance de carregamento igual ou melhor

---

## Fase 9 — Backend Opcional (Longo Prazo)

**Objetivo:** Adicionar backend para suportar múltiplos usuários simultâneos, múltiplas unidades prisionais e sincronização entre dispositivos.

**Pré-requisito:** Fase 8 (IndexedDB) — o modelo de dados já é maduro

### 9.1 Opções de backend

| Opção | Descrição | Complexidade |
|---|---|---|
| **Supabase** | PostgreSQL + Auth + Storage + API REST automática | Baixa |
| **Firebase** | Firestore + Auth + Storage (Google) | Baixa |
| **PocketBase** | Self-hosted, single binary | Média |
| **API própria** | Node.js/Python com PostgreSQL | Alta |

### 9.2 Estratégia de migração

1. `js/storage.js` → `js/storage-api.js` com mesma API usando `fetch()`
2. Backend implementa os mesmos endpoints: `GET /pads`, `POST /pads`, etc.
3. Modo offline: usar IndexedDB como cache; sincronizar quando online

### 9.3 Funcionalidades habilitadas pelo backend

- Multi-usuário simultâneo (vários servidores no mesmo PAD)
- Multi-unidade (cada unidade prisional vê apenas seus PADs)
- Auditoria completa (log de quem fez o quê e quando)
- Notificações por e-mail/SMS (prazos, intimações)
- Integração com SGPE via API (preenchimento automático por IPEN)

### Critério de conclusão

- Sistema funciona online (API) e offline (IndexedDB cache)
- Login com e-mail e senha via OAuth2 ou JWT
- Dados de uma unidade não são visíveis para outra

---

## 12. Mapa de Dependências

```
Fase 0 ──► Fase 1 ──► Fase 1.5
                           │
                      ┌────▼────┐
                      │ Fase 2  │ Modularização
                      └────┬────┘
                           │
                      ┌────▼────┐
                      │ Fase 3  │ Segurança
                      └────┬────┘
                           │
                      ┌────▼────┐
                      │ Fase 4  │ Modelo v2  ◄──── BLOQUEIA Fases 5, 6, 7, 8
                      └────┬────┘
               ┌───────────┼───────────┐
          ┌────▼────┐  ┌───▼───┐  ┌───▼───┐
          │ Fase 5  │  │Fase 6 │  │Fase 7 │
          │ Prazos  │  │Portal │  │Backup │
          └────┬────┘  └───┬───┘  └───┬───┘
               └───────────┴───────────┘
                           │
                      ┌────▼────┐
                      │ Fase 8  │ IndexedDB
                      └────┬────┘
                           │
                      ┌────▼────┐
                      │ Fase 9  │ Backend (opcional)
                      └─────────┘
```

**Fases que podem ser feitas em paralelo:** 5, 6 e 7 (todas dependem da Fase 4 mas são independentes entre si)

---

## 13. Critérios de Pronto por Fase

### Critérios globais (valem para todas as fases)

- [ ] Nenhuma funcionalidade existente foi quebrada
- [ ] Layout e aparência estão idênticos ao início da fase
- [ ] Nenhum erro de console ao carregar `index.html`
- [ ] Dados do localStorage sobrevivem ao fechar e reabrir o navegador
- [ ] Compatível com GitHub Pages (sem dependências de servidor)

### Critérios específicos

| Fase | Critério principal |
|---|---|
| Fase 2 | `index.html` tem zero linhas de JavaScript |
| Fase 3 | `advDB` não tem campo `senha` em plaintext; nenhum `document.write()` |
| Fase 4 | `pad_versaoSchema = '2'`; Incidentado é entidade separada; cada PAD tem `PRAZO_PROCESSUAL` |
| Fase 5 | PAD com prazo vencido aparece como `sp` automaticamente ao carregar |
| Fase 6 | Defensor loga com e-mail+senha e vê apenas seus PADs |
| Fase 7 | Exportar + importar PAD em outro navegador sem perda de dados |
| Fase 8 | `pad_*` keys não existem em localStorage; dados em IndexedDB; sem limite de 5 MB |
| Fase 9 | Dois usuários simultâneos veem as mesmas alterações em tempo real |

---

## Notas Finais

**Sobre ordem de prioridade:** As Fases 2 e 5 têm a melhor relação esforço/valor. A Fase 2 (modularização) torna o código manutenível para todas as fases seguintes. A Fase 5 (prazos automáticos) entrega valor de negócio concreto imediato — é a principal razão de existir de um sistema como este.

**Sobre a Fase 9:** O backend é explicitamente opcional. O sistema pode ser útil e completo operando apenas com IndexedDB por anos. A decisão de adicionar backend deve ser tomada apenas quando:
- Houver mais de uma unidade usando o sistema, ou
- Houver necessidade de acesso simultâneo por múltiplos usuários, ou
- Houver integração necessária com sistemas externos (SGPE, e-mail)

**Revisão:** Este roadmap deve ser revisado antes do início de cada fase para incorporar aprendizados das fases anteriores.
