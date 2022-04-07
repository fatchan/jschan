describe('run integration tests', () => {
	require('./setup.js')();
	require('./posting.js')();
	require('./actions.js')();
	require('./pages.js')();
})
