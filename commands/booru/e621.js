const { ComponentType, SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
require('dotenv').config(); const { E6_USERNAME, E6_KEY } = process.env;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('e621')
		.setDescription('Temporary')
		.addStringOption((option) => option.setName('query').setDescription('Your search query')),

	async execute(interaction) {
		const query = interaction.options.getString('query') ?? '';
		let index = 0;
		let page = 1;

		async function fetchPosts() {
			const url = `https://e621.net/posts.json?tags=${query}&page=${page}`;
			const response = await fetch(url, {
				headers: {
					'Authorization': 'Basic ' + btoa(`${E6_USERNAME}:${E6_KEY}`),
					'User-Agent': 'sosu-chan/0.0 (by Meolsei)',
				},
			});
			return await response.json();
		}
		let data = await fetchPosts();

		const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

		function createEmbed() {
			const fileUrl = data.posts[index].file?.url;

			const embed = new EmbedBuilder()
				.setColor(0x014995)
				.setTitle('e621.net')
				.setURL(`https://e621.net/post/${data.posts[index].id}`)
				.addFields(
					{ name: 'Info', value: `Position (index:page): ${index}:${page}\nPost ID: ${data.posts[index].id}` },
				)
				.setFooter({ text: `Query: ${query}\nYou are on post ${index + 1} of page ${page}.` });

			if (fileUrl && validExtensions.some(ext => fileUrl.endsWith(ext))) {
				embed.setImage(fileUrl);
			}
			else {
				embed.addFields({ name: 'Warning', value: 'Cannot embed this file type. Click the button below to open the post.' });
			}

			return embed;
		}

		const nextPost = new ButtonBuilder().setCustomId('nextPost').setLabel('Next Post').setStyle(ButtonStyle.Primary);
		const prevPost = new ButtonBuilder().setCustomId('prevPost').setLabel('Previous Post').setStyle(ButtonStyle.Secondary);
		const openPost = new ButtonBuilder().setLabel('Open Post').setURL(`https://e621.net/posts/${data.posts[index].id}`).setStyle(ButtonStyle.Link);

		const row = new ActionRowBuilder().addComponents(prevPost, nextPost, openPost);

		const msg = await interaction.reply({
			embeds: [createEmbed(query, index)],
			components: [row],
			withResponse: true,
		});

		const collector = msg.resource.message.createMessageComponentCollector({
			componentType: ComponentType.Button,
			time: 3_600_000,
		});

		collector.on('collect', async i => {
			try {
				if (i.customId == 'prevPost') {
					index -= 1;
					if (index < 0) {
						if (page > 1) {
							page -= 1;
							data = await fetchPosts();
							index = data.posts.length - 1;
						}
						else {
							index = 0;
						}
					}
				}
				else if (i.customId == 'nextPost') {
					index += 1;
					if (index >= data.posts.length) {
						page += 1;
						index = 0;
						data = await fetchPosts();
					}
				}

				i.update({ embeds: [createEmbed(query, index)] });
			}
			catch (error) {
				console.log('meow', error);
			}
		});
	},
};