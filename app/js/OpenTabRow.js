/* @flow */

import * as React from "react";
import { isLocked, isManuallyLockable } from "./tab";
import LazyImage from "./LazyImage";
import browser from "webextension-polyfill";
import cx from "classnames";
import { useSelector } from "react-redux";

// Unpack TW.
const { settings, tabmanager } = browser.extension.getBackgroundPage().TW;

function secondsToMinutes(seconds) {
  let s = seconds % 60;
  s = s >= 10 ? String(s) : `0${String(s)}`;
  return `${String(Math.floor(seconds / 60))}:${s}`;
}

type Props = {
  onToggleTab: (tab: browser$Tab, selected: boolean, multiselect: boolean) => void,
  tab: browser$Tab,
};

export default function OpenTabRow(props: Props): React.Node {
  const paused = useSelector((state) => state.settings.paused);

  function handleLockedOnClick(event: SyntheticMouseEvent<HTMLInputElement>) {
    // Dynamic type check to ensure target is an input element.
    if (!(event.target instanceof HTMLInputElement)) return;
    props.onToggleTab(props.tab, event.target.checked, event.shiftKey);
  }

  const { tab } = props;
  const tabWhitelistMatch = tabmanager.getWhitelistMatch(tab.url);
  const tabIsLocked = isLocked(tab);

  let lockStatusElement;
  if (tabIsLocked) {
    let reason;
    if (tab.pinned) {
      reason = browser.i18n.getMessage("tabLock_lockedReason_pinned");
    } else if (settings.get("filterAudio") && tab.audible) {
      reason = <abbr title={browser.i18n.getMessage("tabLock_lockedReason_audible")}>Locked</abbr>;
      // $FlowFixMe missing groupId in browser.tab
    } else if (settings.get("filterGroupedTabs") && "groupId" in tab && tab.groupId > 0) {
      reason = browser.i18n.getMessage("tabLock_lockedReason_group");
    } else if (tabWhitelistMatch) {
      reason = (
        <abbr title={browser.i18n.getMessage("tabLock_lockedReason_matches", tabWhitelistMatch)}>
          Auto-Locked
        </abbr>
      );
    } else {
      reason = browser.i18n.getMessage("tabLock_lockedReason_locked");
    }

    lockStatusElement = (
      <td className="text-center muted" style={{ verticalAlign: "middle" }}>
        {reason}
      </td>
    );
  } else {
    let timeLeftContent;
    if (paused) {
      timeLeftContent = browser.i18n.getMessage("tabLock_lockedReason_paused");
    } else {
      const lastModified = tabmanager.tabTimes[tab.id];
      const cutOff = new Date().getTime() - settings.get("stayOpen");
      const timeLeft = -1 * Math.round((cutOff - lastModified) / 1000);
      // If `timeLeft` is less than 0, the countdown likely continued and is waiting for the
      // interval to clean up this tab. It's also possible the number of tabs is not below
      // `minTabs`, which has stopped the countdown and locked this at a negative `timeLeft` until
      // another tab is opened to jump start the countdown again.
      timeLeftContent = timeLeft < 0 ? "..." : secondsToMinutes(timeLeft);
    }

    lockStatusElement = (
      <td className="text-center" style={{ verticalAlign: "middle" }}>
        {timeLeftContent}
      </td>
    );
  }

  return (
    <tr className={cx({ "table-warning": tabIsLocked })}>
      <td className="text-center" style={{ verticalAlign: "middle", width: "1px" }}>
        <input
          checked={tabIsLocked}
          className="mx-1"
          disabled={!isManuallyLockable(tab)}
          onClick={handleLockedOnClick}
          type="checkbox"
          readOnly
        />
      </td>
      <td className="text-center" style={{ verticalAlign: "middle", width: "32px" }}>
        <LazyImage
          alt=""
          height={16}
          src={tab.favIconUrl}
          style={{ height: "16px", maxWidth: "none" }}
          width={16}
        />
      </td>
      <td style={{ paddingBottom: "4px", paddingTop: "4px", width: "75%" }}>
        <div className="d-flex" style={{ lineHeight: "1.3" }}>
          <div className="flex-fill text-truncate" style={{ width: "1px" }}>
            {tab.title}
            <br />
            <small className={cx({ "text-muted": !tabIsLocked })}>({tab.url})</small>
          </div>
        </div>
      </td>
      {lockStatusElement}
    </tr>
  );
}
