import {
  git,
  GitError,
  IGitExecutionOptions,
  gitNetworkArguments,
} from './core'
import { Repository } from '../../models/repository'
import { stageFiles } from './update-index'
import { unstageAll } from './reset'
import { PullProgressParser, executionOptionsWithProgress } from '../progress'
import { WorkingDirectoryFileChange } from '../../models/status'
import { IPullProgress } from '../app-state'
import {
  IGitAccount,
  envForAuthentication,
  AuthenticationErrors,
} from './authentication'

/**
 * Pull from the specified remote.
 *
 * @param repository - The repository in which the pull should take place
 *
 * @param remote     - The name of the remote that should be pulled from
 *
 * @param progressCallback - An optional function which will be invoked
 *                           with information about the current progress
 *                           of the pull operation. When provided this enables
 *                           the '--progress' command line flag for
 *                           'git pull'.
 */
export async function pull(
  repository: Repository,
  account: IGitAccount | null,
  remote: string,
  files: ReadonlyArray<WorkingDirectoryFileChange>,
  progressCallback?: (progress: IPullProgress) => void,
): Promise<void> {
  let opts: IGitExecutionOptions = {
    env: envForAuthentication(account),
    expectedErrors: AuthenticationErrors,
  }

  await unstageAll(repository)

  await stageFiles(repository, files)

  if (progressCallback) {
    const title = `Pulling ${remote}`
    const kind = 'pull'

    opts = await executionOptionsWithProgress(
      { ...opts, trackLFSProgress: true },
      new PullProgressParser(),
      progress => {
        // In addition to progress output from the remote end and from
        // git itself, the stderr output from pull contains information
        // about ref updates. We don't need to bring those into the progress
        // stream so we'll just punt on anything we don't know about for now.
        if (progress.kind === 'context') {
          if (!progress.text.startsWith('remote: Counting objects')) {
            return
          }
        }

        const description =
          progress.kind === 'progress' ? progress.details.text : progress.text

        const value = progress.percent

        progressCallback({ kind, title, description, value, remote })
      }
    )

    // Initial progress
    progressCallback({ kind, title, value: 0, remote })
  }

  const args = progressCallback
    ? [...gitNetworkArguments, 'pull', '--no-rebase', '--progress', '-Xtheirs', remote]
    : [...gitNetworkArguments, 'pull', '--no-rebase', '-Xtheirs', remote]

  try {
    await git(['commit', '-F', '-'], repository.path, 'createCommit', {
      stdin: 'Got most recent revisions',
    })
  } catch (e) {
    const exitCode = e.result.exitCode

    if (e instanceof GitError && exitCode !== 1) {
      let standardError = e.result.stderr.trim()
      const error = new Error(
        `${standardError}`
      )
      error.name = 'commit-failed'
      throw error
    }
  }

  await git([...gitNetworkArguments, 'fetch', 'origin'], repository.path, 'fetch', opts)
  const result= await git([...gitNetworkArguments, 'merge', '-Xtheirs', '-m Saved previous revision on top of local changes', 'origin'], repository.path, 'merge', opts)

  if (result.gitErrorDescription) {
    throw new GitError(result, args)
  }

  const resultPush = await git([...gitNetworkArguments, 'push', 'origin', 'master'], repository.path, 'push', opts)
  if (resultPush.gitErrorDescription) {
    throw new GitError(resultPush, [...gitNetworkArguments, 'push', 'origin', 'master'])
  }
}
