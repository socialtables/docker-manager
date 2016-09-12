"use strict";
const debug = require("debug");
const Promise = require("bluebird");
const retry = require("bluebird-retry");
const child_process = require("child_process");

const implicitHealth = require("./lib/implicit-health");

const composeCmd = "docker-compose";
exports.composeUp = function(dir, options, health){
	var args = ["up"];
	var opts = { cwd: dir };
	if (options.force_recreate) {
		args.push("--force-recreate");
	}
	var proc = child_process.spawn(composeCmd, args, opts);
	var output = [];
	proc.stdout.on('data', (data) => {
	  debug(`stdout: ${data.toString()}`);
	  output.push(data.toString());
	});

	proc.stderr.on('data', (data) => {
	  debug(`stderr: ${data.toString()}`);
	  output.push(data.toString());
	});

	proc.on("close", (code) => {
			debug("Caught close command with code: ", code);
			if (code != 0) {
				throw new Error(`docker-compose -up command shutdown prematurely: ${output}`);
			}
	});
	
	if (health.check) {
		return retry(health.check, { timeout: health.to, interval: 1000, backoff: 1 });
	}
	else {
		// A health check function was no defined, so switch to trying the docker inferred method
		const dockerHealth = () => {
			return implicitHealth(dir);
		};
		return retry(dockerHealth, { timeout: health.to, interval: 1000, backoff: 1 });
	}
}

exports.composeDown = function(dir, options){
	var cmd = "docker-compose down";
	/*if(options){
		command += ' ' + options;
	}*/
	
	return execCommand(cmd, { cwd: dir });
}

function execCommand(command, options) {
	return new Promise((resolve, reject) => {
		child_process.exec(command, options, (err, stdout, stderr) => {
			if(!err) {
				resolve({ 
					"stdout": stdout, 
					"stderr": stderr
				});
			} 
			else {
				reject(err);
			}
		});			
	});
}