import Settings from "../settings";
import configureMockStore from "../__mocks__/configureMockStore";

beforeEach(() => {
  const TW = (global.TW = {
    settings: Settings,
    store: configureMockStore(),
  });

  global.browser.extension.getBackgroundPage = () => {
    return {
      TW,
    };
  };

  Settings.init();
});

afterEach(() => {
  global.browser.storage.sync.set.mock.calls.length = 0;
  global.browser.storage.sync.get.mock.calls.length = 0;
});

test("should set maxTabs to 1000", () => {
  Settings.setmaxTabs(1000);
  expect(Settings.get("maxTabs")).toBe(1000);
  expect(global.browser.storage.sync.get.mock.calls.length).toBe(1);
});

test("should set maxTabs to 1", () => {
  Settings.setmaxTabs(1);
  expect(Settings.get("maxTabs")).toBe(1);
  expect(global.browser.storage.sync.set.mock.calls.length).toBe(1);
});

test("should throw an exception when maxTabs is < 1", () => {
  expect(() => Settings.setmaxTabs(0)).toThrowError();
});

test("should throw an exception when maxTabs is > 1000", () => {
  expect(() => Settings.setmaxTabs(1100)).toThrowError();
});
