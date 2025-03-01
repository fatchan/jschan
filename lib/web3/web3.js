'use strict';

//NOTE: unused (for now)
const { Web3 } = require('web3'),
	config = require(__dirname + '/../misc/config.js'),
	{ addCallback } = require(__dirname + '/../redis/redis.js'),
	web3 = {
		ethereum: new Web3(config.get.ethereumNode),
		arbitrum: new Web3(config.get.arbitrumNode),
		base: new Web3(config.get.baseNode),
	};

const updateWeb3Providers = () => {
	Object.entries(web3)
		.map(([k, v]) => v.setProvider(config.get[`${k}Node`])); //lol
};

addCallback('config', updateWeb3Providers);

async function checkNftOwnership(network, contractAddress, abi, tokenId, userAddress) {
	const contract = new web3[network].eth.Contract(abi, contractAddress);

	try {
		const owner = await contract.methods.ownerOf(tokenId).call();
		return owner.toLowerCase() === userAddress.toLowerCase();
	} catch (error) {
		console.error('Error checking ownership:', error);
		return false; // Return false if the token does not exist or any error occurs
	}
}

async function hasNftFromCollection(network, contractAddress, abi, userAddress) {
	const contract = new web3[network].eth.Contract(abi, contractAddress);

	try {
		const balance = await contract.methods.balanceOf(userAddress).call();
		return balance > 0; //balance is actually a bigint, but anything > 0 should mean "has an nft"
	} catch (error) {
		console.error('Error checking balance:', error);
		return false; // Return false if any error occurs
	}
}

module.exports = {
	web3,
	checkNftOwnership,
	hasNftFromCollection,
};
