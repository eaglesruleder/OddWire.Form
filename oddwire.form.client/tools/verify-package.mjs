import { mkdtemp, cp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const client = resolve(import.meta.dirname, '..');
const consumerTemplate = join(client, 'consumer-proof');
const temp = await mkdtemp(join(tmpdir(), 'oddwire-form-consumer-'));
const consumer = join(temp, 'consumer');

try
{
    runNpm(['pack', '--pack-destination', temp], client);
    const tarball = join(temp, onlyTarball(await readdir(temp)));

    await cp(consumerTemplate, consumer,
        {recursive: true
        // The source fixture may have local installation products; a proof must always start clean.
        ,filter: source => !['node_modules', 'dist', 'package-lock.json'].includes(basename(source))
        });
    runNpm(['install'], consumer);
    runNpm(['install', tarball], consumer);
    runNpm(['test'], consumer);
    runNpm(['run', 'build'], consumer);
}
finally
{
    await rm(temp, { recursive: true, force: true });
}

function run(command, args, cwd)
{
    const result = spawnSync(command, args,
        {cwd
        ,encoding: 'utf8'
        // Surface the child npm phases in CI and local runs; package installation can take long enough
        // that buffered output makes a healthy verifier appear stalled.
        ,stdio: 'inherit'
        });

    if (result.status === 0)
        return result.stdout;

    if (result.error)
        process.stderr.write(`${result.error.message}\n`);
    const detail = result.error?.message ?? `exit ${result.status ?? 'unknown'}`;
    throw new Error(`${command} ${args.join(' ')} failed (${detail})`);
}

function runNpm(args, cwd)
{
    if (process.platform === 'win32')
    {
        const npmCli = resolve(process.execPath, '..', 'node_modules', 'npm', 'bin', 'npm-cli.js');
        return run(process.execPath, [npmCli, ...args], cwd);
    }

    return run('npm', args, cwd);
}

function onlyTarball(files)
{
    const tarballs = files.filter(file => file.endsWith('.tgz'));

    if (tarballs.length !== 1)
        throw new Error(`Expected one packed tarball, found ${tarballs.length}`);

    return tarballs[0];
}
