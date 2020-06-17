#! /usr/bin/env node
const fs = require("fs")
const defaultConfig = fs.readFileSync("config.json")
const Main = require("./src/Main")
const Utils = require("../src/Utils")

if(!Utils.config) fs.appendFileSync(`${require("os").userInfo().homedir}/termtalk/.termtalkconf.json`, defaultConfig)
Main.run()