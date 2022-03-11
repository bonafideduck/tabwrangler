/* @flow */

import * as React from "react";
import { isLocked, isManuallyLockable } from "./tab";
import OpenTabRow from "./OpenTabRow";
import browser from "webextension-polyfill";
import cx from "classnames";
import memoize from "memoize-one";

// Unpack TW.
const { settings, tabmanager } = browser.extension.getBackgroundPage().TW;

type Sorter = {
  key: string,
  label: string,
  shortLabel: string,
  sort: (a: ?browser$Tab, b: ?browser$Tab) => number,
};

const ChronoSorter: Sorter = {
  key: "chrono",
  label: browser.i18n.getMessage("tabLock_sort_timeUntilClose") || "",
  shortLabel: browser.i18n.getMessage("tabLock_sort_timeUntilClose_short") || "",
  sort(tabA, tabB) {
    if (tabA == null || tabB == null) {
      return 0;
    } else if (isLocked(tabA) && !isLocked(tabB)) {
      return 1;
    } else if (!isLocked(tabA) && isLocked(tabB)) {
      return -1;
    } else {
      const lastModifiedA = tabmanager.tabTimes[tabA.id];
      const lastModifiedB = tabmanager.tabTimes[tabB.id];
      return lastModifiedA - lastModifiedB;
    }
  },
};

const ReverseChronoSorter: Sorter = {
  key: "reverseChrono",
  label: browser.i18n.getMessage("tabLock_sort_timeUntilClose_desc") || "",
  shortLabel: browser.i18n.getMessage("tabLock_sort_timeUntilClose_desc_short") || "",
  sort(tabA, tabB) {
    return -1 * ChronoSorter.sort(tabA, tabB);
  },
};

const TabOrderSorter: Sorter = {
  key: "tabOrder",
  label: browser.i18n.getMessage("tabLock_sort_tabOrder") || "",
  shortLabel: browser.i18n.getMessage("tabLock_sort_tabOrder_short") || "",
  sort(tabA, tabB) {
    if (tabA == null || tabB == null) {
      return 0;
    } else if (tabA.windowId === tabB.windowId) {
      return tabA.index - tabB.index;
    } else {
      return tabA.windowId - tabB.windowId;
    }
  },
};

const ReverseTabOrderSorter: Sorter = {
  key: "reverseTabOrder",
  label: browser.i18n.getMessage("tabLock_sort_tabOrder_desc") || "",
  shortLabel: browser.i18n.getMessage("tabLock_sort_tabOrder_desc_short") || "",
  sort(tabA, tabB) {
    return -1 * TabOrderSorter.sort(tabA, tabB);
  },
};

const DEFAULT_SORTER = TabOrderSorter;
const Sorters = [TabOrderSorter, ReverseTabOrderSorter, ChronoSorter, ReverseChronoSorter];

type State = {
  isSortDropdownOpen: boolean,
  savedSortOrder: ?string,
  sorter: Sorter,
  tabs: Array<browser$Tab>,
};

export default class LockTab extends React.PureComponent<{}, State> {
  _dropdownRef: ?HTMLElement;
  _lastSelectedTab: ?browser$Tab;
  _timeLeftInterval: ?number;

  constructor() {
    super();
    const savedSortOrder = settings.get("lockTabSortOrder");
    let sorter =
      savedSortOrder == null
        ? DEFAULT_SORTER
        : Sorters.find((sorter) => sorter.key === savedSortOrder);

    // If settings somehow stores a bad value, always fall back to default order.
    if (sorter == null) sorter = DEFAULT_SORTER;

    this.state = {
      isSortDropdownOpen: false,
      savedSortOrder,
      sorter,
      tabs: [],
    };
  }

  componentDidMount() {
    this._timeLeftInterval = window.setInterval(this.forceUpdate.bind(this), 1000);

    // TODO: THIS WILL BREAK. This is some async stuff inside a synchronous call. Fix this, move
    // the state into a higher component.
    browser.tabs.query({}).then((tabs) => {
      this.setState({ tabs });
    });

    window.addEventListener("click", this._handleWindowClick);
  }

  componentWillUnmount() {
    window.removeEventListener("click", this._handleWindowClick);
    window.clearInterval(this._timeLeftInterval);
  }

  _clickSorter(sorter: Sorter, event: SyntheticMouseEvent<HTMLElement>) {
    // The dropdown wraps items in bogus `<a href="#">` elements in order to match Bootstrap's
    // style. Prevent default on the event in order to prevent scrolling to the top of the window
    // (the default action for an empty anchor "#").
    event.preventDefault();

    if (sorter === this.state.sorter) {
      // If this is already the active sorter, close the dropdown and do no work since the state is
      // already correct.
      this.setState({ isSortDropdownOpen: false });
    } else {
      // When the saved sort order is not null then the user wants to preserve it. Update to the
      // new sort order and persist it.
      if (settings.get("lockTabSortOrder") != null) {
        settings.set("lockTabSortOrder", sorter.key);
      }

      this.setState({
        isSortDropdownOpen: false,
        sorter,
      });
    }
  }

  _handleChangeSaveSortOrder: (event: SyntheticInputEvent<HTMLInputElement>) => void = (
    event: SyntheticInputEvent<HTMLInputElement>
  ) => {
    if (event.target.checked) {
      settings.set("lockTabSortOrder", this.state.sorter.key);
      this.setState({ savedSortOrder: this.state.sorter.key });
    } else {
      settings.set("lockTabSortOrder", null);
      this.setState({ savedSortOrder: null });
    }
  };

  _handleToggleTab: (tab: browser$Tab, selected: boolean, multiselect: boolean) => void = (
    tab: browser$Tab,
    selected: boolean,
    multiselect: boolean
  ) => {
    let tabsToToggle = [tab];
    const tabs = this._getSortedTabs(this.state.tabs, this.state.sorter);
    if (multiselect && this._lastSelectedTab != null) {
      const lastSelectedTabIndex = tabs.indexOf(this._lastSelectedTab);
      if (lastSelectedTabIndex >= 0) {
        const tabIndex = tabs.indexOf(tab);
        tabsToToggle = tabs.slice(
          Math.min(tabIndex, lastSelectedTabIndex),
          Math.max(tabIndex, lastSelectedTabIndex) + 1
        );
      }
    }

    // Toggle only the tabs that are manually lockable.
    tabsToToggle
      .filter((tab) => isManuallyLockable(tab))
      .forEach((tab) => {
        if (selected) tabmanager.lockTab(tab.id);
        else tabmanager.unlockTab(tab.id);
      });

    this._lastSelectedTab = tab;
    this.forceUpdate();
  };

  _handleWindowClick: (event: MouseEvent) => void = (event: MouseEvent) => {
    if (
      this.state.isSortDropdownOpen &&
      this._dropdownRef != null &&
      event.target instanceof Node && // Type refinement for Flow
      !this._dropdownRef.contains(event.target)
    ) {
      this.setState({ isSortDropdownOpen: false });
    }
  };

  _getSortedTabs: (tabs: Array<browser$Tab>, sorter: Sorter) => Array<browser$Tab> = memoize(
    (tabs: Array<browser$Tab>, sorter: Sorter) => {
      return (tabs.slice(): any).sort(sorter.sort);
    }
  );

  _toggleSortDropdown: () => void = () => {
    this.setState({ isSortDropdownOpen: !this.state.isSortDropdownOpen });
  };

  render(): React.Node {
    return (
      <div className="tab-pane active">
        <div className="d-flex align-items-center justify-content-between border-bottom pb-2">
          <div style={{ paddingLeft: "0.55rem", paddingRight: "0.55rem" }}>
            <abbr title={browser.i18n.getMessage("tabLock_lockLabel")}>
              <i className="fas fa-lock" />
            </abbr>
          </div>
          <div
            className="dropdown"
            ref={(dropdown) => {
              this._dropdownRef = dropdown;
            }}
          >
            <button
              aria-haspopup="true"
              className="btn btn-outline-dark btn-sm"
              id="sort-dropdown"
              onClick={this._toggleSortDropdown}
              title={browser.i18n.getMessage("corral_currentSort", this.state.sorter.label)}
            >
              <span>{browser.i18n.getMessage("corral_sortBy")}</span>
              <span> {this.state.sorter.shortLabel}</span> <i className="fas fa-caret-down" />
            </button>
            <div
              aria-labelledby="sort-dropdown"
              className={cx("dropdown-menu dropdown-menu-right shadow-sm", {
                show: this.state.isSortDropdownOpen,
              })}
            >
              {Sorters.map((sorter) => (
                <a
                  className={cx("dropdown-item", { active: this.state.sorter === sorter })}
                  href="#"
                  key={sorter.label}
                  onClick={this._clickSorter.bind(this, sorter)}
                >
                  {sorter.label}
                </a>
              ))}
              <div className="dropdown-divider" />
              <form className="px-4 pb-1">
                <div className="form-group mb-0">
                  <div className="form-check">
                    <input
                      checked={this.state.savedSortOrder != null}
                      className="form-check-input"
                      id="lock-tab--save-sort-order"
                      onChange={this._handleChangeSaveSortOrder}
                      type="checkbox"
                    />
                    <label className="form-check-label" htmlFor="lock-tab--save-sort-order">
                      {browser.i18n.getMessage("options_option_saveSortOrder")}
                    </label>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
        <table className="table table-hover table-sm table-th-unbordered">
          <tbody>
            {this._getSortedTabs(this.state.tabs, this.state.sorter).map((tab) => (
              <OpenTabRow key={tab.id} onToggleTab={this._handleToggleTab} tab={tab} />
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}
