/* @flow */

import browser from "webextension-polyfill";
const TW = browser.extension.getBackgroundPage().TW;
const { settings, tabmanager } = TW;

export function isLocked(tab: browser$Tab): boolean {
  const lockedIds = settings.get("lockedIds");
  const tabWhitelistMatch = tabmanager.getWhitelistMatch(tab.url);
  return (
    tab.pinned ||
    tabWhitelistMatch ||
    lockedIds.indexOf(tab.id) !== -1 ||
    // $FlowFixMe missing groupId in browser.tab
    !!(settings.get("filterGroupedTabs") && "groupId" in tab && tab.groupId > 0) ||
    !!(tab.audible && settings.get("filterAudio"))
  );
}

export function isManuallyLockable(tab: browser$Tab): boolean {
  const tabWhitelistMatch = tabmanager.getWhitelistMatch(tab.url);
  return (
    !tab.pinned &&
    !tabWhitelistMatch &&
    !(tab.audible && settings.get("filterAudio")) &&
    // $FlowFixMe missing groupId in browser.tab
    !(settings.get("filterGroupedTabs") && "groupId" in tab && tab.groupId > 0)
  );
}
