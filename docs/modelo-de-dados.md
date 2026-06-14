# Modelo de Dados — PAD Digital
**Polícia Penal SC · Fase 1.5 — Arquitetura e Modelo de Dados**
**Data:** 2026-06-14 | **Versão:** 1.0

---

## Sumário

1. [Visão Geral](#1-visão-geral)
2. [Entidades](#2-entidades)
   - 2.1 [PAD](#21-pad)
   - 2.2 [Incidentado](#22-incidentado)
   - 2.3 [Defensor](#23-defensor)
   - 2.4 [Usuário](#24-usuário)
   - 2.5 [Oitiva](#25-oitiva)
   - 2.6 [Documento](#26-documento)
   - 2.7 [Etapa Processual](#27-etapa-processual)
   - 2.8 [Intimação](#28-intimação)
   - 2.9 [Mensagem](#29-mensagem)
   - 2.10 [Notificação](#210-notificação)
   - 2.11 [PRAZO_PROCESSUAL](#211-prazo_processual)
3. [Diagrama de Relacionamentos](#3-diagrama-de-relacionamentos)
4. [Timeline Processual Completa](#4-timeline-processual-completa)
5. [Proposta de Cálculo Automático de Prazos](#5-proposta-de-cálculo-automático-de-prazos)
6. [Estrutura Definitiva de Armazenamento](#6-estrutura-definitiva-de-armazenamento)
7. [Funcionalidades que Precisam de Adaptação](#7-funcionalidades-que-precisam-de-adaptação)

---

## 1. Visão Geral

O PAD Digital é um sistema de acompanhamento de Processos Administrativos Disciplinares da Polícia Penal de Santa Catarina, com base legal na LEP (Lei de Execução Penal), especialmente o Art. 50. O sistema é 100% client-side (localStorage), sem backend.

### Estado atual do modelo de dados (v1)

O modelo atual é **desnormalizado e acoplado**: os dados do incidentado (nome, IPEN, defensor) são duplicados dentro do objeto PAD, no índice `PADS_DB` e no objeto de sessão `DAD`. Não há entidade separada para Incidentado nem para Defensor.

### Objetivo do modelo v2

Normalizar as entidades, eliminar duplicações, introduzir `PRAZO_PROCESSUAL` como entidade de primeira classe e preparar o modelo para exportação/importação futura (JSON por PAD, backup ZIP, eventual API REST).

---

## 2. Entidades

---

### 2.1 PAD

**Finalidade:** Entidade central do sistema. Representa um Processo Administrativo Disciplinar — o processo formal instaurado contra um apenado que cometeu falta disciplinar.

**Chave primária:** `portaria` (string, formato `NNN/AAAA`, ex: `"110/2025"`)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `portaria` | `string` | Sim | Número da portaria de instauração. Chave única |
| `incidentado_ipen` | `string` | Sim | FK → Incidentado.ipen |
| `art` | `string` | Sim | Fundamento legal (ex: `"Art. 50, VII LEP"`) |
| `defensor_id` | `string \| null` | Não | FK → Defensor.id. Null se sem defensor |
| `statusCls` | `enum` | Sim | Classe CSS do status: `sa \| sw \| sc \| sp` |
| `statusTxt` | `string` | Sim | Rótulo exibível do status |
| `etapas` | `EtapaMap` | Sim | Mapa de etapas concluídas (ver §2.7) |
| `timeline` | `EventoTimeline[]` | Sim | Lista cronológica de eventos (ver §2.7) |
| `intimacoes` | `Intimacao[]` | Não | Registros de intimação (ver §2.8) |
| `prazo` | `PRAZO_PROCESSUAL` | Recomendado | Controle de prazo (ver §2.11) |
| `criadoEm` | `ISO8601 string` | Sim | Data/hora de criação do registro |
| `atualizadoEm` | `ISO8601 string` | Sim | Data/hora da última modificação |

**Status possíveis:**

| Código | Rótulo | Significado |
|---|---|---|
| `sa` | Andamento | PAD em tramitação normal |
| `sw` | Aguarda VEP | Aguardando homologação judicial da decisão |
| `sc` | Concluído | PAD encerrado e arquivado |
| `sp` | Crítico | Prazo vencido ou situação urgente |

**Regras de negócio:**
- `portaria` é imutável após criação
- Não pode haver dois PADs com a mesma `portaria`
- `statusCls` deve ser recalculado automaticamente quando `PRAZO_PROCESSUAL.status` mudar para `vencido`
- Um PAD só pode ir para status `sc` (Concluído) após a etapa `arquivamento` ser marcada
- Um PAD sem defensor (`defensor_id = null`) deve gerar notificação quando atingir a etapa `defesa`

**Exemplo JSON:**
```json
{
  "portaria": "110/2025",
  "incidentado_ipen": "000001",
  "art": "Art. 50, VII LEP",
  "defensor_id": "def-leila-001",
  "statusCls": "sw",
  "statusTxt": "Aguarda VEP",
  "etapas": {
    "portaria":    { "data": "12/11/2025", "obs": "Beltrano dos Santos" },
    "intimacao":   { "data": "18/11/2025", "obs": "DPP" },
    "oitivas":     { "data": "27/02/2026", "obs": "Incidentado e testemunhas" },
    "relatorio":   { "data": "04/03/2026", "obs": "Conselho Disciplinar" },
    "defesa":      { "data": "10/03/2026", "obs": "Leila DPP" },
    "decisao_dir": { "data": "13/03/2026", "obs": "Beltrano dos Santos" },
    "decisao_jud": { "data": "",           "obs": "" }
  },
  "timeline": [
    {
      "titulo": "Portaria nº 110/2025 — instauração",
      "data": "12/11/2025",
      "obs": "Beltrano dos Santos",
      "docs": [],
      "tipo": "portaria"
    }
  ],
  "intimacoes": [
    {
      "titulo": "Intimado — oitiva do incidentado",
      "info": "Leila DPP — 24/02/2026",
      "ok": "✓ Confirmado pelo defensor"
    }
  ],
  "prazo": { "ref": "prazo-110-2025" },
  "criadoEm": "2025-11-12T08:00:00.000Z",
  "atualizadoEm": "2026-03-13T14:30:00.000Z"
}
```

---

### 2.2 Incidentado

**Finalidade:** Representa o apenado (preso) que é sujeito passivo do PAD. Atualmente seus dados estão duplicados dentro do objeto PAD e no índice `PADS_DB`. A v2 extrai isso para entidade própria.

**Chave primária:** `ipen` (string, número de prontuário do sistema SGPE/DEAP)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `ipen` | `string` | Sim | Identificação no SGPE. Chave única. Ex: `"000001"` |
| `nome` | `string` | Sim | Nome completo |
| `dataNascimento` | `string \| null` | Não | Data de nascimento (DD/MM/AAAA) |
| `unidadePrisional` | `string \| null` | Não | Unidade onde está recolhido |
| `regime` | `enum \| null` | Não | `fechado \| semiaberto \| aberto` |
| `sgpeUrl` | `string \| null` | Não | Link direto no SGPE (futuro) |
| `criadoEm` | `ISO8601 string` | Sim | |

**Relacionamentos:**
- `1 Incidentado → N PADs` (um mesmo apenado pode ter múltiplos PADs ao longo do tempo)

**Regras de negócio:**
- `ipen` é chave única — não pode haver dois incidentados com o mesmo IPEN
- Nome e IPEN são obrigatórios; demais campos são facultativos na v1
- Futuramente: integração com SGPE para preenchimento automático via IPEN

**Exemplo JSON:**
```json
{
  "ipen": "000001",
  "nome": "Ciclano de Tal",
  "dataNascimento": null,
  "unidadePrisional": "Penitenciária de Florianópolis",
  "regime": "fechado",
  "sgpeUrl": null,
  "criadoEm": "2025-11-12T08:00:00.000Z"
}
```

---

### 2.3 Defensor

**Finalidade:** Representa o defensor técnico (advogado, defensor público) responsável pela defesa do incidentado em um ou mais PADs. Atualmente apenas nome e e-mail são armazenados de forma espalhada em `PADS_DB` e `padsData`.

**Chave primária:** `id` (string gerada — `"def-" + slug do nome`)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | Chave gerada. Ex: `"def-leila-dpp-001"` |
| `nome` | `string` | Sim | Nome completo |
| `tipo` | `enum` | Sim | `dpp \| dpe \| oab \| outro` |
| `orgao` | `string \| null` | Não | Instituição (ex: `"DPP"`, `"DPE/SC — 27ª Capital"`) |
| `oab` | `string \| null` | Não | Número OAB (apenas para advogados particulares) |
| `email` | `string \| null` | Não | E-mail para contato e login no portal |
| `telefone` | `string \| null` | Não | Telefone de contato |
| `ativo` | `boolean` | Sim | Se false, não aparece em novos cadastros |
| `senhaHash` | `string \| null` | Não | Hash SHA-256 da senha para login no portal (Fase 3) |
| `criadoEm` | `ISO8601 string` | Sim | |

**Relacionamentos:**
- `1 Defensor → N PADs` (mesmo defensor pode atender múltiplos incidentados)
- `1 Defensor → N Mensagens` (canal de comunicação)

**Regras de negócio:**
- E-mail deve ser único entre defensores ativos (é o login do portal)
- Defensor desativado (`ativo: false`) não pode fazer login mas seus dados históricos são preservados
- Tipo `dpe` e `dpp` não exigem número OAB

**Exemplo JSON:**
```json
{
  "id": "def-leila-dpp-001",
  "nome": "Leila DPP",
  "tipo": "dpp",
  "orgao": "DPP — Defensoria Pública do Preso",
  "oab": null,
  "email": "leila@dpp.gov.br",
  "telefone": null,
  "ativo": true,
  "senhaHash": null,
  "criadoEm": "2025-11-12T08:00:00.000Z"
}
```

---

### 2.4 Usuário

**Finalidade:** Representa um servidor do CEPEN com acesso ao sistema (perfil `coord`). Atualmente apenas `nome` é armazenado na sessão, sem entidade própria.

**Chave primária:** `id` (string)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | Ex: `"usr-beltrano-001"` |
| `nome` | `string` | Sim | Nome exibido no sistema |
| `cargo` | `string \| null` | Não | Cargo funcional |
| `perfil` | `enum` | Sim | `coord \| adv` |
| `senhaHash` | `string \| null` | Não | Hash SHA-256 (Fase 3) |
| `ativo` | `boolean` | Sim | |
| `criadoEm` | `ISO8601 string` | Sim | |
| `ultimoAcesso` | `ISO8601 string \| null` | Não | |

**Relacionamentos:**
- `Usuário` registra eventos na `timeline` dos PADs (campo `obs` contém o nome do servidor)
- `SESSAO` é o estado em memória de um Usuário ou Defensor autenticado

**Estado de sessão (SESSAO — objeto em memória, não persistido):**
```json
{
  "perfil": "coord",
  "nome": "Beltrano dos Santos",
  "id": "usr-beltrano-001"
}
```

**Regras de negócio:**
- Sessão não é persistida entre aberturas (força login a cada sessão — decisão intencional)
- Sistema v1 não tem cadastro de usuários — nome é digitado livremente; v2 deve manter lista de usuários
- Perfil `adv` = Defensor autenticado; perfil `coord` = Servidor CEPEN

**Exemplo JSON:**
```json
{
  "id": "usr-beltrano-001",
  "nome": "Beltrano dos Santos",
  "cargo": "Diretor de Segurança",
  "perfil": "coord",
  "senhaHash": null,
  "ativo": true,
  "criadoEm": "2025-01-01T00:00:00.000Z",
  "ultimoAcesso": "2026-06-14T08:00:00.000Z"
}
```

---

### 2.5 Oitiva

**Finalidade:** Registro de uma audiência de coleta de depoimento — do incidentado, de testemunhas ou de agentes. É a principal atividade da fase de Instrução do PAD.

**Chave primária:** `id` (string UUID gerada no momento do cadastro)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | UUID. Ex: `"oit-1718000000000"` |
| `pad` | `string` | Sim | FK → PAD.portaria |
| `nome` | `string` | Não | Nome do depoente (para testemunhas) |
| `tipo` | `enum` | Sim | `incidentado \| testemunha \| agente \| outro` |
| `data` | `string` | Sim | Formato `YYYY-MM-DD` |
| `hora` | `string` | Sim | Formato `HH:MM` |
| `ipen` | `string \| null` | Não | IPEN do incidentado (preenchido quando tipo = incidentado) |
| `defensor` | `string \| null` | Não | Nome do defensor presente |
| `video` | `boolean` | Não | Se a oitiva será por videoconferência |
| `obs` | `string \| null` | Não | Local ou observações (ex: `"Sala 2"`) |
| `realizada` | `boolean` | Não | Se a oitiva já foi realizada |
| `ataUrl` | `string \| null` | Não | Futuramente: link para o documento de ata |
| `criadoEm` | `ISO8601 string` | Sim | |

**Relacionamentos:**
- `N Oitivas → 1 PAD`
- `1 Oitiva → 1 EventoTimeline` (quando realizada, gera entrada automática na timeline)
- `1 Oitiva → 0..1 Documento` (futuramente: ata anexada)

**Regras de negócio:**
- Ao salvar uma oitiva com `realizada: true`, deve ser gerado um `EventoTimeline` automaticamente
- Não pode haver duas oitivas do mesmo tipo para o mesmo PAD na mesma data/hora
- Se `tipo = incidentado`, o campo `ipen` deve ser preenchido com o IPEN do incidentado do PAD

**Exemplo JSON:**
```json
{
  "id": "oit-1740614400000",
  "pad": "110/2025",
  "nome": "Ciclano de Tal",
  "tipo": "incidentado",
  "data": "2026-02-27",
  "hora": "09:00",
  "ipen": "000001",
  "defensor": "Leila DPP",
  "video": false,
  "obs": "Sala de audiências — bloco B",
  "realizada": true,
  "ataUrl": null,
  "criadoEm": "2026-02-20T10:00:00.000Z"
}
```

---

### 2.6 Documento

**Finalidade:** Representa qualquer arquivo vinculado a um PAD — pode ser um documento gerado pelo sistema (DOCX/PDF) ou um arquivo externo enviado via upload (boletim de ocorrência, ata, etc.).

**Chave primária:** `id` (string UUID)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | UUID. Ex: `"doc-1718000000000"` |
| `pad` | `string` | Sim | FK → PAD.portaria |
| `nome` | `string` | Sim | Nome exibível do documento |
| `tipo` | `enum` | Sim | `portaria \| intimacao \| ata_oitiva \| relatorio \| oficio \| decisao \| boletim \| outro` |
| `origem` | `enum` | Sim | `gerado \| upload` |
| `mimeType` | `string \| null` | Não | Ex: `"application/pdf"`, `"application/vnd.openxmlformats..."` |
| `tamanhoBytes` | `number \| null` | Não | Tamanho em bytes |
| `b64` | `string \| null` | Não | Conteúdo base64 (apenas para documentos pequenos / localStorage) |
| `etapaVinculada` | `string \| null` | Não | FK → EtapaProcessual.codigo |
| `oitivaVinculada` | `string \| null` | Não | FK → Oitiva.id |
| `criadoEm` | `ISO8601 string` | Sim | |
| `criadoPor` | `string \| null` | Não | FK → Usuario.id |

**Relacionamentos:**
- `N Documentos → 1 PAD`
- `1 Documento → 0..1 Etapa` (documento pertence a uma fase do processo)
- `1 Documento → 0..1 Oitiva` (ata de oitiva vinculada)
- `EventoTimeline.docs[]` referencia IDs de Documentos

**Regras de negócio:**
- Documentos do tipo `upload` com `b64` não devem exceder ~1 MB para não saturar o localStorage (5-10 MB por origem)
- Documentos `gerados` (DOCX/PDF) não precisam ser armazenados em b64 — apenas metadados + download sob demanda
- O campo `b64` da ocorrência (`OCORR_B64`) atualmente funciona como documento do tipo `boletim`; na v2 deve ser normalizado aqui

**Modelos de documento atualmente disponíveis:**

| Modelo | Tipo | Descrição |
|---|---|---|
| Portaria | `portaria` | Instauração do PAD |
| Intimação | `intimacao` | Notificação ao defensor |
| Termo de declarações | `ata_oitiva` | Oitiva do apenado |
| Relatório conclusivo | `relatorio` | Parecer do Conselho Disciplinar |
| Ofício à VEP | `oficio` | Encaminhamento judicial |
| Decisão da direção | `decisao` | Resultado do PAD |

**Exemplo JSON:**
```json
{
  "id": "doc-1747044000000",
  "pad": "110/2025",
  "nome": "Portaria 110-2025.docx",
  "tipo": "portaria",
  "origem": "gerado",
  "mimeType": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "tamanhoBytes": 24576,
  "b64": null,
  "etapaVinculada": "portaria",
  "oitivaVinculada": null,
  "criadoEm": "2025-11-12T08:30:00.000Z",
  "criadoPor": "usr-beltrano-001"
}
```

---

### 2.7 Etapa Processual

**Finalidade:** Representa uma fase formal do rito do PAD. Cada etapa tem data de conclusão e observações. A coleção de etapas de um PAD indica até onde o processo avançou.

**Estrutura atual (EtapaMap — objeto chave→valor dentro do PAD):**

No modelo atual, `etapas` é um objeto aninhado dentro de PAD, com chaves fixas. Na v2, cada etapa pode ser uma entidade standalone para permitir histórico e prorrogações.

**Campos de cada etapa:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `codigo` | `string` | Sim | Identificador da etapa (ver tabela abaixo) |
| `pad` | `string` | Sim | FK → PAD.portaria |
| `data` | `string` | Não | Data de conclusão (DD/MM/AAAA). Vazio = pendente |
| `obs` | `string` | Não | Observação (nome do responsável, órgão, etc.) |
| `responsavel` | `string \| null` | Não | FK → Usuario.id (futuro) |

**Etapas do rito atual (7 etapas):**

| Código | Nome exibível | Descrição |
|---|---|---|
| `portaria` | Portaria | Instauração do PAD |
| `intimacao` | Intimação | Notificação ao incidentado e defensor |
| `oitivas` | Oitivas | Realização das audiências |
| `relatorio` | Relatório | Elaboração do relatório conclusivo pelo CD |
| `defesa` | Defesa Técnica | Apresentação da defesa pelo defensor |
| `decisao_dir` | Decisão da Direção | Homologação pela direção da unidade |
| `decisao_jud` | Decisão Judicial | Homologação pela Vara de Execuções Penais |

**Etapas propostas para o rito completo (v2 — ver §4):**

Adicionar: `autuacao`, `citacao`, `defesa_previa`, `instrucao`, `execucao_sancao`, `arquivamento`

**Regras de negócio:**
- Etapas têm ordem lógica mas não estrita — o sistema não bloqueia avançar/retroceder
- Uma etapa com `data` preenchida está concluída; sem data está pendente
- A conclusão de `arquivamento` muda `PAD.statusCls` para `sc`
- A conclusão de `decisao_dir` sem `decisao_jud` muda status para `sw` (aguarda VEP)

**Exemplo JSON:**
```json
{
  "codigo": "portaria",
  "pad": "110/2025",
  "data": "12/11/2025",
  "obs": "Beltrano dos Santos",
  "responsavel": "usr-beltrano-001"
}
```

---

### 2.8 Intimação

**Finalidade:** Registro de que o incidentado ou seu defensor foi formalmente notificado sobre um ato processual (oitiva, prazo de defesa, decisão). É evidência de cumprimento do contraditório e ampla defesa.

**Chave primária:** `id` (string UUID — não existe na v1; atualmente é apenas item de array)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | UUID |
| `pad` | `string` | Sim | FK → PAD.portaria |
| `titulo` | `string` | Sim | Descrição do ato intimado (ex: `"Intimado — oitiva do incidentado"`) |
| `destinatario` | `string \| null` | Não | Nome do intimado (incidentado ou defensor) |
| `data` | `string \| null` | Não | Data da intimação (DD/MM/AAAA) |
| `info` | `string` | Sim | Detalhe textual (defensor + data, conforme atual) |
| `confirmado` | `boolean` | Não | Se houve confirmação de recebimento |
| `ok` | `string \| null` | Não | Texto de confirmação (ex: `"✓ Confirmado pelo defensor"`) |
| `documentoVinculado` | `string \| null` | Não | FK → Documento.id (carta de intimação gerada) |

**Regras de negócio:**
- Toda oitiva deve ter uma intimação correspondente registrada
- A intimação é pré-requisito para contar o prazo de defesa (10 dias a partir da data de intimação)
- Intimação sem `confirmado = true` deve gerar alerta de pendência

**Exemplo JSON:**
```json
{
  "id": "int-1740268800000",
  "pad": "110/2025",
  "titulo": "Intimado — oitiva do incidentado",
  "destinatario": "Leila DPP",
  "data": "24/02/2026",
  "info": "Leila DPP — 24/02/2026",
  "confirmado": true,
  "ok": "✓ Confirmado pelo defensor",
  "documentoVinculado": null
}
```

---

### 2.9 Mensagem

**Finalidade:** Canal de comunicação entre servidor CEPEN (coord) e defensor (adv). Atualmente armazenado como `mensagensDB` — objeto indexado por `pad_portaria`, com arrays de mensagens.

**Chave primária:** `id` (string UUID)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | UUID |
| `pad` | `string` | Sim | FK → PAD.portaria (o contexto da mensagem) |
| `de` | `string` | Sim | `"coord"` ou FK → Defensor.id |
| `para` | `string` | Sim | `"coord"` ou FK → Defensor.id |
| `texto` | `string` | Sim | Corpo da mensagem |
| `lida` | `boolean` | Sim | Se o destinatário já leu |
| `criadoEm` | `ISO8601 string` | Sim | |

**Estrutura atual (`mensagensDB`):**
```json
{
  "110/2025": [
    { "de": "coord", "para": "leila@dpp.gov.br", "texto": "...", "lida": false, "data": "..." }
  ]
}
```

**Relacionamentos:**
- `N Mensagens → 1 PAD`
- `N Mensagens → 1 Defensor` (como remetente ou destinatário)

**Regras de negócio:**
- Mensagens não podem ser editadas após envio
- Badge de notificação na aba "Notificações" conta mensagens com `lida = false` para o perfil atual
- `alertasMsgs` (array) e `alertasAdv` (object) são estruturas derivadas de Mensagem — contagens de não lidas por PAD

**Exemplo JSON:**
```json
{
  "id": "msg-1718460000000",
  "pad": "110/2025",
  "de": "coord",
  "para": "def-leila-dpp-001",
  "texto": "Informamos que a oitiva do incidentado está agendada para 27/02/2026 às 09h00.",
  "lida": false,
  "criadoEm": "2026-02-20T14:00:00.000Z"
}
```

---

### 2.10 Notificação

**Finalidade:** Alerta gerado automaticamente pelo sistema sobre eventos relevantes de um PAD — prazo vencendo, defesa juntada, oitiva reagendada, etc. Diferente de Mensagem (que é comunicação bilateral), Notificação é gerada pelo sistema.

**Chave primária:** `id` (string UUID)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | UUID |
| `pad` | `string \| null` | Não | FK → PAD.portaria (null = notificação global) |
| `tipo` | `enum` | Sim | `prazo \| defesa \| oitiva \| decisao \| sistema` |
| `nivel` | `enum` | Sim | `info \| aviso \| critico` |
| `titulo` | `string` | Sim | Título exibido (ex: `"PAD 033/2025 — prazo de defesa vence hoje"`) |
| `descricao` | `string` | Não | Subtítulo com detalhes |
| `lida` | `boolean` | Sim | Se o usuário leu/dispensou |
| `criadoEm` | `ISO8601 string` | Sim | |
| `expiraEm` | `ISO8601 string \| null` | Não | Após esta data, a notificação é automaticamente dispensada |

**Mapeamento de ícone CSS por nível:**

| Nível | Classe CSS | Cor |
|---|---|---|
| `info` | `.nii` | Cinza (#F0F0F0) |
| `aviso` | `.niw` | Âmbar (#FAEEDA) |
| `critico` | `.nir` | Vermelho (#FCEBEB) |
| `concluido` | `.nio` | Verde (#EAF3DE) |

**Regras de negócio:**
- Notificações de prazo são geradas automaticamente a partir de `PRAZO_PROCESSUAL`
- Notificação de nível `critico` não pode ser dispensada sem ação — deve exigir confirmação
- Notificações com `expiraEm` passado são removidas automaticamente no próximo carregamento

**Exemplo JSON:**
```json
{
  "id": "notif-1749859200000",
  "pad": "033/2025",
  "tipo": "prazo",
  "nivel": "critico",
  "titulo": "PAD 033/2025 — prazo de defesa vence hoje",
  "descricao": "Fulano da Silva (000002) — sem defensor constituído",
  "lida": false,
  "criadoEm": "2026-06-14T09:00:00.000Z",
  "expiraEm": "2026-06-14T23:59:59.000Z"
}
```

---

### 2.11 PRAZO_PROCESSUAL

**Finalidade:** Entidade nova — não existe na v1. Centraliza toda a lógica de prazos legais do PAD, permitindo cálculo automático de datas, status de urgência e histórico de prorrogações. Baseado no Art. 59 da LEP e RD/SC.

**Chave primária:** `id` (string, formato `"prazo-" + portaria normalizada`)

**Campos:**

| Campo | Tipo | Obrigatório | Descrição |
|---|---|---|---|
| `id` | `string` | Sim | Ex: `"prazo-110-2025"` |
| `pad` | `string` | Sim | FK → PAD.portaria |
| `dataInstauracao` | `string` | Sim | Data da portaria (ISO8601). Marco zero do prazo |
| `prazoLegalDias` | `number` | Sim | Prazo total previsto em lei. Padrão LEP: 30 dias |
| `prorrogacoes` | `Prorrogacao[]` | Não | Histórico de prorrogações (ver sub-entidade) |
| `dataLimite` | `string` | Sim (calculado) | `dataInstauracao + prazoLegalDias + Σprorrogacoes`. ISO8601 |
| `diasRestantes` | `number` | Sim (calculado) | `dataLimite - hoje`. Negativo = vencido |
| `status` | `enum` | Sim (calculado) | `ok \| atencao \| critico \| vencido` |
| `alertas` | `AlertaPrazo[]` | Não | Configuração de alertas antecipados |
| `observacoes` | `string \| null` | Não | Notas sobre o prazo (motivo de prorrogações, etc.) |
| `atualizadoEm` | `ISO8601 string` | Sim | |

**Sub-entidade Prorrogacao:**

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | `string` | UUID |
| `diasAdicionais` | `number` | Quantidade de dias prorrogados |
| `dataDecreto` | `string` | Data da decisão de prorrogação (ISO8601) |
| `motivo` | `string` | Justificativa legal |
| `autorizadoPor` | `string` | Nome/cargo de quem autorizou |

**Sub-entidade AlertaPrazo:**

| Campo | Tipo | Descrição |
|---|---|---|
| `diasAntes` | `number` | Quantos dias antes do vencimento disparar |
| `nivel` | `enum` | `info \| aviso \| critico` |
| `mensagem` | `string` | Texto da notificação |
| `disparado` | `boolean` | Se este alerta já foi gerado |

**Regras de status:**

| Condição | Status | Classe CSS PAD |
|---|---|---|
| `diasRestantes > 10` | `ok` | `sa` (andamento) |
| `diasRestantes entre 1 e 10` | `atencao` | `sw` (atenção) |
| `diasRestantes = 0` | `critico` | `sp` (crítico) |
| `diasRestantes < 0` | `vencido` | `sp` (crítico) |

**Regras de negócio:**
- `dataLimite` e `diasRestantes` são SEMPRE calculados, nunca editados manualmente
- Prazo padrão LEP: 30 dias para conclusão do PAD (Art. 59 LEP)
- Prazo de defesa do incidentado: 10 dias contados da data de intimação (Art. 59 §1 LEP)
- Prorrogação exige motivo e autorização — cada prorrogação é registrada no histórico
- O sistema deve recalcular `diasRestantes` e `status` ao carregar a página (no `storageInit`)

**Exemplo JSON:**
```json
{
  "id": "prazo-110-2025",
  "pad": "110/2025",
  "dataInstauracao": "2025-11-12T00:00:00.000Z",
  "prazoLegalDias": 30,
  "prorrogacoes": [
    {
      "id": "prorr-001",
      "diasAdicionais": 30,
      "dataDecreto": "2025-12-10T00:00:00.000Z",
      "motivo": "Complexidade da instrução — múltiplas testemunhas",
      "autorizadoPor": "Beltrano dos Santos — Diretor"
    }
  ],
  "dataLimite": "2026-01-11T00:00:00.000Z",
  "diasRestantes": -154,
  "status": "vencido",
  "alertas": [
    {
      "diasAntes": 10,
      "nivel": "aviso",
      "mensagem": "PAD 110/2025 vence em 10 dias",
      "disparado": true
    },
    {
      "diasAntes": 3,
      "nivel": "critico",
      "mensagem": "PAD 110/2025 vence em 3 dias — providências urgentes",
      "disparado": true
    }
  ],
  "observacoes": "Prorrogado em dezembro/2025 por decisão da direção.",
  "atualizadoEm": "2026-06-14T08:00:00.000Z"
}
```

---

## 3. Diagrama de Relacionamentos

```
USUÁRIO ──────────────────────────────────────────────┐
  (coord)                                              │ registra eventos
                                                       ▼
INCIDENTADO ──── (1:N) ──── PAD ◄───── (1:1) ────── PRAZO_PROCESSUAL
   │ ipen                    │ portaria                    │
   │                         │                             │ gera
   │                    ┌────┴─────────────────┐           ▼
   │               ETAPA_PROCESSUAL       NOTIFICAÇÃO
   │                    │
   │               EVENTO_TIMELINE
   │                    │ docs[]
   │               DOCUMENTO ◄──────── (N:1) ── OITIVA
   │                                               │
DEFENSOR ──── (1:N) ──── PAD (via defensor_id)    │
   │                                               │
   └──── (1:N) ──── MENSAGEM ──── (N:1) ──── PAD  │
                                                   │
   └──────────────────────────── (1:N) ──── OITIVA │
         (defensor_id na oitiva)                   ▼
                                            INTIMAÇÃO
```

**Cardinalidades resumidas:**

| Relacionamento | Cardinalidade |
|---|---|
| Incidentado → PADs | 1:N |
| PAD → Etapas | 1:N (fixo, 7-13 etapas) |
| PAD → Timeline | 1:N |
| PAD → Oitivas | 1:N |
| PAD → Documentos | 1:N |
| PAD → Intimações | 1:N |
| PAD → Mensagens | 1:N |
| PAD → PRAZO_PROCESSUAL | 1:1 |
| PAD → Notificações | 1:N |
| Defensor → PADs | 1:N |
| Oitiva → Documento (ata) | 1:0..1 |

---

## 4. Timeline Processual Completa

O rito atual tem 7 etapas. O rito completo previsto na LEP e no Regulamento Disciplinar tem 9 fases formais:

```
FASE 1 — INSTAURAÇÃO
  Portaria
  └─ Dados: número, data, artigo infringido, nome do incidentado, IPEN
  └─ Prazo: marco zero (dia 0)
  └─ Documento gerado: Portaria de Instauração

FASE 2 — AUTUAÇÃO
  Autuação do processo
  └─ Dados: data de autuação, responsável, número do processo
  └─ Prazo: deve ocorrer em até 3 dias úteis da portaria

FASE 3 — CITAÇÃO / INTIMAÇÃO INICIAL
  Citação do incidentado e notificação do defensor
  └─ Dados: data, forma (pessoal/edital), defensor notificado, confirmação
  └─ Prazo: marco zero para contagem do prazo de defesa (10 dias)
  └─ Documento gerado: Carta de Intimação

FASE 4 — DEFESA PRÉVIA
  Apresentação de defesa prévia (contestação liminar)
  └─ Dados: data de recebimento, defensor, resumo
  └─ Prazo: 10 dias a contar da intimação
  └─ Documento externo: peça de defesa

FASE 5 — INSTRUÇÃO
  Coleta de provas e realização de oitivas
  └─ Sub-fases:
     ├─ Oitiva do incidentado
     ├─ Oitiva de testemunhas (N)
     ├─ Oitiva de agentes (N)
     └─ Coleta de documentos/provas materiais
  └─ Documentos gerados: termos de declaração por oitiva

FASE 6 — RELATÓRIO FINAL
  Elaboração do relatório conclusivo pelo Conselho Disciplinar
  └─ Dados: data, membros do CD, conclusão (procedente/improcedente), sanção proposta
  └─ Documento gerado: Relatório Conclusivo

FASE 7 — DECISÃO DA DIREÇÃO
  Homologação (ou não) pela direção da unidade prisional
  └─ Dados: data, diretor, decisão (homologa/revisa/arquiva), sanção aplicada
  └─ Documento gerado: Decisão da Direção

FASE 8 — EXECUÇÃO DA SANÇÃO
  Aplicação da sanção disciplinar (se procedente)
  └─ Dados: tipo de sanção, início, fim, unidade de cumprimento
  └─ Sanções possíveis: advertência verbal, repreensão, suspensão de saídas,
     regressão de regime, inclusão em RDD, isolamento disciplinar

FASE 9 — DECISÃO JUDICIAL / ARQUIVAMENTO
  ├─ Se sanção grave: encaminhamento à VEP para homologação judicial
  │   └─ Documento gerado: Ofício à VEP
  │   └─ Prazo: aguarda retorno judicial (sem prazo fixo)
  └─ Arquivamento
      └─ Dados: data, número de caixa/pasta, responsável
      └─ PAD vai para status Concluído (sc)
```

**Mapeamento etapas atuais → rito completo:**

| Etapa atual (v1) | Fase do rito completo |
|---|---|
| `portaria` | Fase 1 — Instauração |
| *(ausente)* | Fase 2 — Autuação |
| `intimacao` | Fase 3 — Citação |
| *(ausente)* | Fase 4 — Defesa Prévia |
| `oitivas` | Fase 5 — Instrução |
| `relatorio` | Fase 6 — Relatório Final |
| `defesa` | Fase 6.5 — (posição atual incorreta) |
| `decisao_dir` | Fase 7 — Decisão da Direção |
| *(ausente)* | Fase 8 — Execução da Sanção |
| `decisao_jud` | Fase 9 — Decisão Judicial |
| *(ausente)* | Fase 9 — Arquivamento |

> **Nota:** Na v1, `defesa` aparece após `relatorio`, o que pode refletir o fluxo real da unidade. A posição correta pela LEP é antes do relatório (o CD elabora o relatório após apreciar a defesa). Confirmar com a equipe jurídica antes de reordenar.

---

## 5. Proposta de Cálculo Automático de Prazos

### 5.1 Prazos legais relevantes (LEP + RD/SC)

| Prazo | Base Legal | Dias | Marco Inicial |
|---|---|---|---|
| Conclusão do PAD | Art. 59 LEP | 30 dias | Data da Portaria |
| Prorrogação máxima | Art. 59 §1 LEP | +30 dias | Data da prorrogação |
| Defesa do incidentado | Princípio do contraditório | 10 dias | Data da intimação |
| Homologação judicial (VEP) | Resolução CNJ | sem prazo fixo | Data da decisão da direção |
| Isolamento preventivo | Art. 60 LEP | máx. 10 + 20 dias | Data do isolamento |

### 5.2 Algoritmo de cálculo

```javascript
/**
 * Recalcula diasRestantes e status de um PRAZO_PROCESSUAL.
 * Deve ser chamado no storageInit() e sempre que uma prorrogação for adicionada.
 */
function calcularPrazo(prazo) {
  var hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  var inicio = new Date(prazo.dataInstauracao);
  var diasProrrogados = (prazo.prorrogacoes || []).reduce(function(acc, p) {
    return acc + p.diasAdicionais;
  }, 0);

  var limite = new Date(inicio);
  limite.setDate(limite.getDate() + prazo.prazoLegalDias + diasProrrogados);

  var msRestantes = limite - hoje;
  var diasRestantes = Math.ceil(msRestantes / (1000 * 60 * 60 * 24));

  var status;
  if (diasRestantes < 0)       status = 'vencido';
  else if (diasRestantes === 0) status = 'critico';
  else if (diasRestantes <= 10) status = 'atencao';
  else                          status = 'ok';

  prazo.dataLimite   = limite.toISOString();
  prazo.diasRestantes = diasRestantes;
  prazo.status       = status;

  return prazo;
}
```

### 5.3 Alertas automáticos propostos

| Dias antes do vencimento | Nível | Ação sugerida |
|---|---|---|
| 10 dias | `aviso` | Notificação na aba Notificações + badge na aba |
| 5 dias | `aviso` | Notificação destacada + e-mail ao defensor (futuro) |
| 3 dias | `critico` | Notificação crítica (vermelho) + alerta no painel |
| 1 dia | `critico` | Notificação crítica + modal de aviso ao login |
| 0 dias (vence hoje) | `critico` | PAD marcado como crítico (`sp`) |
| Vencido | `critico` | PAD permanece `sp`; requer prorrogação ou justificativa |

### 5.4 Recálculo no carregamento

```javascript
// Adicionar ao final de storageInit():
function recalcularTodosPrazos() {
  Object.keys(padsData).forEach(function(portaria) {
    var pad = padsData[portaria];
    if (pad.prazo && pad.prazo.dataInstauracao) {
      pad.prazo = calcularPrazo(pad.prazo);
      // Atualizar statusCls conforme prazo
      if (pad.prazo.status === 'vencido' || pad.prazo.status === 'critico') {
        if (pad.statusCls !== 'sc') { // não alterar se já concluído
          pad.statusCls = 'sp';
          pad.statusTxt = pad.prazo.status === 'vencido' ? 'Prazo Vencido' : 'Crítico';
        }
      }
    }
  });
}
```

---

## 6. Estrutura Definitiva de Armazenamento

### 6.1 Chaves localStorage (namespace `pad_`)

| Chave | Tipo | Conteúdo |
|---|---|---|
| `pad_padsData` | `Object<portaria, PAD>` | Todos os PADs (dados completos) |
| `pad_padsDB` | `Incidentado[]` | Índice de incidentados para busca |
| `pad_oitivas` | `Oitiva[]` | Todas as oitivas (globais) |
| `pad_advDB` | `Defensor[]` | Cadastro de defensores |
| `pad_usuarios` | `Usuario[]` | Cadastro de servidores (novo na v2) |
| `pad_mensagensDB` | `Object<portaria, Mensagem[]>` | Mensagens por PAD |
| `pad_alertasMsgs` | `Object` | Contagens de não lidas (derivado) |
| `pad_alertasAdv` | `Object` | Contagens por defensor (derivado) |
| `pad_notificacoes` | `Notificacao[]` | Notificações do sistema (novo na v2) |
| `pad_prazos` | `Object<id, PRAZO_PROCESSUAL>` | Prazos de todos os PADs (novo na v2) |
| `pad_dadOcorrencia` | `Object (DAD)` | Dados da ocorrência em edição |
| `pad_ocorrArquivoNome` | `string` | Nome do arquivo de ocorrência |
| `pad_ocorrArquivoB64` | `string` | Conteúdo base64 do arquivo (risco de quota) |

### 6.2 Tamanho estimado

| Dado | Tamanho estimado por PAD | 50 PADs |
|---|---|---|
| PAD completo (sem docs) | ~3 KB | ~150 KB |
| Oitivas (5/PAD) | ~500 B | ~25 KB |
| Documentos (metadados) | ~200 B | ~10 KB |
| OCORR_B64 (PDF upload) | 100 KB–2 MB | somente 1 ativo |
| **Total estimado** | | **~200 KB + 1 arquivo** |

Limite do localStorage: 5–10 MB por origem. O sistema está bem dentro do limite se o campo `b64` for usado com cuidado.

### 6.3 Estratégia para crescimento

1. **Curto prazo (localStorage):** modelo atual é suficiente para ~200 PADs
2. **Médio prazo (IndexedDB):** trocar apenas `js/storage.js` — a API `Storage.get/set` abstrai o mecanismo; sem mudança no resto do código
3. **Longo prazo (API REST):** trocar `js/storage.js` por chamadas `fetch()` para backend. A camada de persistência é o único arquivo a mudar

---

## 7. Funcionalidades que Precisam de Adaptação

| Funcionalidade | Situação Atual | Adaptação Necessária (v2) |
|---|---|---|
| Cadastro de PAD | Dados do incidentado duplicados em `padsData` e `PADS_DB` | Extrair `Incidentado` como entidade separada; `PAD` passa a ter `incidentado_ipen` |
| Cadastro de Defensor | Nome+email apenas, espalhados | Criar `Defensor` como entidade em `pad_advDB` com estrutura completa |
| Controle de prazo | Não existe — sem cálculo automático | Criar `PRAZO_PROCESSUAL` por PAD; recalcular no `storageInit()` |
| Notificações | Array fixo hardcoded em HTML | Gerar `Notificacao[]` dinamicamente a partir de `PRAZO_PROCESSUAL` e eventos |
| Dashboard — métricas | Contagens hardcoded no HTML | Calcular dinamicamente a partir de `padsData` + `prazos` |
| Timeline | Eventos sem `tipo` definido | Adicionar campo `tipo` em `EventoTimeline` para filtros futuros |
| Documentos anexados | `docs: []` nos eventos da timeline (sempre vazio) | Implementar vinculação real de `Documento.id` |
| Login Advogado | Senha em plaintext em `advDB` | Migrar para `senhaHash` (SHA-256 Web Crypto) na Fase 3 |
| Status do PAD | Definido manualmente | Derivar automaticamente de `PRAZO_PROCESSUAL.status` + etapas concluídas |
| Etapas do processo | 7 etapas fixas | Expandir para 9–13 etapas do rito completo (com flag de opcional) |
