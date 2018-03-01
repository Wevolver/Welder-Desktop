import * as React from 'react'
// import { WelcomeStep } from './welcome'
import { LinkButton } from '../lib/link-button'

const CreateAccountURL = 'https://wevolver.com'

interface IStartProps {
  // readonly advance: (step: WelcomeStep) => void
}

/** The first step of the Welcome flow. */
export class Start extends React.Component<IStartProps, {}> {
  public render() {
    return (
      <div id="start">
        <h1 className="welcome-title">Welcome to Wevolver&nbsp;Desktop</h1>
        <p className="welcome-text">
          Wevolver Desktop is a seamless way to contribute to projects on GitHub
          and Wevolver Enterprise. Sign in below to get started with your existing
          projects.
        </p>

        <p className="welcome-text">
          New to Wevolver?{' '}
          <LinkButton uri={CreateAccountURL}>
            Create your free account.
          </LinkButton>
        </p>

        <hr className="short-rule" />

        <div>
          <LinkButton className="welcome-button" onClick={this.signInToDotCom}>
            Sign into Wevolver.com
          </LinkButton>
        </div>


        <div>
          <LinkButton
            className="welcome-button"
            onClick={this.signInToEnterprise}
          >
            Sign into Wevolver Enterprise
          </LinkButton>
        </div>

        <div className="skip-action-container">
          <LinkButton className="skip-button" onClick={this.skip}>
            Skip this step
          </LinkButton>
        </div>
      </div>
    )
  }

  private signInToDotCom = () => {
    // this.props.advance(WelcomeStep.SignInToDotCom)
  }

  private signInToEnterprise = () => {
    // this.props.advance(WelcomeStep.SignInToEnterprise)
  }

  private skip = () => {
    // this.props.advance(WelcomeStep.ConfigureGit)
  }
}
