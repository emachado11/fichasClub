export const classes = [
    {
        id: "combatente",
        nome: "Combatente",

        descricao: "Treinado para lutar com todo tipo de armas, e com a força e a coragem para encarar os perigos de frente. É o tipo de agente que prefere abordagens mais diretas e costuma atirar primeiro e perguntar depois.",

        vida_inicial: 20,
        vida_por_nivel: 4,

        esforco_inicial: 2,
        esforco_por_nivel: 2,

        determinacao_inicial: 6,
        determinacao_por_nivel: 3,

        sanidade_inicial: 12,
        sanidade_por_nivel: 3,

        pericias: ["Luta ou Pontaria (uma das duas) e Fortitude ou Reflexos (uma das duas), mais uma quantidade de perícias à sua escolha igual a 1 + Intelecto."],

        proficiencias: ["Armas simples","Armas táticas","Proteções leves"]
    },

    {
        id: "especialista",
        nome: "Especialista",

        descricao: "Um agente que confia mais em esperteza do que em força bruta. Um especialista se vale de conhecimento técnico, raciocínio rápido ou mesmo lábia para resolver mistérios e enfrentar o paranormal.",

        vida_inicial: 16,
        vida_por_nivel: 3,

        esforco_inicial: 3,
        esforco_por_nivel: 3,

        determinacao_inicial: 8,
        determinacao_por_nivel: 4,

        sanidade_inicial: 16,
        sanidade_por_nivel: 4,

        pericias: ["Uma quantidade de perícias à sua escolha igual a 7 + Intelecto."],

        proficiencias: ["Armas simples","Proteções leves."]
    },

    {
        id: "ocultista",
        nome: "Ocultista",

        descricao: "O Outro Lado é misterioso, perigoso e, de certa forma, cativante. Muitos estudiosos das entidades se perdem em seus reinos obscuros em busca de poder, mas existem aqueles que visam compreender e dominar os mistérios paranormais para usá-los para combater o próprio Outro Lado. Esse tipo de agente não é apenas um conhecedor do oculto, como também possui talento para se conectar com elementos paranormais.",

        vida_inicial: 12,
        vida_por_nivel: 2,

        esforco_inicial: 4,
        esforco_por_nivel: 4,

        determinacao_inicial: 10,
        determinacao_por_nivel: 5,

        sanidade_inicial: 20,
        sanidade_por_nivel: 5,

        pericias: ["ocultismo", "vontade", ", mais uma quantidade de perícias a sua escolha igual a 3 + Intelecto."],

        proficiencias: ["Armaduras simples."]
    },

    {
        id: "mundano",
        nome: "Mundano/Sobrevivente",

        descricao: "Você é uma pessoa comum, com uma ocupação regular e uma vida normal. Claro, considerando que você é um personagem de Ordem Paranormal RPG, essa normalidade toda não vai durar muito…Habilidades de Classe Empenho. Você pode não ter treinamento especial, mas compensa com dedicação e esforço. Quando faz um teste de perícia, você pode gastar 1 PE para receber +2 nesse teste.",

        vida_inicial: 8,
        vida_por_nivel: 0,

        esforco_inicial: 1,
        esforco_por_nivel: 0,

        determinacao_inicial: 10,
        determinacao_por_nivel: 0,

        sanidade_inicial: 8,
        sanidade_por_nivel: 0,

        pericias: ["1 + Intelecto."],

        proficiencias: ["Armaduras simples."]
    },
];