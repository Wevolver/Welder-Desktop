import { MenuIDs } from '../main-process/menu'
import { merge } from './merge'
import { IAppState, SelectionType } from '../lib/app-state'
// import { Repository } from '../models/repository'
// import { CloningRepository } from '../models/cloning-repository'
import { TipState } from '../models/tip'
import { updateMenuState as ipcUpdateMenuState } from '../ui/main-process-proxy'
import { AppMenu, MenuItem } from '../models/app-menu'

export interface IMenuItemState {
  readonly enabled?: boolean
}

/**
 * Utility class for coalescing updates to menu items
 */
class MenuStateBuilder {
  private readonly _state: Map<MenuIDs, IMenuItemState>

  public constructor(state: Map<MenuIDs, IMenuItemState> = new Map()) {
    this._state = state
  }

  /**
   * Returns an Map where each key is a MenuID and the values
   * are IMenuItemState instances containing information about
   * whether a particular menu item should be enabled/disabled or
   * visible/hidden.
   */
  public get state() {
    return new Map<MenuIDs, IMenuItemState>(this._state)
  }

  private updateMenuItem<K extends keyof IMenuItemState>(
    id: MenuIDs,
    state: Pick<IMenuItemState, K>
  ) {
    const currentState = this._state.get(id) || {}
    this._state.set(id, merge(currentState, state))
  }

  /** Set the state of the given menu item id to enabled */
  public enable(id: MenuIDs): this {
    this.updateMenuItem(id, { enabled: true })
    return this
  }

  /** Set the state of the given menu item id to disabled */
  public disable(id: MenuIDs): this {
    this.updateMenuItem(id, { enabled: false })
    return this
  }

  /** Set the enabledness of the given menu item id */
  public setEnabled(id: MenuIDs, enabled: boolean): this {
    this.updateMenuItem(id, { enabled })
    return this
  }

  /**
   * Create a new state builder by merging the current state with the state from
   * the other state builder. This will replace values in `this` with values
   * from `other`.
   */
  public merge(other: MenuStateBuilder): MenuStateBuilder {
    const merged = new Map<MenuIDs, IMenuItemState>(this._state)
    for (const [key, value] of other._state) {
      merged.set(key, value)
    }
    return new MenuStateBuilder(merged)
  }
}

// function isRepositoryHostedOnGitHub(
//   repository: Repository | CloningRepository
// ) {
//   if (
//     !repository ||
//     repository instanceof CloningRepository ||
//     !repository.gitHubRepository
//   ) {
//     return false
//   }
//
//   return repository.gitHubRepository.htmlURL !== null
// }

function menuItemStateEqual(state: IMenuItemState, menuItem: MenuItem) {
  if (
    state.enabled !== undefined &&
    menuItem.type !== 'separator' &&
    menuItem.enabled !== state.enabled
  ) {
    return false
  }

  return true
}

const allMenuIds: ReadonlyArray<MenuIDs> = [
  'preferences',
  'view-repository-on-github',
  'open-in-shell',
  'repository',
  'show-changes',
  'show-history',
  'show-repository-list',
  'open-working-directory',
  'show-repository-settings',
  'clone-repository',
  'about',
]

function getAllMenusDisabledBuilder(): MenuStateBuilder {
  const menuStateBuilder = new MenuStateBuilder()

  for (const menuId of allMenuIds) {
    menuStateBuilder.disable(menuId)
  }

  return menuStateBuilder
}

function getRepositoryMenuBuilder(state: IAppState): MenuStateBuilder {
  const selectedState = state.selectedState
  // const isHostedOnGitHub = selectedState
  //   ? isRepositoryHostedOnGitHub(selectedState.repository)
  //   : false

  let repositorySelected = false
  // let onNonDefaultBranch = false
  // let onBranch = false
  // let hasDefaultBranch = false
  // let hasPublishedBranch = false
  // let networkActionInProgress = false
  // let tipStateIsUnknown = false
  // let branchIsUnborn = false

  // let hasRemote = false

  if (selectedState && selectedState.type === SelectionType.Repository) {
    repositorySelected = true

    const branchesState = selectedState.state.branchesState
    const tip = branchesState.tip
    const defaultBranch = branchesState.defaultBranch

    // hasDefaultBranch = Boolean(defaultBranch)

    // onBranch = tip.kind === TipState.Valid
    // tipStateIsUnknown = tip.kind === TipState.Unknown
    // branchIsUnborn = tip.kind === TipState.Unborn

    // If we are:
    //  1. on the default branch, or
    //  2. on an unborn branch, or
    //  3. on a detached HEAD
    // there's not much we can do.
    if (tip.kind === TipState.Valid) {
      if (defaultBranch !== null) {
        // onNonDefaultBranch = tip.branch.name !== defaultBranch.name
      }

      // hasPublishedBranch = !!tip.branch.upstream
    } else {
      // onNonDefaultBranch = true
    }

    // hasRemote = !!selectedState.state.remote

    // networkActionInProgress = selectedState.state.isPushPullFetchInProgress
  }

  // These are IDs for menu items that are entirely _and only_
  // repository-scoped. They're always enabled if we're in a repository and
  // always disabled if we're not.
  const repositoryScopedIDs: ReadonlyArray<MenuIDs> = [
    'repository',
    'open-in-shell',
    'open-working-directory',
    'show-repository-settings',
    'show-changes',
    'show-history',
  ]

  const menuStateBuilder = new MenuStateBuilder()

  const windowOpen = state.windowState !== 'hidden'
  const inWelcomeFlow = state.showWelcomeFlow
  const repositoryActive = windowOpen && repositorySelected && !inWelcomeFlow

  if (repositoryActive) {
    for (const id of repositoryScopedIDs) {
      menuStateBuilder.enable(id)
    }


    menuStateBuilder.enable('view-repository-on-github')

    if (
      selectedState &&
      selectedState.type === SelectionType.MissingRepository
    ) {
      // menuStateBuilder.enable('remove-repository')
    }

  }
  return menuStateBuilder
}

function getMenuState(state: IAppState): Map<MenuIDs, IMenuItemState> {
  if (state.currentPopup) {
    return getAllMenusDisabledBuilder().state
  }

  return getAllMenusEnabledBuilder()
    .merge(getRepositoryMenuBuilder(state))
    .merge(getInWelcomeFlowBuilder(state.showWelcomeFlow)).state
}

function getAllMenusEnabledBuilder(): MenuStateBuilder {
  const menuStateBuilder = new MenuStateBuilder()
  for (const menuId of allMenuIds) {
    menuStateBuilder.enable(menuId)
  }
  return menuStateBuilder
}

function getInWelcomeFlowBuilder(inWelcomeFlow: boolean): MenuStateBuilder {
  const welcomeScopedIds: ReadonlyArray<MenuIDs> = [
    'clone-repository',
    'preferences',
    'about',
  ]

  const menuStateBuilder = new MenuStateBuilder()
  if (inWelcomeFlow) {
    for (const id of welcomeScopedIds) {
      menuStateBuilder.disable(id)
    }
  } else {
    for (const id of welcomeScopedIds) {
      menuStateBuilder.enable(id)
    }
  }

  return menuStateBuilder
}

/**
 * Update the menu state in the main process.
 *
 * This function will set the enabledness and visibility of menu items
 * in the main process based on the AppState. All changes will be
 * batched together into one ipc message.
 */
export function updateMenuState(
  state: IAppState,
  currentAppMenu: AppMenu | null
) {
  const menuState = getMenuState(state)

  // Try to avoid updating sending the IPC message at all
  // if we have a current app menu that we can compare against.
  if (currentAppMenu) {
    for (const [id, menuItemState] of menuState.entries()) {
      const appMenuItem = currentAppMenu.getItemById(id)

      if (appMenuItem && menuItemStateEqual(menuItemState, appMenuItem)) {
        menuState.delete(id)
      }
    }
  }

  if (menuState.size === 0) {
    return
  }

  // because we can't send Map over the wire, we need to convert
  // the remaining entries into an array that can be serialized
  const array = new Array<{ id: MenuIDs; state: IMenuItemState }>()
  menuState.forEach((value, key) => array.push({ id: key, state: value }))
  ipcUpdateMenuState(array)
}
