//https://github.com/ussaohelcim/ptchina-playlist/tree/bookmarklet-let
'use strict';
async function threadToPlaylist(board, postId) {
	async function getThread() {
		let link = `${window.location.origin}/${board}/thread/${postId}.json`;
		return await fetch(link).then(async (res) => {
			const thread = await res.json();
			return thread;
		});
	}
	async function getMedia(thread) {
		const fileTypes = ['.mp4', '.mp3', '.webm'];
		const files = [];
		thread.files?.forEach((f) => {
			if (fileTypes.includes(f.extension)) {
				files.push(f);
			}
		});
		for (let i = 0; i < thread.replies.length; i++) {
			const element = thread.replies[i].files;
			element?.forEach((f) => {
				if (fileTypes.includes(f.extension)) {
					files.push(f);
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
	const thread = await getThread();
	const files = await getMedia(thread);
	const playlist = await createPlaylist(files);
	if (playlist.split('\n').length > 1) { //playlist.split('\n').length === 1 means only "#EXTM3U" inside the string
		downloadPlaylist(`${thread.board}-${thread.postId}.m3u`, playlist);
	}
	else {
		console.log('No video/audio files in this thread.');
	}
}

window.addEventListener('createPlaylist',(e)=>{
	threadToPlaylist(e.detail.board,e.detail.postId);
});
