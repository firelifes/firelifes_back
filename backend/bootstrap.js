const env = process.env.NODE_ENV || process.env.MIDWAY_SERVER_ENV || 'local'
const dotenvPath = process.env.DOTENV_CONFIG_PATH || ('.env.' + env)
require('dotenv').config({ path: dotenvPath })
console.log('[bootstrap] NODE_ENV=' + env + ', dotenv=' + dotenvPath)

const { Bootstrap } = require('@midwayjs/bootstrap')
Bootstrap.run()
