/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as assert from 'assert';
import * as path from 'path';
import { devContainerDown, devContainerUp, shellExec, UpResult } from './testUtils';
import { ContainerDetails } from '../spec-shutdown/dockerUtils';

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

	describe('Command stop', () => {
		describe('for image', () => {
			let upResult: UpResult | null = null;
			const testFolder = `${__dirname}/configs/image`;
			before(async () => {
				upResult = await devContainerUp(cli, testFolder);
			});
			after(async () => await devContainerDown({ containerId: upResult?.containerId }));

			it('should stop the running container without removing it', async () => {
				const res = await shellExec(`${cli} stop --workspace-folder ${testFolder}`);
				const response = JSON.parse(res.stdout);
				assert.equal(response.outcome, 'success');

				const details = JSON.parse((await shellExec(`docker inspect ${upResult!.containerId}`)).stdout)[0] as ContainerDetails;
				assert.notEqual(details.State.Status, 'running');
			});
		});

		describe('for docker-compose', () => {
			let upResult: UpResult | null = null;
			const testFolder = `${__dirname}/configs/compose-image-without-features`;
			before(async () => {
				upResult = await devContainerUp(cli, testFolder);
			});
			after(async () => await devContainerDown({ composeProjectName: upResult?.composeProjectName }));

			it('should stop the compose project without removing it', async () => {
				const res = await shellExec(`${cli} stop --workspace-folder ${testFolder}`);
				const response = JSON.parse(res.stdout);
				assert.equal(response.outcome, 'success');

				const details = JSON.parse((await shellExec(`docker inspect ${upResult!.containerId}`)).stdout)[0] as ContainerDetails;
				assert.notEqual(details.State.Status, 'running');
			});
		});
	});
});
