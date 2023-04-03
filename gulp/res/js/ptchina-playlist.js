/* globals __ */
//https://github.com/ussaohelcim/ptchina-playlist/tree/bookmarklet-let
async function threadToPlaylist(board, postId) {
	async function getThread() {
		let link = `${window.location.origin}/${board}/thread/${postId}.json`;
		return await fetch(link).then(res => res.json());
	}
	function isAudioOrVideo(file) {
		const mimeTypes = ['video', 'audio'];
		const fileType = file.mimetype.split('/')[0];
		return fileType === mimeTypes[0] || fileType === mimeTypes[1];
	}
	async function getMedia(thread) {
		const files = [];
		thread.files.forEach((file) => {
			if (isAudioOrVideo(file)) {
				files.push(file);
			}
		});
		for (let i = 0; i < thread.replies.length; i++) {
			const replyFiles = thread.replies[i].files;
			replyFiles.forEach((file) => {
				if (isAudioOrVideo(file)) {
					files.push(file);
				}
			});
		}
		return files;
	}
	function createPlaylist(medias) {
		const lines = [];
		lines.push('#EXTM3U');
		for (let i = 0; i < medias.length; i++) {
			const media = medias[i];
			lines.push(`#EXTINF:${media.duration}, ${media.originalFilename}`);
			lines.push(`${location.origin}/file/${media.filename}`);
		}
		let playlist = lines.join('\n');
		return playlist;
	}
	function downloadPlaylist(filename, playlist) {
		const blob = new Blob([playlist], { type: 'application/mpegurl' });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.target = '_blank';
		a.download = filename;
		a.style.display = 'none';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
	}
	try {
		const thread = await getThread();
		const files = await getMedia(thread);
		const playlist = await createPlaylist(files);
		if (playlist.split('\n').length > 1) {
			downloadPlaylist(`${thread.board}-${thread.postId}.m3u`, playlist);
		} else {
			alert(__('No video/audio files in this thread.'));
		}
	} catch (error) {
		console.log(error);
	}
}
window.addEventListener('createPlaylist', (e) => {
	threadToPlaylist(e.detail.board, e.detail.postId);
});
