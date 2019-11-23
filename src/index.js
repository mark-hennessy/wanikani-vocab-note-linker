// ==UserScript==
// @name         WaniKani Vocabulary Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the "Meaning Note" and "Reading Note" sections.
// @version      1.0
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// @license      MIT
// ==/UserScript==

/*
WaniKani Vocabulary Linker
==
Creates links for vocabulary in the **Meaning Note** and **Reading Note** sections.

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

Enable multiple popups/tabs in Chrome
==
1. Click the `All` link
2. Check the URL bar for a notification icon telling you that popups were blocked
3. Click the icon and tell chrome to stop blocking popups from WaniKani

Enable multiple popups/tabs in Firefox for Android (probably iOS as well)
==
1. Type `about:config` in the URL bar
2. Search for `popups`
3. Click `dom.block_multiple_popups` to change the value to `false`

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
  const currentURL = decodeURI(window.location.href);
  const currentVocab = currentURL.split('/').pop();

  const parseGroupsFromNote = note => {
    const groups = [[]];

    const lines = note.split('<br>').map(line => line.trim());
    lines.forEach(line => {
      const currentGroup = groups[groups.length - 1];
      const matchResult = line.match(/^(.*)（/);

      if (!matchResult) {
        if (currentGroup.length) {
          groups.push([]);
        }

        return;
      }

      const vocab = matchResult[1];
      const url = `https://www.wanikani.com/vocabulary/${vocab}`;

      let style = 'margin-right: 15px;';
      if (vocab === currentVocab) {
        style += 'color: black;';
      }

      const link = `<a href="${url}" style="${style}" target="_blank" rel="noopener noreferrer">${vocab}</a>`;

      const entry = {
        vocab,
        url,
        link,
      };

      currentGroup.push(entry);
    });

    return groups;
  };

  const addAllLinkToGroups = groups => {
    groups
      .filter(g => g.length > 1)
      .forEach(g => {
        const onclick =
          g
            .filter(entry => entry.vocab !== currentVocab)
            .map(entry => entry.url)
            // _blank is needed for Firefox
            .map(url => `window.open('${url}', '_blank');`)
            .join('') + 'return false;';

        const allLink = `<a href="#" onclick="${onclick}">All</a>`;

        const entry = {
          link: allLink,
        };

        g.push(entry);
      });
  };

  const generateLinkSectionContent = groups => {
    return groups
      .map(g => g.map(entry => entry.link))
      .map(g => g.join(''))
      .join('<br>');
  };

  const updateLinkSection = noteElement => {
    const noteFirstChild = noteElement.firstChild;
    const editorIsOpen = noteFirstChild && noteFirstChild.nodeName === 'FORM';
    if (editorIsOpen) {
      return;
    }

    const noteParentElement = noteElement.parentElement;
    const note = noteElement.innerHTML;

    const groups = parseGroupsFromNote(note);

    addAllLinkToGroups(groups);

    const linkSectionClassName = 'link-section';
    const linkSectionSelector = `.${linkSectionClassName}`;
    let linkSectionElement = noteParentElement.querySelector(
      linkSectionSelector,
    );

    if (!linkSectionElement) {
      linkSectionElement = document.createElement('div');
      linkSectionElement.className = linkSectionClassName;
      linkSectionElement.style = 'margin-top: 0; margin-bottom: 0;';
      noteParentElement.appendChild(linkSectionElement);
    }

    const linkSectionContent = generateLinkSectionContent(groups);
    linkSectionElement.innerHTML = linkSectionContent;
  };

  const registerMutationObserver = noteElement => {
    const mutationCallback = () => {
      updateLinkSection(noteElement);
    };

    const observer = new MutationObserver(mutationCallback);
    observer.observe(noteElement, { childList: true, subtree: true });
  };

  const linkify = noteSelector => {
    const noteElement = document.querySelector(noteSelector);

    // Initialize the link section
    updateLinkSection(noteElement);

    // Register a change handler to keep the link section up to date
    registerMutationObserver(noteElement);
  };

  const noteSelectors = ['.note-meaning', '.note-reading'];

  noteSelectors.forEach(linkify);
})();
