/* @flow */

import * as React from "react";
import browser from "webextension-polyfill";

export default function AboutTab(): React.Node {
  return (
    <div className="tab-pane active">
      <p>
        <a
          href="https://chrome.google.com/webstore/detail/egnjhciaieeiiohknchakcodbpgjnchh/"
          rel="noopener noreferrer"
          target="_blank"
        >
          {browser.i18n.getMessage("extName")}
        </a>{" "}
        v{browser.runtime.getManifest().version}
      </p>
      <ul>
        <li>
          <a
            href="https://github.com/tabwrangler/tabwrangler/releases"
            rel="noopener noreferrer"
            target="_blank"
          >
            {browser.i18n.getMessage("about_changeLog")}
          </a>
        </li>
        <li>
          <a
            href="https://github.com/tabwrangler/tabwrangler/issues"
            rel="noopener noreferrer"
            target="_blank"
          >
            {browser.i18n.getMessage("about_support")}
          </a>
        </li>
        <li>
          <a
            href="https://github.com/tabwrangler/tabwrangler"
            rel="noopener noreferrer"
            target="_blank"
          >
            {browser.i18n.getMessage("about_sourceCode")}
          </a>
        </li>
      </ul>
    </div>
  );
}
