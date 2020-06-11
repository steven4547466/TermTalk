const fs = require("fs")
const os = require("os")

class Utils {
	static cachedConfig = null

	static get config() {
		if (Utils.cachedConfig) {
			return Utils.cachedConfig
		}
		if (!fs.existsSync(`${os.userInfo().homedir}/termtalk`)) fs.mkdirSync(`${os.userInfo().homedir}/termtalk`)
		if (fs.existsSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`)) {
			Utils.cachedConfig = JSON.parse(fs.readFileSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`))
			return Utils.cachedConfig
		} else {
			return false
		}
	}

	static overWriteConfig(newConfig) {
		Utils.cachedConfig = newConfig
		fs.writeFileSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`, JSON.stringify(newConfig))
		return newConfig
	}

	static addToIps(ip) {
		let config = Utils.config
		if (config.ips.includes(ip)) return
		config.ips.push(ip)
		this.overWriteConfig(config)
	}

	static setMainTextColor(color) {
		let config = Utils.config
		config.chatColor = color
		this.overWriteConfig(config)
	}
}

module.exports = Utils;