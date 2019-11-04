import * as React from 'react'
import { UiView } from '../ui-view'
import { Button } from '../lib/button'

interface IBlankSlateProps {
  readonly onClone: () => void,
  readonly onCreate: () => void,
  readonly onAdd: () => void
}

export class BlankSlateView extends React.Component<IBlankSlateProps, {}> {
  public render() {
    return (
      <UiView id="blank-slate">
        <div className="blankslate-image" />

        <div className="content">
          <div className="title">
            {__DARWIN__ ? 'No Project Selected' : 'No project selected'}
          </div>

          <div className="callouts">
            <div className="callout">
              <div>Clone an existing project from Welder to your computer</div>
              <Button onClick={this.props.onClone}>
                {__DARWIN__ ? 'Clone a Project' : 'Clone a project'}
              </Button>
            </div>
          </div>
        </div>
      </UiView>
    )
  }
}
