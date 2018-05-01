import * as React from 'react'
import { ButtonGroup } from '../../ui/lib/button-group'
import { Button } from '../../ui/lib/button'
import { Dialog, DialogContent, DialogFooter } from '../../ui/dialog'
import { Repository } from '../../models/repository'

interface IConfirmRemoveRepositoryProps {
  /** The repository to be removed */
  readonly repository: Repository

  /** The action to execute when the user confirms */
  readonly onConfirmation: (repo: Repository) => void

  /** The action to execute when the user cancels */
  readonly onDismissed: () => void
}

export class ConfirmRemoveRepository extends React.Component<
  IConfirmRemoveRepositoryProps,
  {}
> {
  private cancel = () => {
    this.props.onDismissed()
  }

  private onConfirmed = () => {
    this.props.onConfirmation(this.props.repository)
    this.props.onDismissed()
  }

  public render() {
    return (
      <Dialog
        id="confirm-remove-repository"
        key="remove-repository-confirmation"
        type="warning"
        title={__DARWIN__ ? 'Remove Project' : 'Remove project'}
        onDismissed={this.cancel}
        onSubmit={this.cancel}
      >
        <DialogContent>
          <p>
            Are you sure you want to remove the project"{
              this.props.repository.name
            }"?
          </p>
          <p className="description">
            The project will be removed from Wevolver Desktop, but the files will remain on your computer.
          </p>
        </DialogContent>
        <DialogFooter>
          <ButtonGroup destructive={true}>
            <Button type="submit">Cancel</Button>
            <Button onClick={this.onConfirmed}>Remove</Button>
          </ButtonGroup>
        </DialogFooter>
      </Dialog>
    )
  }
}
