'use strict';

const typeColors = {
    normal: "#A8A77A",
    fire: "#EE8130",
    water: "#6390F0",
    electric: "#F7D02C",
    grass: "#7AC74C",
    ice: "#96D9D6",
    fighting: "#C22E28",
    poison: "#A33EA1",
    ground: "#E2BF65",
    flying: "#A98FF3",
    psychic: "#F95587",
    bug: "#A6B91A",
    rock: "#B6A136",
    ghost: "#735797",
    dragon: "#6F35FC",
    dark: "#705746",
    steel: "#B7B7CE",
    fairy: "#D685AD",
};

document.getElementById("search").addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        searchGeneration();
    }
});

document.querySelector(".search-button").addEventListener("click", searchGeneration);

async function searchGeneration() {
    const generationNumber = document.getElementById("search").value.trim();

    if (!generationNumber) return;

    const resultDiv = document.getElementById("result");
    resultDiv.innerHTML = "Carregando...";

    try {
        // Buscar detalhes da geração
        const generationResponse = await fetch(`https://pokeapi.co/api/v2/generation/${generationNumber}`);
        if (!generationResponse.ok) throw new Error("Geração não encontrada");
        const generationData = await generationResponse.json();

        // Buscar cadeia de evolução
        const evolutionPromises = generationData.pokemon_species.map(async (pokemon) => {
            try {
                const speciesResponse = await fetch(pokemon.url);
                if (!speciesResponse.ok) throw new Error(`Erro ao buscar ${pokemon.name}`);
                const speciesData = await speciesResponse.json();
                return { name: pokemon.name, evolutionOrder: speciesData.order };
            } catch (error) {
                console.warn(`Erro ao carregar dados de ${pokemon.name}:`, error);
                return { name: pokemon.name, evolutionOrder: Infinity };
            }
        });

        const evolutionData = await Promise.all(evolutionPromises);
        evolutionData.sort((a, b) => a.evolutionOrder - b.evolutionOrder);

        // Criar estrutura para exibir todos os Pokémon
        let pokemonCards = "";
        for (const pokemon of evolutionData) {
            try {
                const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
                if (!pokemonResponse.ok) throw new Error(`Erro ao buscar ${pokemon.name}`);
                const pokemonData = await pokemonResponse.json();

                // Determinar a cor do card com base no tipo do Pokémon
                
                const primaryType = pokemonData.types[0].type.name;
                const cardColor = typeColors[primaryType] || "#FFFFFF"; // Branco como cor padrão

                pokemonCards += `
                    <div class="pokemon-card" onclick="showPokemonDetails('${pokemon.name}', '${primaryType}')" style="background-color: ${cardColor};">
                        <h3>${pokemonData.name.toUpperCase()}</h3>
                        <img src="${pokemonData.sprites.front_default}" alt="${pokemonData.name}" />
                        <p>Geração: ${generationData.name.toUpperCase()}</p>
                    </div>
                `;
            } catch (pokemonError) {
                console.warn(`Erro ao carregar dados de ${pokemon.name}:`, pokemonError);
            }
        }

        resultDiv.innerHTML = pokemonCards || `<p style="color: red;">Nenhum Pokémon encontrado nesta geração.</p>`;
    } catch (error) {
        resultDiv.innerHTML = `<p style="color: red;">Erro: ${error.message}</p>`;
    }
}

async function showPokemonDetails(pokemonName, primaryType) {
    const modal = document.getElementById("pokemon-modal");
    modal.classList.add("clicked"); // Mudar a cor da modal para o tipo do Pokémon

    try {
        const pokemonResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        const pokemonData = await pokemonResponse.json();

        // Obter a cadeia de evolução
        const speciesResponse = await fetch(pokemonData.species.url);
        const speciesData = await speciesResponse.json();
        const evolutionChainUrl = speciesData.evolution_chain.url;
        const evolutionChainResponse = await fetch(evolutionChainUrl);
        const evolutionChainData = await evolutionChainResponse.json();

        let evolutionNames = [];
        let currentEvolution = evolutionChainData.chain;
        while (currentEvolution) {
            evolutionNames.push(currentEvolution.species.name);
            currentEvolution = currentEvolution.evolves_to[0]; // Pega a próxima evolução, se houver
        }

        // Obter informações sobre raridade
    
        const isLegendary = speciesData.is_legendary ? "Lendário" : "Comum";
        const isMythical = speciesData.is_mythical ? "Mítico" : "";

        // Exibir detalhes do Pokémon na modal
        document.getElementById("pokemon-name").textContent = pokemonData.name.toUpperCase();
        document.getElementById("pokemon-image").src = pokemonData.sprites.front_default;
        document.getElementById("pokemon-height").textContent = `Altura: ${pokemonData.height} decímetros`;
        document.getElementById("pokemon-weight").textContent = `Peso: ${pokemonData.weight} hectogramas`;
        document.getElementById("pokemon-types").textContent = `Tipos: ${pokemonData.types.map(t => t.type.name).join(", ")}`;
        document.getElementById("pokemon-evolution").textContent = `Evolução: ${evolutionNames.join(" → ")}`;
        document.getElementById("pokemon-rarity").textContent = `Raridade: ${isLegendary} ${isMythical}`;

        // Alterar a cor da modal de acordo com o tipo
        const cardColor = typeColors[primaryType] || "#FFFFFF";
        modal.style.backgroundColor = cardColor;

        // Exibir a modal
        modal.style.display = "flex";
    } catch (error) {
        console.error("Erro ao carregar detalhes do Pokémon", error);
    }
}

// Fechar o modal ao clicar no X
document.getElementById("close-modal").addEventListener("click", function () {
    document.getElementById("pokemon-modal").style.display = "none";
    document.getElementById("pokemon-modal").classList.remove("clicked"); // Remover a cor após fechar a modal
});

// Fechar o modal ao clicar fora dele
window.addEventListener("click", function (event) {
    if (event.target === document.getElementById("pokemon-modal")) {
        document.getElementById("pokemon-modal").style.display = "none";
        document.getElementById("pokemon-modal").classList.remove("clicked"); // Remover a cor após fechar a modal
    }
});
