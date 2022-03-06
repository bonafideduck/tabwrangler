/* @flow */

let sessionFuzzyMatchesTab;
const getBackgroundPageSave = global.browser.extension.getBackgroundPage;

beforeAll(() => {
  global.browser.extension.getBackgroundPage = () => {
    return { TW: { store: {} } };
  };

  // Dynamic import so globals can be defined beforehand. Importing 'CorralTab.js' calls
  // `chrome.i18n.getUILanguage` and `chrome.i18n.getMessage`.
  sessionFuzzyMatchesTab = require("../CorralTab.js").sessionFuzzyMatchesTab;
});

afterAll(() => {
  global.browser.extension.getBackgroundPage = getBackgroundPageSave;
});

describe("sessionFuzzyMatchesTab", () => {
  const tab = {
    active: false,
    closedAt: 1524301399048, // non-standard expando property added by Tab Wrangler
    favIconUrl: "https://news.ycombinator.com/favicon.ico",
    highlighted: false,
    incognito: false,
    index: 5,
    pinned: false,
    selected: false,
    sessionId: "20",
    title: "Hacker News",
    url: "https://news.ycombinator.com/",
    windowId: 3,
  };

  test("matches a Chrome session with a standard tab", () => {
    const session = {
      lastModified: 1524301398548, // 500ms different than `closedAt`, within 1s "fuzzy" range
      tab,
    };
    // $FlowFixMe TW tabs have non-standard `closedAt`
    expect(sessionFuzzyMatchesTab(session, tab)).toBe(true);
  });

  test("matches a Firefox session with a standard tab", () => {
    const session = {
      lastModified: 1524301399,
      tab,
    };
    // $FlowFixMe TW tabs have non-standard `closedAt`
    expect(sessionFuzzyMatchesTab(session, tab)).toBe(true);
  });
});
