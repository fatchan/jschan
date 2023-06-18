/* globals Web3 */

if (window.ethereum) {
	window.jschanweb3 = new Web3(window.ethereum);
} else {
	document.querySelectorAll('.web3')
		.forEach(elem => elem.remove());
}
