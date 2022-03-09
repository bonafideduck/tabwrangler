/* @flow */

import "./css/popup.scss";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "./css/fontawesome-free-solid-woff-only.css";
import "react-virtualized/styles.css";
import browser from "webextension-polyfill";
import { PersistGate } from "redux-persist/integration/react";
import Popup from "./js/Popup";
import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";
import { connect } from "react-redux";

const popupElement = document.getElementById("popup");

if (popupElement != null) {
  const ConnectedPopup = connect()(Popup);
  const TW = browser.extension.getBackgroundPage().TW;

  ReactDOM.render(
    <Provider store={TW.store}>
      <PersistGate loading={null} persistor={TW.persistor}>
        <ConnectedPopup />
      </PersistGate>
    </Provider>,
    popupElement
  );

  // The popup fires `pagehide` when the popup is going away. Make sure to unmount the component so
  // it can unsubscribe from the Store events.
  const unmountPopup = function unmountPopup() {
    ReactDOM.unmountComponentAtNode(popupElement);
    window.removeEventListener("pagehide", unmountPopup);
  };

  window.addEventListener("pagehide", unmountPopup);
}

// [1]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Errors/Dead_object
