const fs = require("fs")
const os = require("os")

class Utils {
	static config() {
		if(fs.existsSync(`${os.userInfo().homedir}\\.termtalkconf.json`)) {
			return JSON.parse(fs.readFileSync(`${os.userInfo().homedir}\\.termtalkconf.json`))
		} else {
			return false;
		}
	}
}

module.exports = Utils;