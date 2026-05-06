/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as path from 'path';
import { devContainerDown, devContainerUp, shellExec, UpResult } from './testUtils';

const pkg = require('../../package.json');

describe('Dev Containers CLI', function () {
	this.timeout('240s');

	const tmp = path.relative(process.cwd(), path.join(__dirname, 'tmp'));
	const cli = `npx --prefix ${tmp} devcontainer`;

	before('Install', async () => {
		await shellExec(`rm -rf ${tmp}/node_modules`);
		await shellExec(`mkdir -p ${tmp}`);
		await shellExec(`npm --prefix ${tmp} install devcontainers-cli-${pkg.version}.tgz`);
	});

	describe('Command down', () => {
		describe('for image', () => {
			let upResult: UpResult | null = null;
			const testFolder = `${__dirname}/configs/image`;
			before(async () => {
				upResult = await devContainerUp(cli, testFolder);
			});
			after(async () => await devContainerDown({ containerId: upResult?.containerId, doNotThrow: true }));

			it('should stop and remove the running container', async () => {
				const res = await shellExec(`${cli} down --workspace-folder ${testFolder}`);
				const response = JSON.parse(res.stdout);
				assert.equal(response.outcome, 'success');

				const listing = await shellExec(`docker ps -a --filter id=${upResult!.containerId} --format '{{.ID}}'`);
				assert.equal(listing.stdout.trim(), '', 'Container should have been removed.');
			});
		});

		describe('for docker-compose', () => {
			let upResult: UpResult | null = null;
			const testFolder = `${__dirname}/configs/compose-image-without-features`;
			before(async () => {
				upResult = await devContainerUp(cli, testFolder);
			});
			after(async () => await devContainerDown({ composeProjectName: upResult?.composeProjectName, doNotThrow: true }));

			it('should stop and remove the compose project', async () => {
				const res = await shellExec(`${cli} down --workspace-folder ${testFolder}`);
				const response = JSON.parse(res.stdout);
				assert.equal(response.outcome, 'success');

				const listing = await shellExec(`docker ps -a --filter id=${upResult!.containerId} --format '{{.ID}}'`);
				assert.equal(listing.stdout.trim(), '', 'Compose container should have been removed.');
			});
		});
	});
});
