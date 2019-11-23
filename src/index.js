// ==UserScript==
// @name         WaniKani Vocabulary Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the Meaning Note and Reading Note sections.
// @version      1.2.0
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// @match        https://www.wanikani.com/kanji/*
// @license      MIT
// ==/UserScript==

/*
WaniKani Vocabulary Linker
==
Creates links for vocabulary in the **Meaning Note** and **Reading Note** sections.

Take a look at the screenshots and try the [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocabulary-linker-jzejl)

Example Meaning Note
==
木材（もくざい）Wood, Lumber 木材
材木（ざいもく）Lumber, Timber, Wood
Some text

Constraints & Limitations
==
* The script only works for vocabulary at the start of each new line
* The script only works for vocabulary immediately followed by a Japanese opening parenthesis `（`
* Chrome for mobile does not allow add-ons and thus does not support Tampermonkey UserScripts
* The `All` link will only work if you enable multiple popups/tabs in your browser settings

How to use UserScripts on Firefox for mobile
==
1. Install Firefox for mobile
2. Open Firefox and install [Tampermonkey](https://addons.mozilla.org/en-US/android/addon/tampermonkey/)
3. Find and install scripts from [GreasyFork](https://greasyfork.org/en/scripts?utf8=%E2%9C%93&q=wanikani)

Enable multiple popups/tabs in Firefox for Android (probably iOS as well)
==
1. Type `about:config` in the URL bar
2. Search for `popups`
3. Click `dom.block_multiple_popups` to change the value to `false`

Enable multiple popups/tabs in Chrome
==
1. Click the `All` link
2. Check the URL bar for a notification icon telling you that popups were blocked
3. Click the icon and tell chrome to stop blocking popups from WaniKani

Useful Links
==
* [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocabulary-linker-jzejl)
* [GreasyFork](https://greasyfork.org/en/scripts/392752-wanikani-vocabulary-linker)
* [GitHub](https://github.com/mark-hennessy/wanikani-vocabulary-linker)

License
==
MIT
*/

(function() {
  // START Utilities
  const registerMutationObserver = (element, mutationCallback) => {
    const observer = new MutationObserver(mutationCallback);
    observer.observe(element, { childList: true, subtree: true });
  };

  const isNoteOpen = noteElement => {
    const noteFirstChild = noteElement.firstChild;
    return noteFirstChild && noteFirstChild.nodeName === 'FORM';
  };

  const getOrCreateElement = ({
    tagName = 'div',
    className,
    style,
    parentElement,
  }) => {
    const selector = `.${className}`;
    let element = parentElement.querySelector(selector);

    if (!element) {
      element = document.createElement(tagName);
      element.className = className;
      element.style = style;
      parentElement.appendChild(element);
    }

    return element;
  };
  // END Utilities

  const isWaniKani = window.location.host === 'www.wanikani.com';
  const pathInfo = decodeURI(window.location.pathname).split('/');

  const currentItemType = isWaniKani
    ? pathInfo[pathInfo.length - 2]
    : 'vocabulary';

  const currentItem = pathInfo[pathInfo.length - 1];

  const createItemEntry = item => {
    const url = `https://www.wanikani.com/${currentItemType}/${item}`;

    let style = 'margin-right: 15px;';
    if (item === currentItem) {
      style += 'color: black;';
    }

    const link = `<a href="${url}" style="${style}" target="_blank" rel="noopener noreferrer">${item}</a>`;

    return {
      item,
      url,
      link,
    };
  };

  const createAllEntry = group => {
    const onclick =
      group
        .filter(entry => entry.item !== currentItem)
        .map(entry => entry.url)
        // _blank is needed for Firefox
        .map(url => `window.open('${url}', '_blank');`)
        .join('') + 'return false;';

    const allLink = `<a href="#" onclick="${onclick}">All</a>`;

    return {
      link: allLink,
    };
  };

  const addAllLinkIfNeeded = group => {
    if (group.length > 1) {
      const allEntry = createAllEntry(group);
      group.push(allEntry);
    }
  };

  const parseGroupsFromNote = note => {
    const groups = [[]];

    const lines = note.split('<br>').map(line => line.trim());
    lines.forEach((line, lineIndex) => {
      const isLastLine = lineIndex === lines.length - 1;
      const currentGroup = groups[groups.length - 1];

      // Match anything followed by a Japanese opening parenthesis and assume it's kanji
      const matchResult = line.match(/^(.*)（/);

      if (!matchResult) {
        addAllLinkIfNeeded(currentGroup);

        if (currentGroup.length && !isLastLine) {
          // Start a new group
          groups.push([]);
        }

        // Continue to the next line
        return;
      }

      const item = matchResult[1];
      const itemEntry = createItemEntry(item);
      currentGroup.push(itemEntry);

      if (isLastLine) {
        addAllLinkIfNeeded(currentGroup);
      }
    });

    return groups;
  };

  const generateLinkSectionContent = groups => {
    return groups
      .map(g => g.map(entry => entry.link))
      .map(g => g.join(''))
      .join('<br>');
  };

  const updateLinkSection = noteElement => {
    if (isNoteOpen(noteElement)) return;

    const noteParentElement = noteElement.parentElement;
    const note = noteElement.innerHTML;

    const groups = parseGroupsFromNote(note);

    let linkSectionElement = getOrCreateElement({
      className: 'link-section',
      parentElement: noteParentElement,
    });

    const linkSectionContent = generateLinkSectionContent(groups);
    linkSectionElement.innerHTML = linkSectionContent;
  };

  const linkify = noteSelector => {
    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) return;

    // Initialize the link section
    updateLinkSection(noteElement);

    // Register a change handler to keep the link section up to date
    registerMutationObserver(noteElement, () => {
      updateLinkSection(noteElement);
    });
  };

  const noteSelectors = ['.note-meaning', '.note-reading'];

  noteSelectors.forEach(linkify);
})();
