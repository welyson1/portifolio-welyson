document.addEventListener('DOMContentLoaded', () => {
    const portfolio = document.getElementById('portfolio'); // Referência ao elemento onde os projetos serão exibidos

    // Lista de arquivos Markdown simulados
    const files = [
        'markdown/projeto-a.md', 
        'markdown/projeto-b.md', 
        'markdown/projeto-c.md', 
        'markdown/projeto-d.md'
    ];

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

    function createShareableLink(file) {
        let baseURL;
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
            // Ambiente local
            baseURL = `${window.location.origin}/`;
        } else {
            // Ambiente GitHub Pages
            baseURL = `${window.location.origin}/portifolio-welyson/`;
        }
        return `${baseURL}${file}`;
    }
    

    window.copyToClipboard = function(link, button) {
        // Copia o link para a área de transferência
        navigator.clipboard.writeText(link)
            .then(() => {
                // Adiciona a classe de animação para feedback
                button.textContent = 'Copiado!';
                button.classList.add('copied');
                
                // Remove a classe após 1 segundo para permitir reutilização
                setTimeout(() => {
                    button.textContent = 'Copiar Link';
                    button.classList.remove('copied');
                }, 1000);
            })
            .catch(err => console.error('Erro ao copiar link:', err));
    };
    

    // Função para fechar o modal
    window.closeModal = function() {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    };

    window.viewFile = async function(file) {
        try {
            const response = await fetch(file);
            if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
            const markdown = await response.text();
    
            // Remove os metadados e extrai o conteúdo principal
            const { content } = extractMetadata(markdown);
    
            // Converte o conteúdo Markdown em HTML
            const converter = new showdown.Converter();
            const html = converter.makeHtml(content);
    
            // Cria o link compartilhável
            const shareableLink = createShareableLink(file);
    
            // Criação do modal com header, botão de cópia e conteúdo
            const modal = document.createElement('div');
            modal.classList.add('modal');
            modal.innerHTML = `
                <div class="modal-header">
                    <button id="copy-link-button" onclick="copyToClipboard('${shareableLink}', this)">Copiar Link</button>
                    <button onclick="closeModal()">Fechar</button>
                </div>
                <div class="modal-content">
                    ${html}
                </div>
            `;
            document.body.appendChild(modal);
        } catch (error) {
            console.error(`Erro ao carregar o arquivo ${file}:`, error);
        }
    };
    
        

    // Verifica se o parâmetro "file" existe na URL e renderiza o arquivo
    const params = new URLSearchParams(window.location.search);
    const file = params.get('file');
    if (file) {
        viewFile(file);
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

    // // Exibe o conteúdo de um arquivo Markdown em um modal
    // window.viewFile = async (file) => {
    //     try {
    //         const response = await fetch(file);
    //         if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
    //         const markdown = await response.text();
    //         const { content } = extractMetadata(markdown);
    //         const converter = new showdown.Converter();
    //         const html = converter.makeHtml(content);
    //         const modal = document.createElement('div'); // Cria o modal
    //         modal.classList.add('modal');
    //         modal.innerHTML = `<div class="modal-content">${html}<button onclick="closeModal()">Fechar</button></div>`;
    //         document.body.appendChild(modal);
    //     } catch (error) {
    //         console.error(error);
    //     }
    // };

    // Fecha o modal
    window.closeModal = () => {
        const modal = document.querySelector('.modal');
        if (modal) modal.remove();
    };

    function renderTimeline(files) {
        // Filtra e ordena os projetos importantes
        const importantProjects = files
            .filter(file => file.metadata.importante)
            .sort((a, b) => new Date(b.metadata.dataInicio) - new Date(a.metadata.dataInicio)); // Ordena por data
    
        // Cria o modal
        const modal = document.createElement('div');
        modal.classList.add('modal');
    
        // Cria o contêiner da timeline
        const timelineContent = document.createElement('div');
        timelineContent.classList.add('timeline-content');
        timelineContent.innerHTML = `<h2>Timeline de Projetos Importantes</h2>`;
    
        // Adiciona os itens da timeline
        importantProjects.forEach(({ metadata }, index) => {
            const timelineItem = document.createElement('div');
            timelineItem.classList.add('timeline-item', index % 2 === 0 ? 'left' : 'right'); // Alterna entre esquerda e direita
            timelineItem.innerHTML = `
                <div class="timeline-dot"></div>
                <div class="timeline-date">${new Date(metadata.dataInicio).toLocaleDateString()}</div>
                <div class="timeline-details">
                    <h3>${metadata.title}</h3>
                    <p>${metadata.description}</p>
                </div>
            `;
            timelineContent.appendChild(timelineItem);
        });
    
        // Adiciona a linha central dinamicamente
        const timelineLine = document.createElement('div');
        timelineLine.classList.add('timeline-line');
        timelineContent.appendChild(timelineLine);
    
        // Botão de fechar
        const closeButton = document.createElement('button');
        closeButton.textContent = 'Fechar';
        closeButton.classList.add('close-timeline');
        closeButton.addEventListener('click', () => modal.remove());
    
        // Adiciona os elementos ao modal
        modal.appendChild(timelineContent);
        modal.appendChild(closeButton);
        document.body.appendChild(modal);
    
        // Ajusta dinamicamente a altura da linha
        setTimeout(() => {
            const contentHeight = timelineContent.scrollHeight; // Altura total do conteúdo
            timelineLine.style.height = `${contentHeight}px`;
        }, 100); // Atraso para garantir que o DOM esteja renderizado
    }
    
    // Função para carregar os arquivos e exibir a timeline
    async function loadTimeline() {
        const processedFiles = [];
        for (const file of files) {
            try {
                const response = await fetch(file);
                if (!response.ok) throw new Error(`Erro ao carregar o arquivo: ${response.statusText}`);
                const markdown = await response.text();
                const { metadata, content } = extractMetadata(markdown);
                if (metadata) metadata.file = file;
                processedFiles.push({ metadata, content });
            } catch (error) {
                console.error(`Erro ao carregar ${file}:`, error);
            }
        }
        renderTimeline(processedFiles); // Renderiza a timeline com os projetos importantes
    }

    window.loadTimeline = loadTimeline;

    // Inicializa o carregamento dos arquivos Markdown
    loadMarkdownFiles();
});
