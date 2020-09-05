if (!isCatalog) { //dont show embed buttons in catalog
	window.addEventListener('DOMContentLoaded', (event) => {

		const linkSelector = '.post-message a:not(.quote)'; //get links that arent quotes

		const supportedEmbeds = [
			{
				linkRegex: /(?:https?\:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.?be)\/.+?(\s|$)/i,
				toHtml: (url) => {
					const urlObject = new URL(url);
					const searchParams = urlObject.searchParams;
					const videoId = searchParams.get('v') || (urlObject.hostname === 'youtu.be' ? urlObject.pathname.substring(1) : null);
					if (videoId && videoId.length === 11) {
						return `<iframe src="https://www.youtube.com/embed/${encodeURIComponent(videoId)}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" style="display:block;" allowfullscreen></iframe>`;
					}
					return null;
				}
			},
			//TODO: add more of these
		];

		const toggleEmbed = (embedLink, embedHtml) => {
			if (embedLink.dataset.open === 'true') {
				embedLink.nextSibling.remove();
			} else {
				embedLink.insertAdjacentHTML('afterend', embedHtml);
			}
			embedLink.dataset.open = embedLink.dataset.open === 'true' ? 'false' : 'true';
		}

		const addEmbedButtons = (l) => {
			for (let i = 0; i < l.length; i++) {
				const embedHandler = supportedEmbeds.find(handler => handler.linkRegex.test(l[i].href));
				if (!embedHandler) { continue; }
				const embedHtml = embedHandler.toHtml(l[i].href);
				if (embedHtml) {
					const embedLink = document.createElement('a');
					embedLink.classList.add('embed-link', 'ml-5', 'noselect');
					embedLink.textContent = '[Embed]';
					embedLink.addEventListener('click', () => toggleEmbed(embedLink, embedHtml), false);
					l[i].parentNode.insertBefore(embedLink, l[i].nextSibling);
				}
			}
		};

		const links = Array.from(document.querySelectorAll(linkSelector));
		addEmbedButtons(links);

		updateEmbedLinks = (e) => {
			if (e.detail.hover) {
				return;
			}
			const newlinks = Array.from(e.detail.post.querySelectorAll(linkSelector))
				.filter(link => {
					//dont add for existing or during updatepostmessage
					return !(link.nextSibling
						&& link.nextSibling.classList
						&& link.nextSibling.classList.contains('embed-link'));
				});
			addEmbedButtons(newlinks);
		}

		window.addEventListener('addPost', updateEmbedLinks);
		window.addEventListener('updatePostMessage', updateEmbedLinks);

	});
}
