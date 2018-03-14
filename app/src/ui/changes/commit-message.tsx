import * as React from 'react'
import * as classNames from 'classnames'
import {
  AutocompletingTextArea,
  IAutocompletionProvider,
  UserAutocompletionProvider,
} from '../autocompletion'
import { CommitIdentity } from '../../models/commit-identity'
import { ICommitMessage } from '../../lib/app-state'
import { Dispatcher } from '../../lib/dispatcher'
import { IGitHubUser } from '../../lib/databases/github-user-database'
import { Repository } from '../../models/repository'
import { Button } from '../lib/button'
import { Loading } from '../lib/loading'
import { structuralEquals } from '../../lib/equality'
import { ITrailer } from '../../lib/git/interpret-trailers'
// import { IAuthor } from '../../models/author'
import { AppStore } from '../../lib/stores'
import { SelectionType } from '../../lib/app-state'


interface ICommitMessageProps {
  readonly onCreateCommit: (
    summary: string,
    description: string | null,
    trailers?: ReadonlyArray<ITrailer>
  ) => Promise<boolean>
  readonly appStore: AppStore
  readonly branch: string | null
  readonly commitAuthor: CommitIdentity | null
  readonly gitHubUser: IGitHubUser | null
  readonly anyFilesSelected: boolean
  readonly commitMessage: ICommitMessage | null
  readonly contextualCommitMessage: ICommitMessage | null
  readonly repository: Repository
  readonly dispatcher: Dispatcher
  readonly autocompletionProviders: ReadonlyArray<IAutocompletionProvider<any>>
  readonly isCommitting: boolean

  /**
   * Whether or not to show a field for adding co-authors to
   * a commit (currently only supported for GH/GHE repositories)
   */
  readonly showCoAuthoredBy: boolean

  /**
   * A list of authors (name, email pairs) which have been
   * entered into the co-authors input box in the commit form
   * and which _may_ be used in the subsequent commit to add
   * Co-Authored-By commit message trailers depending on whether
   * the user has chosen to do so.
   */
  // readonly coAuthors: ReadonlyArray<IAuthor>
}

interface ICommitMessageState {
  readonly summary: string
  readonly description: string | null
  readonly getLatestEnabled: boolean
  readonly saveRevisionEnabled: boolean
  /** The last contextual commit message we've received. */
  readonly lastContextualCommitMessage: ICommitMessage | null

  readonly userAutocompletionProvider: UserAutocompletionProvider | null

  /**
   * Whether or not the description text area has more text that's
   * obscured by the action bar. Note that this will always be
   * false when there's no action bar.
   */
  readonly descriptionObscured: boolean
}

function findUserAutoCompleteProvider(
  providers: ReadonlyArray<IAutocompletionProvider<any>>
): UserAutocompletionProvider | null {
  for (const provider of providers) {
    if (provider instanceof UserAutocompletionProvider) {
      return provider
    }
  }

  return null
}

export class CommitMessage extends React.Component<
  ICommitMessageProps,
  ICommitMessageState
> {
  // private descriptionComponent: AutocompletingTextArea | null = null

  // private descriptionTextArea: HTMLTextAreaElement | null = null
  // private descriptionTextAreaScrollDebounceId: number | null = null

  public constructor(props: ICommitMessageProps) {
    super(props)

    this.state = {
      summary: '',
      description: '',
      getLatestEnabled: true,
      saveRevisionEnabled: true,
      lastContextualCommitMessage: null,
      userAutocompletionProvider: findUserAutoCompleteProvider(
        props.autocompletionProviders
      ),
      descriptionObscured: false,
    }
  }

  public componentWillMount() {
    this.receiveProps(this.props, true)
  }

  public componentWillUnmount() {
    // We're unmounting, likely due to the user switching to the history tab.
    // Let's persist our commit message in the dispatcher.
    this.props.dispatcher.setCommitMessage(this.props.repository, this.state)
  }

  public componentWillReceiveProps(nextProps: ICommitMessageProps) {
    this.receiveProps(nextProps, false)
  }

  private receiveProps(nextProps: ICommitMessageProps, initializing: boolean) {
    // If we're switching away from one repository to another we'll persist
    // our commit message in the dispatcher.
    if (nextProps.repository.id !== this.props.repository.id) {
      this.props.dispatcher.setCommitMessage(this.props.repository, this.state)
    }

    if (
      nextProps.autocompletionProviders !== this.props.autocompletionProviders
    ) {
      this.setState({
        userAutocompletionProvider: findUserAutoCompleteProvider(
          nextProps.autocompletionProviders
        ),
      })
    }

    // This is rather gnarly. We want to persist the commit message (summary,
    // and description) in the dispatcher on a per-repository level (git-store).
    //
    // Our dispatcher is asynchronous and only emits and update on animation
    // frames. This is a great thing for performance but it gets real messy
    // when you throw text boxes into the mix. If we went for a traditional
    // approach of persisting the textbox values in the dispatcher and updating
    // the virtual dom when we get new props there's an interim state which
    // means that the browser can't keep track of the cursor for us, see:
    //
    //   http://stackoverflow.com/a/28922465
    //
    // So in order to work around that we keep the text values in the component
    // state. Whenever they get updated we submit the update to the dispatcher
    // but we disregard the message that flows to us on the subsequent animation
    // frame unless we have switched repositories.
    //
    // Then there's the case when we're being mounted (think switching between
    // history and changes tabs. In that case we have to rely on what's in the
    // dispatcher since we don't have any state of our own.

    const nextContextualCommitMessage = nextProps.contextualCommitMessage
    const lastContextualCommitMessage = this.state.lastContextualCommitMessage
    // If the contextual commit message changed, we'll use it as our commit
    // message.
    if (
      nextContextualCommitMessage &&
      (!lastContextualCommitMessage ||
        !structuralEquals(
          nextContextualCommitMessage,
          lastContextualCommitMessage
        ))
    ) {
      this.setState({
        summary: nextContextualCommitMessage.summary,
        description: nextContextualCommitMessage.description,
        lastContextualCommitMessage: nextContextualCommitMessage,
      })
    } else if (
      initializing ||
      this.props.repository.id !== nextProps.repository.id
    ) {
      // We're either initializing (ie being mounted) or someone has switched
      // repositories. If we receive a message we'll take it
      if (nextProps.commitMessage) {
        // Don't update dispatcher here, we're receiving it, could cause never-
        // ending loop.
        this.setState({
          summary: nextProps.commitMessage.summary,
          description: nextProps.commitMessage.description,
          lastContextualCommitMessage: nextContextualCommitMessage,
        })
      } else {
        // No message, assume clean slate
        this.setState({
          summary: '',
          description: null,
          lastContextualCommitMessage: nextContextualCommitMessage,
        })
      }
    } else {
      this.setState({
        lastContextualCommitMessage: nextContextualCommitMessage,
      })
    }
  }

  private clearCommitMessage() {
    this.setState({ summary: '', description: null })
  }

  private onSummaryChanged = (summary: string) => {
    this.setState({ summary })
  }

  // private onDescriptionChanged = (description: string) => {
  //   this.setState({ description })
  // }

  private onSubmit = () => {
    this.getLatestChanges()
  }

  private async createCommit() {
    const { summary, description } = this.state
   
    if (!this.canCommit()) {
      return
    }
    this.setState({saveRevisionEnabled: false})

    const commitCreated = await this.props.onCreateCommit(
      summary,
      description
    )

    if (commitCreated) {
      this.clearCommitMessage()
    }
    this.setState({saveRevisionEnabled: true})
  }

  private onSave = () => {
    this.createCommit()
  }

  private async getLatestChanges() {
    this.setState({getLatestEnabled: false})
    const selection = this.props.appStore.getState().selectedState

    if (!selection || selection.type !== SelectionType.Repository) {
      return
    }

    await this.props.dispatcher.pull(selection.repository)
    this.clearCommitMessage()
    this.setState({getLatestEnabled: true})
  }

  private canCommit(): boolean {
    return this.props.anyFilesSelected && this.state.summary.length > 0
  }

  private onKeyDown = (event: React.KeyboardEvent<Element>) => {
    if (event.defaultPrevented) {
      return
    }

    const isShortcutKey = __DARWIN__ ? event.metaKey : event.ctrlKey
    if (isShortcutKey && event.key === 'Enter' && this.canCommit()) {
      this.createCommit()
      event.preventDefault()
    }
  }

  private get isCoAuthorInputEnabled() {
    return this.props.repository.gitHubRepository !== null
  }

  /**
   * Whether or not there's anything to render in the action bar
   */
  private get isActionBarEnabled() {
    return this.isCoAuthorInputEnabled
  }

  public render() {

    const loading = !this.state.getLatestEnabled ? <Loading /> : undefined
    const loadingTwo = !this.state.saveRevisionEnabled ? <Loading /> : undefined

    const buttonEnabled = this.state.getLatestEnabled && !loadingTwo
    const buttonTwoEnabled = this.state.saveRevisionEnabled && this.canCommit() && !loading

    const className = classNames({
      'with-action-bar': this.isActionBarEnabled
    })

    return (
      <div
        id="commit-message"
        role="group"
        aria-label="Create commit"
        className={className}
        onKeyDown={this.onKeyDown}
      >
      <h3> Revision Message </h3>
        <div className="summary">
          <AutocompletingTextArea
            className="summary-field"
            placeholder="Message"
            value={this.state.summary}
            onValueChanged={this.onSummaryChanged}
            autocompletionProviders={this.props.autocompletionProviders}
            disabled={this.props.isCommitting || !this.props.anyFilesSelected}
          />
        </div>

        <div style={{display: 'flex', justifyContent: 'space-between'}}>
          <div style={{ width: '49%'}}>
            <Button
              type="submit"
              className={loading ? "commit-button  aligned-left" : "commit-button"}
              onClick={this.onSubmit}
              disabled={!buttonEnabled}
            >
              {loading}
              <span title={`Get Latest Changes`} style={{textAlign: 'left', marginLeft: 8, marginRight: 8}}>
                {loading ? <span>{this.props.anyFilesSelected && <span>Saving revision &amp;<br /></span>} Getting latest revisions...</span> : 'Get Latest Changes'}
              </span>
            </Button>
          </div>
          <div style={{ width: '49%'}}>
            <Button
              type="submit"
              className={loadingTwo ? "commit-button  aligned-left" : "commit-button"}
              onClick={this.onSave}
              disabled={!buttonTwoEnabled}
            >
              {loadingTwo}
              <span title={`Save Revision`} style={{textAlign: 'left', marginLeft: 8, marginRight: 8}}>
                {loadingTwo ? 'Saving Revision...' : 'Save Revision'}
              </span>
            </Button>
          </div>
        </div>
      </div>
    )
  }
}
