# Mapeamento de Funcionalidades — PAD Digital
**Polícia Penal de Santa Catarina · Gerado em 14/06/2026**

---

## 1. Visão Geral do Arquivo Original

| Item | Valor |
|---|---|
| Arquivo | `index.html.html` |
| Linhas totais | 24.291 |
| Tamanho | ~2 MB |
| Linhas — biblioteca `docx` (bundle) | 1–20.131 |
| Linhas — CSS inline | 20.132–20.349 |
| Linhas — HTML body | 20.350–20.972 |
| Linhas — JavaScript aplicação | 20.973–24.291 |

---

## 2. Dependências Externas

| Biblioteca | CDN / Forma | Versão usada | Função |
|---|---|---|---|
| **Tabler Icons** | `cdn.jsdelivr.net` | `@latest` (sem pin) | Ícones da interface |
| **PDF.js** | `cdnjs.cloudflare.com` | `3.11.174` | Extração de texto de PDFs; visualização de peças |
| **docx** | Bundle **inline** (~20k linhas) | Desconhecida | Geração de arquivos `.docx` para download |

---

## 3. Telas (Seções / Abas)

| ID interno | Label na nav | Visível para | Descrição |
|---|---|---|---|
| `s-painel` | Painel | coord + adv | Dashboard com métricas, prazos críticos e atalhos |
| `s-ocorrencia` | Ocorrência | coord | Cadastro de novo PAD via formulário + upload PDF |
| `s-pads` | PADs | coord + adv | Listagem de todos os PADs com filtro e busca |
| `s-modelos` | Modelos | coord + adv | Seleção e geração de modelos de documentos |
| `s-acomp` | Acompanhamento | coord + adv | Timeline processual por PAD; juntada de docs |
| `s-notif` | Notificações | coord + adv | Intimações, mensagens e alertas |
| `s-acesso` | Acessos | coord (oculto no nav) | Gestão de advogados/defensores |
| `s-calendario` | Calendário | coord + adv | Calendário de oitivas; mini-calendário para intimações |

**Roteamento:** função `goTab(t)` — mostra/oculta `.sec` via classe `on`.

---

## 4. Modais

| ID no DOM | Aberto por | Fechado por | Descrição |
|---|---|---|---|
| `modal-marcar-etapa` | `abrirModalMarcarEtapa(chave)` | `fecharModalMarcarEtapa()` | Registro de data/obs para etapa processual |
| `modal-doc-etapa` | `abrirDocEtapa(idx)` | `fecharModalDocEtapa()` | Visualização e ações sobre doc de etapa |
| `modal-etapa` | `abrirModalEtapa()` | `fecharModalEtapa()` | Adição de nova movimentação/etapa livre |
| `modal-juntada` | `abrirModalJuntada()` | `fecharModalJuntada()` | Upload de documento (PDF/vídeo) para etapa |
| `modal-mensagem` | `abrirModalMensagem()` | `fecharModalMensagem()` | Envio de mensagem coordenação → defensor |
| `modal-vincular` | `abrirModalVincular(advId)` | `fecharModalVincular()` | Vincular advogado a PADs |
| `modal-ver-msg` | `abrirVerMsg(portaria, alertaId)` | `fecharModalVerMsg()` | Leitura de mensagem recebida + resposta |
| `modal-conclusao` | `abrirModalConclusao()` | `fecharModalConclusao()` | Montagem de PAD completo + envio SGPE |
| `modal-player` | `abrirPlayerVideo(url, titulo)` | `fecharPlayerVideo()` | Player de vídeo de oitiva |
| `modal-oitiva` | `abrirModalOitiva(dataInicial, editId)` | `fecharModalOitiva()` | Cadastro/edição de oitiva no calendário |
| `modal-cal-intim` | `abrirCalIntimacao()` | `fecharCalIntimacao()` | Mini-calendário para seleção de datas de intimação |
| `modal-senha-inicial` (gerado via JS) | `mostrarModalSenhaInicial(nome, senha)` | `fecharModalSenhaInicial()` | Exibição de senha gerada para advogado |
| `modal-trocar-senha` (gerado via JS) | `abrirModalTrocarSenha(advId, primeiroAcesso)` | `fecharModalTrocarSenha()` | Troca de senha do advogado |
| overlay de juntar modelo (gerado via JS) | `juntarModeloNoPAD()` | clique no fundo | Confirmar juntada do modelo gerado ao PAD ativo |

---

## 5. Variáveis Globais de Estado e Dados

### 5.1 Sessão e autenticação

| Variável | Tipo | Valor inicial | Descrição |
|---|---|---|---|
| `SESSAO` | `Object` | `{ perfil: 'coord', nome: '', id: null }` | Sessão ativa. `perfil`: `'coord'` ou `'adv'` |
| `advDB` | `Array` | `[]` | Lista de advogados cadastrados `[{id, nome, oab, senha, pads:[]}]` |

### 5.2 Formulário de ocorrência

| Variável | Tipo | Valor inicial | Descrição |
|---|---|---|---|
| `DAD` | `Object` | `{nome:'',ipen:'',data:'',art:'Art. 50, VII da LEP',grau:'Grave',local:'',agentes:'',desc:'',defensor:'',portaria:'',sgpe:'',diretor:'Beltrano dos Santos'}` | Dados do formulário de ocorrência em memória |
| `OCORR_B64` | `String` | `''` | Base64 do arquivo de ocorrência carregado (PDF/imagem) |
| `OCORR_NOME` | `String` | `''` | Nome do arquivo de ocorrência |
| `dadosCarregados` | `Boolean` | `false` | Flag: indica se campos do formulário foram preenchidos |

### 5.3 Modelos de documentos

| Variável | Tipo | Descrição |
|---|---|---|
| `curMod` | `String\|null` | Chave do modelo atualmente aberto (ex: `'portaria'`, `'intimacao'`) |
| `CABECALHO` | `String` | Cabeçalho padrão dos documentos (vazio — preenchido via DAD) |
| `RODAPE` | `String` | Rodapé fixo: endereço do DEPEN/SC |
| `MODS` | `Object` | Dicionário com 6 modelos: `portaria`, `intimacao`, `termo`, `relatorio`, `oficio`, `decisao`. Cada um: `{titulo, icon, render(v)}` |

### 5.4 PADs e acompanhamento

| Variável | Tipo | Descrição |
|---|---|---|
| `padsData` | `Object` | Dicionário chave=portaria. Cada entrada: `{portaria, nome, ipen, art, defensor, statusCls, statusTxt, etapas:{...}, timeline:[...], intimacoes:[...]}` |
| `padAtivo` | `String\|null` | Portaria do PAD atualmente aberto no Acompanhamento |
| `etapaAtiva` | `Number\|null` | Índice da etapa clicada na timeline |
| `etapaParaModelo` | `Object` | Mapeamento chave-de-etapa → chave-de-modelo |
| `etapaTextos` | `Object` | Textos explicativos para cada etapa fixa processual |
| `docEtapaTexto` | `String` | Texto do documento gerado para etapa aberta |
| `docEtapaNome` | `String` | Nome do documento de etapa aberto |
| `juntadaArquivo` | `Object\|null` | Arquivo selecionado para juntada `{nome, tipo, b64, tamanho}` |
| `docsBase` | `Array` | Lista base de documentos esperados no PAD para montagem final |
| `PADS_DB` | `Array` | Dados de apoio para busca de apenados: `[{pad, nome, ipen, defensor, email}]` |

### 5.5 Notificações e mensagens

| Variável | Tipo | Descrição |
|---|---|---|
| `mensagensDB` | `Object` | `{ portaria: [{id, de, assunto, texto, data, lida}] }` — mensagens trocadas |
| `alertasMsgs` | `Array` | `[{id, portaria, assunto, remetente, data, lida}]` — alertas para coordenação |
| `alertasAdv` | `Object` | `{ advId: [{portaria, texto, data, lida}] }` — alertas para advogados |
| `verMsgPortaria` | `String\|null` | Portaria da mensagem aberta no modal |
| `assuntoLabels` | `Object` | Mapeamento chave-de-assunto → label legível |

### 5.6 Calendário e oitivas

| Variável | Tipo | Descrição |
|---|---|---|
| `oitivas` | `Array` | `[{id, pad, tipo, data, hora, local, obs, editId}]` |
| `calAno` | `Number` | Ano do calendário principal |
| `calMes` | `Number` | Mês do calendário principal (0–11) |
| `mcalAno` | `Number` | Ano do mini-calendário de intimação |
| `mcalMes` | `Number` | Mês do mini-calendário de intimação |
| `mcalSel` | `Array` | Datas selecionadas no mini-calendário |
| `MESES_CAL` | `Array` | Nomes dos meses em PT-BR |
| `DIAS_CAL` | `Array` | Abreviações dos dias da semana |

### 5.7 Auxiliares de modal

| Variável | Tipo | Descrição |
|---|---|---|
| `_trocarSenhaAdvId` | `Number\|null` | ID do advogado em processo de troca de senha |
| `_trocarSenhaPrimeiroAcesso` | `Boolean` | Flag: se é primeiro acesso (troca obrigatória) |
| `_etapaParaMarcar` | `String\|null` | Chave da etapa sendo marcada no modal |
| `advVincularId` | `Number\|null` | ID do advogado sendo vinculado no modal |

---

## 6. Funções (completo)

### 6.1 Autenticação e sessão

| Função | Assinatura | Descrição |
|---|---|---|
| `loginSel` | `(p)` | Seleciona perfil de login (`'coord'` ou `'adv'`); mostra campo de senha se `adv` |
| `loginEntrar` | `()` | Valida senha e autentica; detecta primeiro acesso |
| `loginSair` | `()` | Encerra sessão, restaura SESSAO padrão coord |
| `gerarSenhaAleatoria` | `()` | Gera string aleatória de 8 chars para novo advogado |
| `entrarComoAdvogado` | `(adv)` | Inicia sessão como advogado; atualiza badge de perfil |
| `mostrarModalSenhaInicial` | `(nome, senha)` | Exibe modal com senha gerada para entrega ao advogado |
| `copiarSenhaInicial` | `()` | Copia senha do modal para clipboard |
| `fecharModalSenhaInicial` | `()` | Fecha modal de senha inicial |
| `abrirModalTrocarSenha` | `(advId, primeiroAcesso)` | Abre modal de troca de senha |
| `confirmarTrocarSenha` | `()` | Valida e salva nova senha do advogado |
| `fecharModalTrocarSenha` | `()` | Fecha modal de troca de senha |

### 6.2 Gestão de advogados (módulo Acessos)

| Função | Assinatura | Descrição |
|---|---|---|
| `cadAdvogado` | `()` | Cadastra novo advogado com senha gerada; chama `mostrarModalSenhaInicial` |
| `renderAdvogados` | `()` | Renderiza tabela de advogados cadastrados |
| `remAdv` | `(id)` | Remove advogado pelo ID após confirmação |
| `abrirModalVincular` | `(advId)` | Abre modal de vinculação advogado ↔ PADs |
| `fecharModalVincular` | `()` | Fecha modal de vinculação |
| `confirmarVincular` | `()` | Salva vínculos selecionados |
| `atualizarDefensorNaPAD` | `(portaria, advId, vincular)` | Atualiza campo defensor no `padsData` |

### 6.3 Navegação e layout

| Função | Assinatura | Descrição |
|---|---|---|
| `goTab` | `(t)` | Troca de aba ativa; atualiza nav e seção visível; dispara renders específicos |

### 6.4 Ocorrência e cadastro de PAD

| Função | Assinatura | Descrição |
|---|---|---|
| `renderCadProcessos` | `()` | Renderiza seção de acessos |
| `buscarApenado` | `(val)` | Busca apenado em `PADS_DB` por nome/IPEN/portaria; exibe sugestões |
| `selecionarApenado` | `(ipen)` | Preenche campos do formulário com dados do apenado selecionado |
| `setNtField` | `(id, val)` | Helper: preenche campo de notificação |
| `montarEmail` | `()` | Monta preview do e-mail de intimação em tempo real |
| `enviarEmail` | `()` | Monta link `mailto:` com conteúdo da intimação |
| `copiarEmailTexto` | `()` | Copia texto do e-mail para clipboard |
| `copiarCelula` | `(btn, texto)` | Copia conteúdo de célula de tabela; feedback visual |
| `filtrarPADs` | `()` | Filtra tabela de PADs por texto de busca |
| `limparBusca` | `()` | Limpa filtro de busca |
| `handleDrop` | `(e)` | Handler de drop para upload de ocorrência |
| `handleFile` | `(f)` | Processa arquivo de ocorrência (PDF ou imagem) |
| `setStep` | `(n, state, txt)` | Atualiza step visual do processo de extração |
| `setProg` | `(p, txt)` | Atualiza barra de progresso de extração |
| `rodarExtracao` | `(nome, b64, tipo)` | Orquestra extração de dados do PDF/imagem |
| `extrairTextoPDFjs` | `(b64, callback)` | Extrai texto de PDF via PDF.js |
| `parsearTexto` | `(txt)` | Identifica campos (nome, IPEN, data, etc.) no texto extraído |
| `aplicarResposta` | `(txt)` | Aplica resultado da extração ao formulário |
| `setField` | `(id, v)` | Helper: preenche input por ID com marcação visual |
| `setFieldTA` | `(id, v)` | Helper: preenche textarea por ID com marcação visual |
| `syncDados` | `()` | Sincroniza campos do formulário → objeto `DAD` |
| `gerarNumPortaria` | `()` | Sugere número de portaria baseado em data e ano |
| `confirmarDados` | `()` | Valida formulário e executa `adicionarPADNaTabela()` |
| `limparOcorrencia` | `()` | Limpa todos os campos do formulário de ocorrência |
| `adicionarPADNaTabela` | `()` | Adiciona o PAD cadastrado à tabela de PADs e ao `padsData` |

### 6.5 Modelos de documentos

| Função | Assinatura | Descrição |
|---|---|---|
| `abrirModelo` | `(k)` | Abre modelo pelo código; navega para aba Modelos |
| `abrirModeloPAD` | `(portaria)` | Abre modelo pré-vinculado a uma portaria |
| `mostrarToast` | `(msg, tipo)` | Exibe notificação toast flutuante |
| `fmtDate` | `(s)` | Formata data `dd/mm/aaaa` → `dd de mês de aaaa` |
| `fmtDt` | `(s)` | Formata data para formato curto |
| `numExt` | `(n)` | Converte número para extenso em PT-BR |
| `esc` | `(s)` | Escapa HTML para uso em innerHTML |
| `getVals` | `()` | Retorna objeto com todos os valores do formulário de ocorrência |
| `upd` | `()` | Dispara atualização do preview do modelo |
| `selMod` | `(k)` | Seleciona modelo na lista lateral |
| `copiarDoc` | `()` | Copia texto do documento gerado para clipboard |
| `imprimirDoc` | `()` | Imprime documento via `window.open` + `document.write` |
| `imprimirDocEtapa` | `()` | Imprime documento de etapa aberto no modal |
| `gerarDocx` | `()` | Gera e baixa arquivo `.docx` do modelo atual via biblioteca `docx` |
| `gerarPDFCompleto` | `()` | Gera PDF que combina portaria gerada + PDF de ocorrência |
| `enviarEmailIntimacao` | `()` | Monta link `mailto:` para envio de intimação |
| `atualizarSelectPADModelos` | `()` | Atualiza dropdown de seleção de PAD nos modelos |
| `carregarDadosPADModelos` | `(portaria)` | Carrega dados do PAD selecionado para preencher o modelo |
| `selecionarPADPorSelect` | `(portaria)` | Handler do select de PAD nos modelos |

### 6.6 Acompanhamento processual (Timeline)

| Função | Assinatura | Descrição |
|---|---|---|
| `abrirAcompanhamento` | `(pad, nome, statusCls, statusTxt)` | Abre aba de acompanhamento para o PAD especificado |
| `renderAcomp` | `()` | Renderiza toda a seção de acompanhamento para `padAtivo` |
| `detectarModeloEtapa` | `(titulo)` | Detecta qual modelo de documento corresponde a uma etapa |
| `abrirDocEtapa` | `(idx)` | Abre modal com documento/lista de docs da etapa clicada |
| `copiarDocEtapa` | `()` | Copia texto do documento de etapa |
| `baixarDocEtapa` | `()` | Baixa `.docx` do documento de etapa |
| `fecharModalDocEtapa` | `()` | Fecha modal de documento de etapa |
| `vincularDocEtapa` | `()` | Vincula arquivo ao documento de etapa |
| `abrirEtapaFixa` | `(chave)` | Abre painel informativo de etapa fixa processual |
| `abrirModalMarcarEtapa` | `(chave)` | Abre modal para marcar etapa como concluída |
| `fecharModalMarcarEtapa` | `()` | Fecha modal de marcar etapa |
| `confirmarMarcarEtapa` | `()` | Salva data/obs da etapa marcada; chama `atualizarStatusPorEtapas` |
| `atualizarStatusPorEtapas` | `(portaria)` | Recalcula status do PAD baseado nas etapas concluídas |
| `abrirModalEtapa` | `()` | Abre modal para adicionar nova movimentação livre |
| `fecharModalEtapa` | `()` | Fecha modal de etapa livre |
| `confirmarEtapa` | `()` | Salva nova movimentação na timeline |
| `atualizarBadgeTabela` | `(portaria, cls, txt)` | Atualiza badge de status na tabela de PADs |
| `abrirModalJuntada` | `()` | Abre modal de juntada de documento |
| `fecharModalJuntada` | `()` | Fecha modal de juntada |
| `atualizarModalJuntada` | `()` | Atualiza campos do modal de juntada (tipo/descrição) |
| `handleJuntadaDrop` | `(e)` | Handler de drop para juntada |
| `handleJuntadaFile` | `(f)` | Processa arquivo para juntada (PDF/vídeo) |
| `validarJuntada` | `()` | Valida campos obrigatórios da juntada |
| `confirmarJuntada` | `()` | Confirma juntada do documento na etapa e timeline |
| `abrirPlayerVideo` | `(url, titulo)` | Abre player de vídeo inline |
| `fecharPlayerVideo` | `()` | Fecha player de vídeo |
| `juntarModeloNoPAD` | `()` | Prepara juntada do modelo de documento ao PAD ativo |
| `confirmarJuntarModelo` | `()` | Confirma juntada do modelo gerado |
| `abrirModalConclusao` | `()` | Abre modal de conclusão e montagem do PAD completo |
| `fecharModalConclusao` | `()` | Fecha modal de conclusão |
| `gerarIndicePAD` | `()` | Gera índice numerado das peças do PAD |
| `copiarIndice` | `()` | Copia índice para clipboard |
| `confirmarConclusao` | `()` | Finaliza montagem do PAD; gera PDF completo |
| `atualizarSelectPAD` | `()` | Atualiza dropdown de seleção de PAD no acompanhamento |
| `ativarCliqueMov` | `(el)` | Vincula click em item de movimentação na timeline |
| `criarItemMovimentacao` | `(portaria, titulo, sub, agora, corClass, icone)` | Cria elemento HTML de movimentação na timeline |
| `filtrarPorStatus` | `(tipo)` | Filtra tabela de PADs por status |

### 6.7 Notificações e mensagens

| Função | Assinatura | Descrição |
|---|---|---|
| `abrirModalMensagem` | `()` | Abre modal de envio de mensagem ao defensor |
| `fecharModalMensagem` | `()` | Fecha modal de mensagem |
| `renderHistoricoModal` | `(portaria)` | Renderiza histórico de mensagens de um PAD no modal |
| `enviarMensagem` | `()` | Envia mensagem; adiciona em `mensagensDB` e cria alerta |
| `adicionarNotifMensagem` | `(portaria, assunto, remetente, texto)` | Adiciona notificação de mensagem |
| `renderListaMsgsCoord` | `()` | Renderiza lista de mensagens para coordenação |
| `atualizarBadgeMsgs` | `()` | Atualiza contador no badge da aba Notificações |
| `marcarTodasLidas` | `()` | Marca todas as mensagens da coordenação como lidas |
| `marcarTodasLidasAdv` | `()` | Marca mensagens do advogado como lidas |
| `abrirVerMsg` | `(portaria, alertaId)` | Abre modal de leitura de mensagem |
| `renderHistoricoVerMsg` | `(portaria)` | Renderiza histórico no modal de leitura |
| `fecharModalVerMsg` | `()` | Fecha modal de leitura |
| `responderMensagem` | `()` | Envia resposta do advogado à coordenação |
| `adicionarAlertaAdv` | `(portaria, texto, data)` | Adiciona alerta para advogado |
| `atualizarBadgeAdv` | `(advId)` | Atualiza contador de alertas do advogado |
| `renderNotifAdv` | `(advId)` | Renderiza notificações do advogado logado |
| `abrirRespostaMensagem` | `(portaria)` | Prepara campo de resposta; navega para aba certa |

### 6.8 Calendário e oitivas

| Função | Assinatura | Descrição |
|---|---|---|
| `calNav` | `(d)` | Navega meses do calendário principal (+1/-1) |
| `renderCal` | `()` | Renderiza calendário principal com oitivas marcadas |
| `abrirModalOitiva` | `(dataInicial, editId)` | Abre modal de cadastro/edição de oitiva |
| `fecharModalOitiva` | `()` | Fecha modal de oitiva |
| `salvarOitiva` | `()` | Salva oitiva nova ou editada no array `oitivas` |
| `deletarOitiva` | `()` | Remove oitiva pelo ID |
| `abrirCalIntimacao` | `()` | Abre mini-calendário para seleção de datas de intimação |
| `fecharCalIntimacao` | `()` | Fecha mini-calendário |
| `mcalNav` | `(d)` | Navega meses do mini-calendário (+1/-1) |
| `renderMcal` | `()` | Renderiza mini-calendário de intimação |
| `atualizarMcalLista` | `()` | Atualiza lista de datas selecionadas no mini-calendário |
| `inserirDatasNaIntimacao` | `()` | Insere datas selecionadas no campo de intimação |

---

## 7. Dados Hardcoded (a migrar para storage)

### 7.1 `padsData` — 4 PADs de demonstração
- `'110/2025'` — Ciclano de Tal · status: Aguarda VEP · 8 etapas na timeline
- `'125/2025'` — Beltrano dos Santos · status: Andamento · 2 etapas
- `'033/2025'` — Fulano da Silva · status: Crítico · 2 etapas (prazo em aberto)
- `'098/2025'` — Fulano da Silva (646006) · status: Concluído · 2 etapas

### 7.2 `PADS_DB` — Array de apoio para busca
- 4 registros com campos: `{pad, nome, ipen, defensor, email}`

### 7.3 Dashboard — HTML estático
- Métricas (4 PADs, 1 crítico, 2 em prazo, 1 concluído) hardcoded no HTML
- Tabela de prazos críticos hardcoded no HTML

### 7.4 Notificações — HTML estático
- 3 notificações hardcoded no HTML (badge "3" na aba)

---

## 8. Modelos de Documentos (`MODS`)

| Chave | Título | Ícone | Exporta .docx | Exporta PDF |
|---|---|---|---|---|
| `portaria` | Portaria de Instauração | `ti-file-plus` | Sim | Sim (completo) |
| `intimacao` | Intimação ao Defensor | `ti-mail` | Sim | Não |
| `termo` | Termo de Oitiva | `ti-microphone` | Sim | Não |
| `relatorio` | Relatório do Conselho Disciplinar | `ti-report` | Sim | Não |
| `oficio` | Ofício à VEP | `ti-send` | Sim | Não |
| `decisao` | Decisão da Direção | `ti-gavel` | Sim | Não |

---

## 9. Etapas Processuais Fixas

| Chave | Título |
|---|---|
| `portaria` | Portaria de instauração |
| `intimacao` | Citação/Intimação |
| `oitivas` | Oitivas |
| `relatorio` | Relatório do Conselho Disciplinar |
| `defesa` | Defesa técnica |
| `decisao_dir` | Decisão da Direção |
| `decisao_jud` | Decisão judicial (VEP) |

---

## 10. Dados Persistíveis (escopo da Fase 1)

| Dado | Estrutura | Chave localStorage |
|---|---|---|
| PADs e timelines | `padsData` (Object) | `pad_padsData` |
| Dados da ocorrência em edição | `DAD` (Object) | `pad_dadOcorrencia` |
| Arquivo de ocorrência | `OCORR_B64` + `OCORR_NOME` | `pad_ocorrArquivo` |
| Oitivas | `oitivas` (Array) | `pad_oitivas` |
| Advogados cadastrados | `advDB` (Array) | `pad_advDB` |
| Mensagens trocadas | `mensagensDB` (Object) | `pad_mensagensDB` |
| Alertas da coordenação | `alertasMsgs` (Array) | `pad_alertasMsgs` |
| Alertas dos advogados | `alertasAdv` (Object) | `pad_alertasAdv` |
| Sessão ativa | `SESSAO` (Object) | `pad_sessao` |

---

## 11. Eventos do DOM (principais handlers inline)

| Elemento | Evento | Handler |
|---|---|---|
| Login coord | `onclick` | `loginSel('coord')` |
| Login adv | `onclick` | `loginSel('adv')` |
| Campo senha adv | `onkeydown` | `if(event.key==='Enter') loginEntrar()` |
| Botão entrar | `onclick` | `loginEntrar()` |
| Botão sair | `onclick` | `loginSair()` |
| Drop zone ocorrência | `ondragover/ondrop` | `handleDrop(e)` |
| Input file ocorrência | `onchange` | `handleFile(this.files[0])` |
| Tabs de navegação | `onclick` | `goTab('...')` |
| Linhas de PAD na tabela | `onclick` | `abrirAcompanhamento(...)` |
| Atalhos do painel | `onclick` | `abrirModelo('...')` |
| Campos do formulário | `oninput` | `syncDados()` |
| Drop zone juntada | `ondragover/ondrop` | `handleJuntadaDrop(e)` |
| Calendário nav prev/next | `onclick` | `calNav(-1/+1)` |
| Mini-cal nav prev/next | `onclick` | `mcalNav(-1/+1)` |
