# 📅 Lembretes Automáticos de Calendário — Kehilá

Automação em **Google Apps Script** que envia emails automáticos a partir de um Google Calendar compartilhado, organizando os eventos por categoria (cor) e avisando a comunidade nos momentos certos.

## O que faz

Todo dia de manhã, o script roda sozinho (nos servidores do Google) e:

- **Resumo mensal** — no último dia de cada mês, envia um email com **todos os eventos do mês seguinte**, agrupados por categoria.
- **Aviso de véspera** — no dia anterior a cada evento, envia um lembrete *"Amanhã: [evento]"*.
- **Aviso do dia** — no próprio dia do evento, envia *"Hoje: [evento]"*.

As categorias são definidas pela **cor** de cada evento no Google Calendar:

| Cor | Categoria |
|-----|-----------|
| 🔴 Vermelho | Geral |
| 🟣 Roxo | Mulheres |
| 🟡 Amarelo | Infantil |
| ⚪ Cinza | Acontecimentos |
| 🟢 Verde | Casais jovens |
| 🔵 Azul | Kehilá + |

## Por que Apps Script

- **Sem servidor** — roda na infraestrutura do Google, não precisa de máquina ligada.
- **Autenticação nativa (OAuth)** — acesso seguro ao Calendar e Gmail, sem manipular senhas.
- **Agendamento embutido** — gatilho de tempo dispara a execução diária.

## Como configurar

1. Crie um novo projeto em [script.google.com](https://script.google.com).
2. Cole o conteúdo de [`Codigo.gs`](./Codigo.gs).
3. Preencha as constantes no topo:
   - `CALENDAR_ID` — o ID da agenda (em *Configurações da agenda → ID da agenda*).
   - `DESTINATARIOS` — lista de emails que recebem os lembretes.
   - `CATEGORIAS` — mapa de cor → nome da categoria (ajuste ao seu uso).
4. Rode a função `testarAgora` uma vez e autorize o acesso.
5. Em **Acionadores**, crie um gatilho de tempo diário na função `rodarDiariamente`.

Pronto — a automação passa a rodar sozinha todos os dias.

## Stack

- Google Apps Script (JavaScript)
- Google Calendar API
- Gmail (MailApp)

## Conceitos aplicados

- Integração com APIs do Google via OAuth
- Agendamento de tarefas (time-driven triggers)
- Manipulação de datas e janelas de tempo
- Agrupamento e formatação de dados para envio em HTML
