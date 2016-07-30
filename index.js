"use strict";
var debug = require("debug");

var Promise = require("bluebird");
var retry = require("bluebird-retry");

var child_process = require("child_process");

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
				reject(`docker-compose -up command shutdown prematurely: ${output}`);
			}
	});

	return retry(health.check, { timeout: health.to, interval: 1000, backoff: 1 })
		.catch(err => {
			console.log(output);
			console.log(err);
		});
}

exports.composeDown = function(dir, options){
	var cmd = "docker-compose down";
	/*if(options){
		command += ' ' + options;
	}*/
	
	return execCommand(cmd, { cwd: dir });
}

/*exports.dockerExec = function (container, exec_command, options, success, error){
	var command = 'docker exec';

	if(options){
		for(option in options){
			command += ' ' + options[option];
		}
	}

	command += ' ' + container;

	command += ' ' + exec_command;

	execCommand(command, success, error);

}

exports.dockerInspectIPAddressOfContainer = function (container, options){
	var command = "docker inspect --format '{{.NetworkSettings.Networks." + options.network + ".IPAddress}}' " + container;

	return child_process.execSync(command).toString('utf-8').replace(/(?:\r\n|\r|\n)/g, '');
}

exports.dockerInspectPortOfContainer = function (container, options){
	var command = "docker inspect --format '{{.NetworkSettings.Ports}}' " + container;

	return child_process.execSync(command).toString('utf-8').replace(/(?:\r\n|\r|\n)/g, '').split("[")[1].split("/")[0];
}*/

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