describe('run integration tests', () => {
	require('./setup.js')();
	require('./posting.js')();
	require('./global.js')();
	require('./board.js')();
	require('./actions.js')();
	require('./pages.js')();
	require('./cleanup.js')();
	require('./twofactor.js')();
});
