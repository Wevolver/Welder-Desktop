import * as React from 'react'
import { lookupPreferredEmail } from '../../lib/email'
import {
  getGlobalConfigValue,
  setGlobalConfigValue,
} from '../../lib/git/config'
import { Account } from '../../models/account'
import { Form } from '../lib/form'
import { Button } from '../lib/button'
import { TextBox } from '../lib/text-box'
import { Row } from '../lib/row'

interface IConfigureGitUserProps {
  readonly accounts: ReadonlyArray<Account>
  readonly onSave?: () => void
  readonly saveLabel?: string
}

interface IConfigureGitUserState {
  readonly name: string
  readonly email: string
  readonly avatarURL: string | null
}

export class ConfigureGitUser extends React.Component<
  IConfigureGitUserProps,
  IConfigureGitUserState
> {
  public constructor(props: IConfigureGitUserProps) {
    super(props)
    this.state = { name: '', email: '', avatarURL: null }
  }

  public async componentWillMount() {
    let name = await getGlobalConfigValue('user.name')
    let email = await getGlobalConfigValue('user.email')

    const user = this.props.accounts[0]
    if ((!name || !name.length) && user) {
      name = user.name && user.name.length ? user.name : user.login
    }

    if ((!email || !email.length) && user) {
      const found = lookupPreferredEmail(user.emails)
      if (found) {
        email = found.email
      }
    }

    const avatarURL = email ? this.avatarURLForEmail(email) : null
    this.setState({ name: name || '', email: email || '', avatarURL })
  }

  public render() {
    return (
      <div id="configure-git-user">
        <Form className="sign-in-form" onSubmit={this.save}>
          <TextBox
            label="Name"
            placeholder="Your Name"
            value={this.state.name}
            onValueChanged={this.onNameChange}
          />

          <TextBox
            label="Email"
            placeholder="your-email@example.com"
            value={this.state.email}
            onValueChanged={this.onEmailChange}
          />

          <Row>
            <Button type="submit">{this.props.saveLabel || 'Save'}</Button>
            {this.props.children}
          </Row>
        </Form>
      </div>
    )
  }

  private onNameChange = (name: string) => {
    this.setState({
      name,
    })
  }

  private onEmailChange = (email: string) => {
    const avatarURL = this.avatarURLForEmail(email)

    this.setState({
      name: this.state.name,
      email,
      avatarURL,
    })
  }

  private avatarURLForEmail(email: string): string | null {
    const matchingAccount = this.props.accounts.find(
      a => a.emails.findIndex(e => e.email === email) > -1
    )
    return matchingAccount ? matchingAccount.avatarURL : null
  }

  private save = async () => {
    if (this.props.onSave) {
      this.props.onSave()
    }

    const name = this.state.name
    if (name.length) {
      await setGlobalConfigValue('user.name', name)
    }

    const email = this.state.email
    if (email.length) {
      await setGlobalConfigValue('user.email', email)
    }
  }
}
