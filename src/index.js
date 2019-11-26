// ==UserScript==
// @name         WaniKani Vocab Note Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the Meaning Note and Reading Note sections.
// @version      1.4.2
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// @match        https://www.wanikani.com/kanji/*
// @license      MIT
// ==/UserScript==

/*
WaniKani Vocab Note Linker
==
Creates links for vocabulary in the **Meaning Note** and **Reading Note** sections.

Take a look at the screenshots and try the [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocab-note-linker-jzejl)

Example Meaning Note
==
木材（もくざい）Wood, Lumber
材木（ざいもく）Lumber, Timber, Wood

Some text

Constraints & Limitations
==
* The script only works for vocabulary at the start of each new line
* The script only works for vocabulary immediately followed by a Japanese opening parenthesis `（`
* Chrome mobile does not allow add-ons and thus does not support Tampermonkey UserScripts
* The `All` link will only work if you enable multiple popups/tabs in your browser settings

How to use UserScripts in Firefox mobile
==
1. Install Firefox on your phone
2. Open Firefox and install [Tampermonkey](https://addons.mozilla.org/en-US/android/addon/tampermonkey/)
3. Find and install scripts from [GreasyFork](https://greasyfork.org/en/scripts?utf8=%E2%9C%93&q=wanikani)

Enable multiple popups/tabs in Firefox on Android (probably iOS as well)
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
* [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocab-note-linker-jzejl)
* [GreasyFork](https://greasyfork.org/en/scripts/392752-wanikani-vocabulary-linker)
* [GitHub](https://github.com/mark-hennessy/wanikani-vocab-note-linker)

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

  const currentVocabType = isWaniKani
    ? pathInfo[pathInfo.length - 2]
    : 'vocabulary';

  const currentVocab = pathInfo[pathInfo.length - 1];

  const parseLine = vocab => {};

  const createUrl = vocab => {
    return `https://www.wanikani.com/${currentVocabType}/${vocab}`;
  };

  const createLink = (url, vocab) => {
    let style = 'margin-right: 15px;';
    if (vocab === currentVocab) {
      style += 'color: #666666;';
    }

    return `<a href="${url}" style="${style}" target="_blank" rel="noopener noreferrer">${vocab}</a>`;
  };

  const createVocabEntry = vocab => {
    const url = createUrl(vocab);
    const link = createLink(url, vocab);

    return {
      vocab,
      url,
      link,
    };
  };

  const createAllEntry = group => {
    const urls = group
      .filter(entry => entry.vocab !== currentVocab)
      // Ignore 'All' links
      .filter(entry => !!entry.url)
      .map(entry => entry.url);

    const uniqueURLs = [...new Set(urls)];

    const onclick =
      uniqueURLs
        // _blank is needed for Firefox
        .map(url => `window.open('${url}', '_blank');`)
        .join('') + 'return false;';

    const allLink = `<a href="#" onclick="${onclick}">All</a>`;

    return {
      link: allLink,
    };
  };

  const createEverythingEntry = groups => {
    return createAllEntry(groups.flatMap(group => group));
  };

  const parseGroupsFromNote = note => {
    const groups = [[]];

    const lines = note.split('<br>').map(line => line.trim());
    lines.forEach(line => {
      const group = groups[groups.length - 1];

      // Match anything followed by a Japanese opening parenthesis and assume it's kanji
      const matchResult = line.match(/^(.*)（/);

      if (!matchResult) {
        if (group.length) {
          // Start a new group
          groups.push([]);
        }

        // Continue to the next line
        return;
      }

      const vocab = matchResult[1];
      const vocabEntry = createVocabEntry(vocab);
      group.push(vocabEntry);
    });

    // There may be empty groups, that need to be filtered out,
    // if the note ended in blank lines or remarks.
    const groupsWithEntries = groups.filter(group => group.length);

    return groupsWithEntries;
  };

  const addAllLinks = groups => {
    return groups.map(group => {
      if (group.length < 2) return group;

      const allEntry = createAllEntry(group);
      return [...group, allEntry];
    });
  };

  const addEverythingLink = groups => {
    if (groups.length < 2) return groups;

    return [...groups, [createEverythingEntry(groups)]];
  };

  const generateLinkSectionContent = groups => {
    return groups
      .map(group => group.map(entry => entry.link))
      .map(group => group.join(''))
      .join('<br>');
  };

  const updateLinkSection = noteElement => {
    if (isNoteOpen(noteElement)) return;

    const noteParentElement = noteElement.parentElement;
    const note = noteElement.innerHTML;

    let groups = parseGroupsFromNote(note);
    groups = addAllLinks(groups);
    groups = addEverythingLink(groups);

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
