module.exports = {
	// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
	apps : [{
		name: 'build-worker',
		script: 'worker.js',
		instances: 1,
		/*
			increase instances if building is getting backed up,
			best to keep at numCPUs-1 to prevent server choke under high load though.
		*/
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
		env: {
			NODE_ENV: 'development'
		},
		env_development: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'chan',
		script: 'server.js',
		instances: 0, // 0 = number of cpu cores
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
		wait_ready: true,
		kill_timeout: 5000,
		env: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}, {
		name: 'schedules',
		script: 'schedules/index.js',
		instances: 1,
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
		env: {
			NODE_ENV: 'development'
		},
		env_development: {
			NODE_ENV: 'development'
		},
		env_production: {
			NODE_ENV: 'production'
		}
	}]
};
