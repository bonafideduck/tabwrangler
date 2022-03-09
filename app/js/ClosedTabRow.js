/* @flow */

import "./CoralTabRow.css";
import * as React from "react";
import LazyImage from "./LazyImage";
import TimeAgo from "timeago-react";
// import { browser } from "webextension-polyfill";
import cx from "classnames";
import extractHostname from "./extractHostname";
import { register } from "timeago.js";
import timeagoLocale from "./timeagoLocale";

const uiLanguage = browser.i18n.getUILanguage();
register(uiLanguage, timeagoLocale[uiLanguage]);

type Props = {
  isSelected: boolean,
  onOpenTab: (tab: browser$Tab, session: ?browser$Session) => void,
  onRemoveTab: (tab: browser$Tab) => void,
  onToggleTab: (tab: browser$Tab, selected: boolean, multiselect: boolean) => void,
  session: ?browser$Session,
  tab: browser$Tab,
  style: Object,
};

export default function ClosedTabRow(props: Props): React.Node {
  const { isSelected, session, style, tab } = props;

  function _handleClickAnchor(event: SyntheticMouseEvent<HTMLElement>) {
    event.preventDefault();
    props.onOpenTab(tab, props.session);
  }

  function _handleClickCheckbox(event: SyntheticMouseEvent<HTMLInputElement>) {
    // Dynamic type check to ensure target is an input element.
    if (!(event.target instanceof HTMLInputElement)) return;
    props.onToggleTab(props.tab, event.target.checked, event.shiftKey);
  }

  function _handleClickRemove() {
    props.onRemoveTab(props.tab);
  }

  function _handleClickTd(event: SyntheticMouseEvent<HTMLElement>) {
    if (event.currentTarget.nodeName === "input") return;
    props.onToggleTab(props.tab, !props.isSelected, event.shiftKey);
  }

  return (
    <div
      aria-label="row"
      className={cx("ReactVirtualized__Table__row", { "table-warning": isSelected })}
      role="row"
      style={style}
    >
      <div
        className="ReactVirtualized__Table__rowColumn"
        onClick={_handleClickTd}
        style={{ verticalAlign: "middle" }}
      >
        <input
          checked={isSelected}
          className="checkbox--td"
          onClick={_handleClickCheckbox}
          type="checkbox"
          readOnly
        />
      </div>
      <div
        className="faviconCol ReactVirtualized__Table__rowColumn"
        style={{ verticalAlign: "middle" }}
      >
        <LazyImage
          alt=""
          className="faviconCol--hover-hidden favicon"
          height={16}
          src={tab.favIconUrl}
          width={16}
        />
        <span
          className="faviconCol--hover-shown"
          onClick={_handleClickRemove}
          role="button"
          style={{ cursor: "pointer", height: 16, width: 16 }}
          tabIndex={0}
          title="Remove this tab"
        >
          <i className="fas fa-trash-alt" />
        </span>
      </div>
      <div className="ReactVirtualized__Table__rowColumn py-1" style={{ flex: 1 }}>
        <div style={{ display: "flex" }}>
          <div className="CorralTabRow-content">
            <a
              href={tab.url}
              onClick={_handleClickAnchor}
              rel="noopener noreferrer"
              style={{ flex: 1 }}
              target="_blank"
              title={tab.url}
            >
              {tab.title}
            </a>
            <br />
            <small className={cx({ "text-muted": !isSelected })}>
              ({tab.url == null ? "???" : extractHostname(tab.url)})
            </small>
          </div>
        </div>
      </div>
      <div
        className="ReactVirtualized__Table__rowColumn text-right"
        style={{ verticalAlign: "middle" }}
        title={
          /* $FlowFixMe: `closedAt` is an expando property added by Tab Wrangler to browser$Tab */
          new Date(tab.closedAt).toLocaleString()
        }
      >
        {/* $FlowFixMe: `closedAt` is an expando property added by Tab Wrangler to browser$Tab */}
        <TimeAgo datetime={tab.closedAt} locale={uiLanguage} />
      </div>
      <div className="ReactVirtualized__Table__rowColumn" style={{ width: "11px" }}>
        {session == null ? null : (
          <abbr title={browser.i18n.getMessage("corral_tabSessionFresh")}>
            <i className="fas fa-leaf text-success" />
          </abbr>
        )}
      </div>
    </div>
  );
}
