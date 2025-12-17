const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, Events, GatewayIntentBits, MessageFlags } = require('discord.js');
require('dotenv').config(); const { DISCORD_TOKEN } = process.env;

const client = new Client({
	intents: Object.keys(GatewayIntentBits).map((a) => {
		return GatewayIntentBits[a];
	}),
});

client.once(Events.ClientReady, (readyClient) => {
	console.log(`Ready & logged in as ${readyClient.user.tag}`);
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);

		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		}
		else {
			console.log(`Failed to load ${filePath}`);
		}
	}
}

client.on(Events.InteractionCreate, async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`${interaction.commandName} is not a valid command.`);
		return;
	}

	try {
		await command.execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({
				content: 'There was an error executing this command.',
				flags: MessageFlags.Ephemeral,
			});
		}
		else {
			await interaction.reply({
				content: 'There was an error executing this command.',
				flags: MessageFlags.Ephemeral,
			});
		}
	}
});

process.on('SIGINT', async () => {
	console.log('Stopping bot...');
	client.destroy();
	process.exit(0);
});


client.login(DISCORD_TOKEN);