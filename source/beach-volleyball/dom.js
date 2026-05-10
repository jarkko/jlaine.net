(function (root) {
  'use strict';

  const $ = (selector) => document.querySelector(selector);

  const ce = (tag, attrs = {}, ...kids) => {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') el.className = value;
      else if (key === 'dataset') Object.assign(el.dataset, value);
      else if (key.startsWith('on') && typeof value === 'function') {
        el.addEventListener(key.slice(2), value);
      } else if (value !== false && value != null) {
        el.setAttribute(key, value);
      }
    }
    for (const kid of kids) {
      if (kid == null || kid === false) continue;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    }
    return el;
  };

  root.BVDom = Object.freeze({ $, ce });
})(window);
