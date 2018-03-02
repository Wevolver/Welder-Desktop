import * as React from 'react'
import { Commit } from '../../models/commit'
import { GitHubRepository } from '../../models/github-repository'
import { IAvatarUser, getAvatarUsersForCommit } from '../../models/avatar'
import { RichText } from '../lib/rich-text'
import { RelativeTime } from '../relative-time'
import { CommitAttribution } from '../lib/commit-attribution'
import { IGitHubUser } from '../../lib/databases/github-user-database'
import { AvatarStack } from '../lib/avatar-stack'

interface ICommitProps {
  readonly gitHubRepository: GitHubRepository | null
  readonly commit: Commit
  readonly emoji: Map<string, string>
  readonly isLocal: boolean
  readonly onRevertCommit?: (commit: Commit) => void
  readonly onViewCommitOnGitHub?: (sha: string) => void
  readonly gitHubUsers: Map<string, IGitHubUser> | null
}

interface ICommitListItemState {
  readonly avatarUsers: ReadonlyArray<IAvatarUser>
}

export class CommitListItem extends React.Component<
  ICommitProps,
  ICommitListItemState
> {
  public constructor(props: ICommitProps) {
    super(props)

    this.state = {
      avatarUsers: getAvatarUsersForCommit(
        props.gitHubRepository,
        props.gitHubUsers,
        props.commit
      ),
    }
  }

  public componentWillReceiveProps(nextProps: ICommitProps) {
    if (nextProps.commit !== this.props.commit) {
      this.setState({
        avatarUsers: getAvatarUsersForCommit(
          nextProps.gitHubRepository,
          nextProps.gitHubUsers,
          nextProps.commit
        ),
      })
    }
  }

  public render() {
    const commit = this.props.commit
    const author = commit.author

    return (
      <div className="commit" onContextMenu={this.onContextMenu}>
        <div className="info">
          <RichText
            className="summary"
            emoji={this.props.emoji}
            text={commit.summary}
            renderUrlsAsLinks={false}
          />
          <div className="description">
            <AvatarStack users={this.state.avatarUsers} />
            <div className="byline">
              <CommitAttribution
                gitHubRepository={this.props.gitHubRepository}
                commit={commit}
              />{' '}
              <RelativeTime date={author.date} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  public shouldComponentUpdate(nextProps: ICommitProps): boolean {
    return this.props.commit.sha !== nextProps.commit.sha
  }

  private onContextMenu = (event: React.MouseEvent<any>) => {
    event.preventDefault()
  }
}
