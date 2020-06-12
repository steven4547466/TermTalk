/*
	TermTalk - A simple and straightforward way of talking to your peers in the terminal.
	Copyright (C) 2020 Terminalfreaks

	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.

	This program is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU General Public License for more details.

	You should have received a copy of the GNU General Public License
	along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

const fs = require("fs")
const os = require("os")
let configCache;
class Utils {

	static get config() {
		if (configCache) {
			return configCache
		}
		if (!fs.existsSync(`${os.userInfo().homedir}/termtalk`)) fs.mkdirSync(`${os.userInfo().homedir}/termtalk`)
		if (fs.existsSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`)) {
			configCache = JSON.parse(fs.readFileSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`))
			return configCache
		} else {
			return false
		}
	}

	static overWriteConfig(newConfig) {
		configCache = newConfig
		fs.writeFileSync(`${os.userInfo().homedir}/termtalk/.termtalkconf.json`, JSON.stringify(newConfig, null, 4))
		return newConfig
	}

	static addToIps(ip) {
		let config = this.config
		if (config.ips.includes(ip)) return;
		config.ips.push(ip)
		this.overWriteConfig(config)
	}

	static setMainTextColor(color) {
		let config = this.config
		config.chatColor = color
		this.overWriteConfig(config)
	}
}

module.exports = Utils;