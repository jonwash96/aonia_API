const { spawn } = require('node:child_process');


function runSpawn(f, dir, resolve, reject, hibernate) {
	const func = spawn(f, [dir]);

	func.on('spawn', (data) => {
		resolve(data);
	});

	func.on('exit', (data) => {
		hibernate();
		console.log(`Spawn exited. stdout: ${data}`);
	});

	func.on('disconnect', (data) => {
		hibernate();
		console.log(`Spawn disconnected. stdout: ${data}`);
	});

	func.on('error', (data) => {
		reject(new Error("Spawn encountered an unknown error", data));
		console.error(`ChildProc stderr: ${data}`);
	});

	func.stdout.on('data', (data) => {
		console.log(`ChildProc stdout: ${data}`);
	});

	func.stderr.on('data', (data) => {
		console.error(`stderr: ${data}`);
	});

	func.on('close', (code) => {
		hibernate();
		console.log(`Child process exited with code ${code}`);
	});

	return func
}



module.exports = runSpawn;