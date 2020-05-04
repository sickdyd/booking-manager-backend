"use strict";

function hasOnlyProperty(object, property) {
  if ((Object.keys(object).length <= 1) && (object[property])) {
    return true;
  }
  return false;
}

module.exports = hasOnlyProperty;