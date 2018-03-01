import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Account } from '../../models/account'
import { ConfigureGitUser } from '../lib/configure-git-user'
// import { Button } from '../lib/button'

interface IConfigureGitProps {
  readonly accounts: ReadonlyArray<Account>
  readonly advance: (step: WelcomeStep) => void
  readonly done: () => void
}

/** The Welcome flow step to configure git. */
export class ConfigureGit extends React.Component<IConfigureGitProps, {}> {
  public render() {
    return (
      <div id="configure-git">
        <h1 className="welcome-title">Sign into Wevolver Desktop</h1>
        <p className="welcome-text">
        This information is used to identify your revisions.
        <br></br>
        <br></br>
        If you publish revisions to a public project, anyone will be able to see this information.
        In the case of private projects only your team members will see these details.
        </p>


        <ConfigureGitUser
          accounts={this.props.accounts}
          onSave={this.continue}
          saveLabel="Continue"
        >
        </ConfigureGitUser>
      </div>
    )
  }

  private continue = () => {
    this.props.done()
  }
}
