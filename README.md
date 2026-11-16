# 📋 Busca Ativa Escolar

Sistema web e aplicativo (PWA) desenvolvido para agilizar o registro diário de ausências, a comunicação acolhedora com as famílias via WhatsApp Business e o acompanhamento pedagógico de frequência.

🔗 **Acesso direto:** [https://github.io](https://github.io)

---

## 📱 Como Instalar como Aplicativo

O sistema funciona tanto no navegador quanto instalado na tela inicial (sem barras de navegador):

### No Celular (Android / iPhone)
1. Abra o link oficial no **Google Chrome** (Android) ou **Safari** (iPhone).
2. No Android, toque nos **três pontinhos (⋮)** no canto superior direito e selecione **Instalar app** (ou *Adicionar à tela inicial*).
3. No iPhone, toque no ícone de **Compartilhar** na barra inferior e escolha **Adicionar à Tela de Início**.

### No Computador (Desktop / Notebook)
1. Abra o link no **Google Chrome** ou **Microsoft Edge**.
2. Clique no **ícone de instalação** (monitor com seta para baixo) no canto direito da barra de endereços.
3. Confirme em **Instalar** para criar um atalho direto na Área de Trabalho.

---

## ⚙️ Principais Funções do Sistema

### 1. 📸 Captura de Chamada (Leitura Inteligente por Foto)
* **Seleção de Turma:** Escolha a turma correspondente à folha de chamada.
* **Reconhecimento por Cor de Caneta:** Ao fotografar a lista preenchida pelos professores na 1ª aula, a Inteligência Artificial identifica **apenas** os alunos marcados com **"F" em caneta vermelha** (faltas) e ignora marcações em caneta azul ou verde (presenças).
* **Cruzamento de Dados:** O sistema compara os nomes com a agenda oficial na planilha, corrige abreviações e vincula automaticamente o telefone do responsável.
* **Lançamento Manual:** Também permite digitar os nomes dos faltosos separados por vírgula caso não haja foto.

### 2. 💬 Central WhatsApp (Disparo em 1 Clique)
* **Sincronização em Tempo Real:** Tudo o que é fotografado no celular aparece instantaneamente no computador ao clicar em **Atualizar Dados Agora**.
* **Mensagem Acolhedora Pronta:** Gera automaticamente o texto padrão com o nome do estudante e a turma.
* **Abertura Direta no WhatsApp Business:** Ao clicar em **Copiar e Abrir WhatsApp**, o sistema abre a conversa direto no número do responsável cadastrado (no celular ou WhatsApp Web) com o texto já preenchido, restando apenas apertar **Enviar**.
* **Registro de Retorno:** Permite classificar o motivo da ausência (*Saúde, Transporte, Trabalho, Familiar ou Sem Resposta*) e anotar observações.

### 3. 📊 Relatório Semanal e Planilha Consolidada
* **Indicadores Rápidos:** Exibe o total de faltas registradas, o percentual de famílias já contatadas e o **Alerta de Recorrência** (estudantes com 2 ou mais faltas).
* **Exportação para Excel:** O botão **Baixar Planilha (CSV / Excel)** gera um relatório completo pronto para impressão ou reuniões de Conselho de Classe e Busca Ativa.

---

## 🗂️ Organização da Planilha Base (Google Sheets)
* **Aba `Registros`:** Armazena o histórico diário de ausências, status de contato e justificativas.
* **Aba `Contatos`:** Agenda oficial dividida em 3 colunas (`Turma`, `Nome_Aluno`, `Telefone_Responsavel`) usada pela IA para identificar os estudantes e preencher os telefones automaticamente.
