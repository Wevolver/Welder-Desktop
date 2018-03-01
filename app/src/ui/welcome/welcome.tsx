import * as React from 'react'
import { Dispatcher } from '../../lib/dispatcher'
// import { encodePathAsUrl } from '../../lib/path'
import { AppStore, SignInState } from '../../lib/stores'
import { assertNever } from '../../lib/fatal-error'
// import { Start } from './start'
import { ConfigureGit } from './configure-git'
import { UiView } from '../ui-view'

/** The steps along the Welcome flow. */
export enum WelcomeStep {
  ConfigureGit = 'ConfigureGit',
}

interface IWelcomeProps {
  readonly dispatcher: Dispatcher
  readonly appStore: AppStore
  readonly signInState: SignInState | null
}

interface IWelcomeState {
  readonly currentStep: WelcomeStep
}
//
// const WelcomeRightImageUri = encodePathAsUrl(
//   __dirname,
//   'static/welcome-illustration-right.svg'
// )
// const WelcomeLeftTopImageUri = encodePathAsUrl(
//   __dirname,
//   'static/welcome-illustration-left-top.svg'
// )
// const WelcomeLeftBottomImageUri = encodePathAsUrl(
//   __dirname,
//   'static/welcome-illustration-left-bottom.svg'
// )

/** The Welcome flow. */
export class Welcome extends React.Component<IWelcomeProps, IWelcomeState> {
  public constructor(props: IWelcomeProps) {
    super(props)
    this.state = { currentStep: WelcomeStep.ConfigureGit }
  }

  public componentWillReceiveProps(nextProps: IWelcomeProps) {
    // this.advanceOnSuccessfulSignIn(nextProps)
  }

  private get inSignInStep() {
    return false
  }

  private getComponentForCurrentStep() {
    const step = this.state.currentStep
    // const signInState = this.props.signInState

    switch (step) {
      // case WelcomeStep.Start:
      //   return <Start advance={this.advanceToStep} />
      //
      case WelcomeStep.ConfigureGit:
        return (
          <ConfigureGit
            advance={this.advanceToStep}
            accounts={this.props.appStore.getState().accounts}
            done={this.done}
          />
        )

      default:
        return assertNever(step, `Unknown welcome step: ${step}`)
    }
  }

  private advanceToStep = (step: WelcomeStep) => {
    this.setState({ currentStep: step })
  }

  private done = () => {
    this.props.dispatcher.endWelcomeFlow()
  }

  public render() {
    return (
      <UiView id="welcome">
        <div className="welcome-left">
          <div className="welcome-content">
            {this.getComponentForCurrentStep()}
          </div>
        </div>
      </UiView>
    )
  }
}
            // <img className="welcome-graphic-top" src={WelcomeLeftTopImageUri} />
            // <img
            //   className="welcome-graphic-bottom"
            //   src={WelcomeLeftBottomImageUri}
            // />
