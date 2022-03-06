/* @flow */

import * as React from "react";
//import { browser } from "webextension-polyfill";

interface Props {
  onChange: (event: SyntheticInputEvent<HTMLInputElement>) => void;
  selectedOption: string;
}

export default function TabWrangleOption(props: Props): React.Node {
  // Declare this dynamically so it is available inside tests. It's not simple to modify globals,
  // like `browser`, using Jest. Is there a better way to do this? Probably.
  const OPTIONS = [
    { name: "withDupes", text: browser.i18n.getMessage("options_dedupe_option_withDupes") },
    {
      name: "exactURLMatch",
      text: browser.i18n.getMessage("options_dedupe_option_exactURLMatch"),
    },
    {
      name: "hostnameAndTitleMatch",
      text: browser.i18n.getMessage("options_dedupe_option_hostnameAndTitleMatch"),
    },
  ];

  return (
    <>
      <label htmlFor="wrangleOption">
        <strong>{browser.i18n.getMessage("options_dedupe_label")}</strong>
      </label>
      {OPTIONS.map((option) => (
        <div className="form-check" key={option.name}>
          <input
            checked={props.selectedOption === option.name}
            className="form-check-input"
            id={option.name}
            name="wrangleOption"
            onChange={props.onChange}
            type="radio"
            value={option.name}
          />
          <label className="form-check-label" htmlFor={option.name}>
            {option.text}
          </label>
        </div>
      ))}
      <div className="row">
        <div className="col-8 form-text text-muted" style={{ marginBottom: 0 }}>
          <dl style={{ marginBottom: 0 }}>
            <dt>{browser.i18n.getMessage("options_dedupe_option_withDupes_label")}</dt>
            <dd>{browser.i18n.getMessage("options_dedupe_option_withDupes_description")}</dd>
            <dt style={{ marginTop: "10px" }}>
              {browser.i18n.getMessage("options_dedupe_option_exactURLMatch_label")}
            </dt>
            <dd>{browser.i18n.getMessage("options_dedupe_option_exactURLMatch_description")}</dd>
            <dt style={{ marginTop: "10px" }}>
              {browser.i18n.getMessage("options_dedupe_option_hostnameAndTitleMatch_label")}
            </dt>
            <dd>
              {browser.i18n.getMessage("options_dedupe_option_hostnameAndTitleMatch_description")}
            </dd>
          </dl>
        </div>
      </div>
    </>
  );
}
