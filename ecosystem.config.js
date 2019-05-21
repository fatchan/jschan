module.exports = {
	// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
	apps : [{
		name: 'chan',
		script: 'server.js',
		instances: 2,
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss',
		wait_ready: true,
		listen_timeout: 5000,
		kill_timeout: 5000,
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'deleter',
		script: 'deletescheduler.js',
		instances: 1,
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss',
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}]
};
