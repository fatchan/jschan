const numCpus = require('os').cpus().length;
module.exports = {
	// Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
	apps : [{
		name: 'build-worker',
		script: 'worker.js',
		instances: Math.floor(numCpus/2), //if you only have 1 core and floor to 0, 0 just means "all cores" which is correct in that case.
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
		instances: Math.floor(numCpus/2),
		autorestart: true,
		watch: false,
		max_memory_restart: '1G',
		log_date_format: 'YYYY-MM-DD HH:mm:ss.SSS',
		wait_ready: true,
		kill_timeout: 5000,
		env: {
			NODE_ENV: 'development',
			FFMPEG_PATH: '/snap/bin/ffmpeg',
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
