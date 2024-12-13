document.addEventListener('DOMContentLoaded', () => {
    const portfolio = document.getElementById('portfolio'); // Referência ao elemento onde os projetos serão exibidos

    // Lista de arquivos Markdown simulados
    const files = ['markdown/projeto-a.md', 'markdown/projeto-b.md', 'markdown/projeto-c.md', 'markdown/projeto-d.md'];

    // Função para extrair metadados do arquivo Markdown
    function extractMetadata(markdown) {
        const metadataRegex = /^---\s*([\s\S]+?)\s*---/; // Regex para capturar metadados entre delimitadores "---"
        const match = markdown.match(metadataRegex);

        if (!match) {
            console.error('Metadados não encontrados no arquivo Markdown.');
            return { metadata: {}, content: markdown }; // Retorna o Markdown original como conteúdo
        }

        const rawMetadata = match[1]; // Captura os metadados brutos
        const content = markdown.replace(metadataRegex, '').trim(); // Remove os metadados do conteúdo principal

        // Converte os metadados em um objeto JavaScript
        const metadata = {};
        rawMetadata.split('\n').forEach(line => {
            const [key, ...values] = line.split(':'); // Divide a chave do valor
            const value = values.join(':').trim(); // Recompõe o valor, caso contenha ":" no meio
            if (key && value) {
                switch (key) {
                    case 'tags':
                        metadata[key] = value.split(',').map(tag => tag.trim()); // Trata listas de tags
                        break;
                    case 'dataInicio':
                    case 'dataFim':
                        metadata[key] = new Date(value); // Converte as datas para objetos Date
                        break;
                    case 'importante':
                        metadata[key] = value.toLowerCase() === 'true'; // Converte para booleano
                        break;
                    default:
                        metadata[key] = value; // Atribui diretamente outros valores
                }
            }
        });

        return { metadata, content };
    }

    // Função para organizar projetos por coleções
    function groupByCollection(files) {
        const collections = {};
        files.forEach(file => {
            const { metadata } = file;
            if (metadata && metadata.colecao) { // Verifica se a coleção está definida
                if (!collections[metadata.colecao]) {
                    collections[metadata.colecao] = [];
                }
                collections[metadata.colecao].push(file);
            }
        });
        return collections;
    }

    // Renderiza o portfólio agrupado por coleções
    function renderPortfolio(files, limit = 3) {
        const groupedFiles = groupByCollection(files);

        for (const [colecao, items] of Object.entries(groupedFiles)) {
            const section = document.createElement('div'); // Cria uma seção para cada coleção
            section.classList.add('section');
            section.innerHTML = `<h2>${colecao}</h2>`; // Título da coleção

            const itemsContainer = document.createElement('div'); // Container para os itens visíveis
            itemsContainer.classList.add('items-container');
            section.appendChild(itemsContainer);

            items.slice(0, limit).forEach(({ metadata }) => {
                const card = createCard(metadata); // Cria um cartão para cada item
                itemsContainer.appendChild(card);
            });

            // Verifica se há mais itens para exibir
            if (items.length > limit) {
                const viewMoreButton = document.createElement('button'); // Botão "Ver Mais"
                viewMoreButton.textContent = 'Ver Mais';
                viewMoreButton.classList.add('view-more');
                viewMoreButton.addEventListener('click', () => {
                    items.slice(limit).forEach(({ metadata }) => {
                        const card = createCard(metadata);
                        itemsContainer.appendChild(card);
                    });
                    viewMoreButton.remove(); // Remove o botão após exibir todos os itens
                });
                section.appendChild(viewMoreButton);
            }

            portfolio.appendChild(section); // Adiciona a seção ao portfólio
        }
    }

    // Função para criar um cartão individual
    function createCard(metadata) {
        const card = document.createElement('div'); // Cria o elemento do cartão
        card.classList.add('card');
        card.innerHTML = `
            <img src="${metadata.thumbnail}" alt="${metadata.title}"> <!-- Miniatura do projeto -->
            <div onclick="viewFile('${metadata.file}')" class="card-content">
                <h3>${metadata.title}</h3> <!-- Título do projeto -->
                <p>${metadata.description}</p> <!-- Descrição do projeto -->
                <p class="tags">${metadata.tags?.map(tag => `<span>${tag}</span>`).join('') || ''}</p> <!-- Lista de tags, se existir -->
                <!-- <button onclick="viewFile('${metadata.file}')">Ver Mais</button>--> <!-- Botão para visualizar mais detalhes -->
            </div>
        `;
        return card;
    }

    // Carrega e processa os arquivos Markdown
    async function loadMarkdownFiles() {
        const processedFiles = [];
        for (const file of files) {
            try {
                const response = await fetch(file); // Faz a requisição do arquivo
                if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
                const markdown = await response.text();
                const { metadata, content } = extractMetadata(markdown);
                if (metadata) metadata.file = file;
                processedFiles.push({ metadata, content });
            } catch (error) {
                console.error(`Erro ao carregar ${file}:`, error);
            }
        }
        renderPortfolio(processedFiles); // Renderiza os projetos após o processamento
    }

    // Exibe o conteúdo de um arquivo Markdown em um modal
    window.viewFile = async (file) => {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            const markdown = await response.text();
            const { content } = extractMetadata(markdown);
            const converter = new showdown.Converter();
            const html = converter.makeHtml(content);
            const modal = document.createElement('div'); // Cria o modal
            modal.classList.add('modal');
            modal.innerHTML = `<div class="modal-content">${html}<button onclick="closeModal()">Fechar</button></div>`;
            document.body.appendChild(modal);
        } catch (error) {
            console.error(error);
        }
    };

    // Fecha o modal
    window.closeModal = () => {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    };

    // Inicializa o carregamento dos arquivos Markdown
    loadMarkdownFiles();
});
