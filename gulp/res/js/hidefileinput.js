const fileInput = document.getElementById('file');
if (fileInput) {
	//not using display: none because we still want to show the browser prompt for a "required" file
	fileInput.style.position = 'absolute';
	fileInput.style.border = 'none';
	fileInput.style.height = '1px';
	fileInput.style.width = '1px';
//	fileInput.style.opacity = '0';
}
