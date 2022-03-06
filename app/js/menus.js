/* @flow */

import browser from "webextension-polyfill";
import settings from "./settings";
import tabmanager from "./tabmanager";

function getDomain(url) {
  const match = url.match(/[^:]+:\/\/([^/]+)\//);
  return match == null ? null : match[1];
}

/**
 * Creates and updates context menus and page action menus.
 */
export default {
  lockActionId: null,

  pageSpecificActions: {
    lockTab(onClickData: any, selectedTab: browser$Tab) {
      if (selectedTab.id == null) return;
      tabmanager.lockTab(selectedTab.id);
    },
    lockDomain(onClickData: any, selectedTab: browser$Tab) {
      // Chrome tabs don't necessarily have URLs. In those cases there is no domain to lock.
      if (selectedTab.url == null) return;

      // If the URL doesn't match our bulletproof regexp for discovering the domain, do nothing
      // because we have no domain to lock.
      const domain = getDomain(selectedTab.url);
      if (domain == null) return;

      const whitelist: Array<string> = (settings.get("whitelist"): any);
      whitelist.push(domain);
      settings.set("whitelist", whitelist);
    },
    corralTab(onClickData: any, selectedTab: browser$Tab) {
      tabmanager.closedTabs.wrangleTabs([selectedTab]);
    },
  },

  createContextMenus() {
    const lockTab = {
      type: "checkbox",
      title: browser.i18n.getMessage("contextMenu_lockTab") || "",
      onclick: this.pageSpecificActions["lockTab"],
    };

    const lockDomain = {
      type: "checkbox",
      title: browser.i18n.getMessage("contextMenu_lockDomain") || "",
      onclick: this.pageSpecificActions["lockDomain"],
    };

    const corralTab = {
      type: "normal",
      title: browser.i18n.getMessage("contextMenu_corralTab") || "",
      onclick: this.pageSpecificActions["corralTab"],
    };

    this.lockTabId = browser.contextMenus.create(lockTab);
    this.lockDomainId = browser.contextMenus.create(lockDomain);
    browser.contextMenus.create(corralTab);
  },

  updateContextMenus(tabId: number) {
    const self = this;
    // Little bit of a kludge, would be nice to be DRY here but this was simpler.
    // Sets the title again for each page.
    browser.tabs.get(tabId, function (tab) {
      try {
        if (tab.url == null) return;
        const currentDomain = getDomain(tab.url);
        if (currentDomain == null) return;
        browser.contextMenus.update(self.lockDomainId, {
          title: browser.i18n.getMessage("contextMenu_lockSpecificDomain", currentDomain) || "",
        });
      } catch (e) {
        console.log(tab, "Error in updating menu");
        throw e;
      }
    });
    browser.contextMenus.update(this.lockTabId, { checked: tabmanager.isLocked(tabId) });
  },
};
