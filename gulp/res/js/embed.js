/* globals isCatalog */
if (!isCatalog) { //dont show embed buttons in catalog
	window.addEventListener('DOMContentLoaded', () => {

		const linkSelector = '.post-message a:not(.quote)'; //get links that arent quotes

		const supportedEmbeds = [
			{
				linkRegex: /^https?:\/\/(?:www\.|m\.)?(?:youtube\.com|youtu\.?be)\//i,
				toHtml: (url) => {
					try {
						const urlObject = new URL(url);
						const searchParams = urlObject.searchParams;
						const videoId = searchParams.get('v') || (urlObject.hostname === 'youtu.be' ? urlObject.pathname.substring(1) : null);
						if (videoId && videoId.length === 11) {
							return `<iframe class="embed-video" src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(videoId)}" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" style="display:block;" allowfullscreen></iframe>`;
						}
					} catch (e) { /*invalid url*/ }
					return null;
				}
			},
			{
				linkRegex: /^https?:\/\/(?:www\.)?bitchute\.com\/video\/[a-z0-9]{12}\//i,
				toHtml: (url) => {
					try {
						const urlObject = new URL(url);
						const videoId = urlObject.pathname.split('/')[2];
						if (videoId) {
							return `<iframe class="embed-video" src="https://www.bitchute.com/embed/${encodeURIComponent(videoId)}/" frameborder="0" scrolling="no" style="display:block;" allowfullscreen></iframe>`;
						}
					} catch (e) { /*invalid url*/ }
					return null;
				}
			},
			//TODO: add more of these
		];

		const toggleEmbed = (embedSpan, embedHtml) => {
			if (embedSpan.dataset.open === 'true') {
				embedSpan.nextSibling.remove();
				embedSpan.firstElementChild.textContent = 'Embed';
			} else {
				embedSpan.insertAdjacentHTML('afterend', embedHtml);
				embedSpan.firstElementChild.textContent = 'Close';
			}
			embedSpan.dataset.open = embedSpan.dataset.open === 'true' ? 'false' : 'true';
		};

		const addEmbedButtons = (l) => {
			for (let i = 0; i < l.length; i++) {
				const embedHandler = supportedEmbeds.find(handler => handler.linkRegex.test(l[i].href));
				if (!embedHandler) { continue; }
				const embedHtml = embedHandler.toHtml(l[i].href);
				if (embedHtml) {
					const embedSpan = document.createElement('span');
					const openBracket = document.createTextNode('[');
					const embedLink = document.createElement('a');
					const closeBracket = document.createTextNode(']');
					embedSpan.classList.add('ml-5', 'noselect', 'bold');
					embedLink.classList.add('dummy-link');
					embedLink.textContent = 'Embed';
					embedSpan.appendChild(openBracket);
					embedSpan.appendChild(embedLink);
					embedSpan.appendChild(closeBracket);
					l[i].parentNode.insertBefore(embedSpan, l[i].nextSibling);
					embedLink.addEventListener('click', () => toggleEmbed(embedSpan, embedHtml), false);
				}
			}
		};

		const links = Array.from(document.querySelectorAll(linkSelector));
		addEmbedButtons(links);

		const updateEmbedLinks = (e) => {
			if (e.detail.hover) {
				return;
			}
			const newlinks = Array.from(e.detail.post.querySelectorAll(linkSelector))
				.filter(link => {
					//dont add for existing or during updatepostmessage
					return !(link.nextSibling
						&& link.nextSibling.classList
						&& link.nextSibling.classList.contains('dummy-link'));
				});
			addEmbedButtons(newlinks);
		};

		window.addEventListener('addPost', updateEmbedLinks);
		window.addEventListener('updatePostMessage', updateEmbedLinks);

	});
}
