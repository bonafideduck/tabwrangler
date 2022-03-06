/* @flow */

import TabManager from "../tabmanager";
import configureMockStore from "../__mocks__/configureMockStore";

// An optional subset of the `chrome$Tab` type in order to allow overrides of values. This type is
// merged into a fully-formed `chrome$Tab` to create mocks for tests.
type MockTab = {
  title?: string,
  url?: string,
};

const getBackgroundPageSave = global.browser.extension.getBackgroundPage;

function createTab(overrides: MockTab): chrome$Tab {
  return {
    active: false,
    highlighted: false,
    id: 1,
    index: 1,
    incognito: false,
    pinned: false,
    selected: false,
    title: "",
    url: "https://github.com/tabwrangler/tabwrangler",
    windowId: 1,
    ...overrides,
  };
}

beforeEach(() => {
  const TW = (global.TW = {
    settings: {},
    store: configureMockStore(),
  });

  global.browser.extension.getBackgroundPage = () => {
    return {
      TW,
    };
  };
});

afterEach(() => {
  global.browser.extension.getBackgroundPage = getBackgroundPageSave;
});

describe("wrangleTabs", () => {
  test("should wrangle new tabs", () => {
    global.TW.settings.get = jest.fn(() => 5); //maxTabs
    global.browser.tabs.remove = jest.fn();

    const testTabs = [{ id: 2 }, { id: 3 }, { id: 4 }];
    TabManager.closedTabs.wrangleTabs(testTabs);

    expect(global.browser.tabs.remove.mock.calls.length).toBe(3);
    expect(global.browser.tabs.remove.mock.calls).toEqual([[2], [3], [4]]);

    const setSavedTabsAction = global.TW.store
      .getActions()
      .find((action) => action.type === "SET_SAVED_TABS");
    expect(setSavedTabsAction).toBeDefined();
    expect(setSavedTabsAction.savedTabs.map((tab) => tab.id)).toEqual([4, 3, 2]);
  });

  test("should wrangle max tabs", () => {
    global.TW.settings.get = jest.fn(() => 3);
    global.browser.tabs.remove = jest.fn();

    const testTabs = [{ id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }];
    global.browser.storage.local.set = jest.fn();

    global.browser.browserAction.setBadgeText = jest.fn();
    TabManager.closedTabs.wrangleTabs(testTabs);

    expect(global.browser.tabs.remove.mock.calls.length).toBe(4);
    expect(global.browser.tabs.remove.mock.calls).toEqual([[2], [3], [4], [5]]);
    expect(global.TW.store.getActions()).toContainEqual({
      totalTabsWrangled: 4,
      type: "SET_TOTAL_TABS_WRANGLED",
    });
  });

  test("replaces duplicate tab in the corral if exact URL matches", () => {
    global.TW.settings.get = jest
      .fn()
      .mockImplementationOnce(() => 100)
      .mockImplementationOnce(() => "exactURLMatch");
    global.browser.tabs.remove = jest.fn();
    global.TW.store = configureMockStore({
      localStorage: {
        savedTabs: [
          { id: 1, url: "https://www.github.com" },
          { id: 2, url: "https://www.google.com" },
          { id: 3, url: "https://www.nytimes.com" },
        ],
      },
    });

    global.browser.storage.local.set = jest.fn();
    global.browser.browserAction.setBadgeText = jest.fn();

    // reset all mocks
    jest.clearAllMocks();

    const testTabs = [{ id: 4, url: "https://www.nytimes.com" }];

    TabManager.closedTabs.wrangleTabs(testTabs);

    expect(global.browser.tabs.remove.mock.calls.length).toBe(1);
    expect(global.browser.tabs.remove.mock.calls).toEqual([[4]]);
    expect(global.TW.store.getActions()).toContainEqual({
      totalTabsWrangled: 1,
      type: "SET_TOTAL_TABS_WRANGLED",
    });

    // TODO: Test for tabs
  });

  test("replaces duplicate tab in the corral if hostname and title match", () => {
    global.TW.settings.get = jest
      .fn()
      .mockImplementationOnce(() => 100)
      .mockImplementationOnce(() => "hostnameAndTitleMatch");
    global.browser.tabs.remove = jest.fn();
    global.TW.store = configureMockStore({
      localStorage: {
        savedTabs: [
          { id: 1, url: "https://www.github.com", title: "Github" },
          { id: 2, url: "https://www.google.com", title: "Google" },
          { id: 3, url: "https://www.nytimes.com", title: "New York Times" },
        ],
      },
    });

    global.browser.storage.local.set = jest.fn();
    global.browser.browserAction.setBadgeText = jest.fn();

    // reset all mocks
    jest.clearAllMocks();

    const testTabs = [{ id: 4, url: "https://www.nytimes.com", title: "New York Times" }];

    TabManager.closedTabs.wrangleTabs(testTabs);

    expect(global.browser.tabs.remove.mock.calls.length).toBe(1);
    expect(global.browser.tabs.remove.mock.calls).toEqual([[4]]);
    expect(global.TW.store.getActions()).toContainEqual({
      totalTabsWrangled: 1,
      type: "SET_TOTAL_TABS_WRANGLED",
    });

    // TODO: Test for tabs
  });
});

describe("filter", () => {
  beforeEach(() => {
    global.TW.store = configureMockStore({
      localStorage: {
        savedTabs: [
          { id: 1, url: "https://www.github.com", title: "GitHub" },
          { id: 2, url: "https://www.google.com", title: "Google" },
          {
            id: 3,
            url: "https://www.nytimes.com",
            title: "The New York Times - Breaking News, World News & Multimedia",
          },
        ],
      },
    });
  });

  test("should return index of tab if the url matches", () => {
    expect(TabManager.closedTabs.findPositionByURL("https://www.nytimes.com")).toBe(2);
  });

  test("should return -1 if the url does not match any tab", () => {
    expect(TabManager.closedTabs.findPositionByURL("https://www.mozilla.org")).toBe(-1);
  });

  test("should return -1 if the url is undefined", () => {
    expect(TabManager.closedTabs.findPositionByURL()).toBe(-1);
  });

  test("should return -1 if the url is null", () => {
    expect(TabManager.closedTabs.findPositionByURL(null)).toBe(-1);
  });

  test("should return index of tab if the url matches", () => {
    expect(
      TabManager.closedTabs.findPositionByHostnameAndTitle(
        "https://www.nytimes.com",
        "The New York Times - Breaking News, World News & Multimedia"
      )
    ).toBe(2);
  });

  test("should return -1 of tab if no title provided", () => {
    expect(TabManager.closedTabs.findPositionByHostnameAndTitle("https://www.nytimes.com")).toBe(
      -1
    );
  });
});

describe("getURLPositionFilterByWrangleOption", () => {
  test("should return function that always returns -1", () => {
    const filterFunction = TabManager.closedTabs.getURLPositionFilterByWrangleOption(
      "withDuplicates"
    );

    expect(filterFunction).not.toBeNull();
    expect(filterFunction(createTab({ url: "http://www.test.com" }))).toBe(-1);
  });

  test("should return function that will return the tab position by exact URL match", () => {
    const filterFunction = TabManager.closedTabs.getURLPositionFilterByWrangleOption(
      "exactURLMatch"
    );

    expect(filterFunction).not.toBeNull();
    expect(filterFunction(createTab({ url: "http://www.test.com" }))).toBe(-1);
  });

  test("should return function that will return the tab position by hostname and title", () => {
    const filterFunction = TabManager.closedTabs.getURLPositionFilterByWrangleOption(
      "hostnameAndTitleMatch"
    );

    expect(filterFunction).not.toBeNull();
    expect(filterFunction(createTab({ url: "http://www.test.com", title: "test" }))).toBe(-1);
  });
});
