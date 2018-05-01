import { git, GitError, gitNetworkArguments, IGitExecutionOptions } from './core'
import { stageFiles } from './update-index'
import { Repository } from '../../models/repository'
import { WorkingDirectoryFileChange } from '../../models/status'
import { unstageAll } from './reset'
import {
  IGitAccount,
  envForAuthentication,
  AuthenticationErrors,
} from './authentication'

export async function createCommit(
  repository: Repository,
  message: string,
  files: ReadonlyArray<WorkingDirectoryFileChange>,
  account: IGitAccount | null,
): Promise<boolean> {
  let opts: IGitExecutionOptions = {
    env: envForAuthentication(account),
    expectedErrors: AuthenticationErrors,
  }

  // const resultFtech = await git([...gitNetworkArguments, 'fetch', '--prune', 'origin'], repository.path, 'fetch', opts)
  // if (resultFtech.gitErrorDescription) {
  //   throw new GitError(resultFtech, [...gitNetworkArguments, 'fetch', '--prune', 'origin'])
  // }

  // Clear the staging area, our diffs reflect the difference between the
  // working directory and the last commit (if any) so our commits should
  // do the same thing.
  await unstageAll(repository)

  await stageFiles(repository, files)

  try {
    await git(['commit', '-F', '-'], repository.path, 'createCommit', {
      stdin: message,
    })
  } catch (e) {
    // Commit failures could come from a pre-commit hook rejection. So display
    // a bit more context than we otherwise would.

    if (e instanceof GitError) {
      let standardError = e.result.stderr.trim()
      const error = new Error(
        `${standardError}`
      )
      error.name = 'commit-failed'
      throw error
    } else {
      throw e
    }
  }

  await git([...gitNetworkArguments, 'fetch', 'origin'], repository.path, 'fetch', opts)
  const resultPull = await git([...gitNetworkArguments, 'merge', '-Xours', '-m Saved my changes on top of the previous revision', 'origin'], repository.path, 'merge', opts)
  if (resultPull.gitErrorDescription) {
    throw new GitError(resultPull, [...gitNetworkArguments, 'pull', '--no-rebase', '-Xours', 'origin'])
  }

  const resultPush = await git([...gitNetworkArguments, 'push', 'origin', 'master'], repository.path, 'push', opts)
  if (resultPush.gitErrorDescription) {
    throw new GitError(resultPush, [...gitNetworkArguments, 'push', 'origin', 'master'])
  }
  return true
}
