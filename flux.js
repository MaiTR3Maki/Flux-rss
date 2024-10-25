const fs = require('fs').promises; // Module pour manipuler les fichiers
const Parser = require('rss-parser'); // Module pour parser les flux RSS
const { Client } = require("discord.js"); // Module Discord.js pour créer un bot Discord

const bot = new Client({ intents: ["Guilds"] }); // Création de l'instance du bot Discord
const parser = new Parser(); // Création de l'instance du parseur de flux RSS

const RSS_FEEDS = [
    //dev-web
    { id: 'Donner un nom/num qui sera inscrit dans le fichier(lastestItems.json)', url: 'Lien RSS (attention tout les liens ne fonctionne pas penser a les tester)', channelID: 'ID du chanel Discord' },
    // Informatique
    { id: 'Donner un nom/num qui sera inscrit dans le fichier(lastestItems.json)', url: 'Lien RSS (attention tout les liens ne fonctionne pas penser a les tester)', channelID: 'ID du chanel Discord' },
 
];

let latestItems = {}; // Objet pour stocker les derniers articles traités

// Événement déclenché lorsque le bot est prêt
bot.once('ready', async () => {
    console.log('Bot prêt !'); // Affiche un message lorsque le bot est prêt
    await loadLatestItems(); // Charge les derniers articles depuis le fichier JSON
    fetchAndSendRSS(); // Lance la récupération et l'envoi des derniers articles
    setInterval(fetchAndSendRSS, 60000); // Rafraîchit les flux toutes les 60 secondes
});

// Fonction pour charger les derniers articles depuis le fichier JSON
async function loadLatestItems() {
    try {
        const data = await fs.readFile('latestItems.json', 'utf-8'); // Lit le contenu du fichier JSON
        if (!data.trim()) {
            console.log('Le fichier latestItems.json est vide. Exécution de fetchAndSendRSS pour récupérer les derniers articles.');
            await fetchAndSendRSS(); // Si le fichier est vide, récupère les derniers articles
        } else {
            latestItems = JSON.parse(data); // Charge les derniers articles depuis le fichier JSON
        }
    } catch (error) {
        if (error.code === 'ENOENT') { // Si le fichier n'existe pas
            console.log('Fichier latestItems.json non trouvé. Exécution de fetchAndSendRSS pour récupérer les derniers articles.');
            await fetchAndSendRSS(); // Récupère les derniers articles
        } else {
            console.error('Erreur lors du chargement des derniers articles :', error); // Affiche une erreur si le chargement échoue
        }
    }
}

// Fonction pour enregistrer les derniers articles dans le fichier JSON
async function saveLatestItems() {
    try {
        await fs.writeFile('latestItems.json', JSON.stringify(latestItems, null, 2)); // Écrit les derniers articles dans le fichier JSON
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement des derniers articles :', error); // Affiche une erreur en cas d'échec de l'enregistrement
    }
}

// Fonction pour récupérer et envoyer les nouveaux articles des flux RSS
async function fetchAndSendRSS() {
    try {
        for (const feedInfo of RSS_FEEDS) { // Parcourt tous les flux RSS définis
            const feed = await parser.parseURL(feedInfo.url); // Parse le flux RSS
            for (const item of feed.items) { // Parcourt tous les articles du flux
                if (!latestItems[feedInfo.id] || !latestItems[feedInfo.id].includes(item.link)) { // Vérifie si l'article est nouveau
                    const channel = await bot.channels.fetch(feedInfo.channelID); // Récupère le canal Discord
                    await channel.send(`Nouvel article : ${item.title}\n${item.link}`); // Envoie le nouvel article dans le canal Discord
                    latestItems[feedInfo.id] = latestItems[feedInfo.id] ? [...latestItems[feedInfo.id], item.link] : [item.link]; // Ajoute le lien de l'article aux derniers articles traités
                } else {
                    // Les articles précédents ont déjà été envoyés, donc on arrête la boucle
                    break;
                }
            }
        }
        await saveLatestItems(); // Enregistre les derniers articles dans le fichier JSON
    } catch (error) {
        console.error('Une erreur s\'est produite :', error); // Affiche une erreur en cas d'échec de récupération des articles
    }
}

// Fonction pour exécuter la commande !derniers-articles
async function displayLatestArticles(interaction) {
    try {
        const theme = interaction.options.getString('theme'); // Récupère le thème spécifié dans la commande
        const feedInfo = RSS_FEEDS.find(feed => feed.id === theme); // Recherche les informations sur le flux RSS en fonction du thème spécifié

        if (!feedInfo) { // Vérifie si le thème spécifié est valide
            await interaction.reply('Thème invalide. Veuillez spécifier un thème valide.'); // Répond avec un message si le thème est invalide
            return;
        }

        const feed = await parser.parseURL(feedInfo.url); // Parse le flux RSS correspondant au thème spécifié
        const latestArticles = feed.items.slice(0, 30); // Récupère les 30 derniers articles du flux RSS

        // Construit un message contenant les 30 derniers articles du thème spécifié
        const message = latestArticles.map((item, index) => `${index + 1}. ${item.title}\n${item.link}`).join('\n\n');

        await interaction.reply(`Voici les 30 derniers articles sur le thème "${theme}" :\n${message}`); // Répond avec le message contenant les articles
    } catch (error) {
        console.error('Une erreur s\'est produite lors de l\'affichage des derniers articles :', error); // Affiche une erreur en cas d'échec
        await interaction.reply('Une erreur s\'est produite lors de l\'affichage des derniers articles. Veuillez réessayer plus tard.'); // Répond avec un message d'erreur
    }
}


// Événement déclenché lorsqu'une interaction est créée (par exemple, une commande)
bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return; // Ignore les interactions qui ne sont pas des commandes

    // Vérifie si la commande est !derniers-articles
    if (interaction.commandName === "derniers-articles") {
        await displayLatestArticles(interaction); // Exécute la fonction pour afficher les derniers articles
    } else if (interaction.commandName === "ping") {
        await interaction.reply("Pong!"); // Répond avec "Pong!" si la commande est "ping"
    }
    else if (interaction.commandName === "1") {
        await interaction.reply("2!"); // Répond avec "Pong!" si la commande est "ping"
    }
});

bot.login('TOKEN'); // Connexion du bot Discord avec le token