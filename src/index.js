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
* [GreasyFork](https://greasyfork.org/en/scripts/392752-wanikani-vocab-note-linker)
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
    tagName,
    className,
    secondaryClassNames,
    parentElement,
    attributes,
  }) => {
    const selector = `.${className}`;
    let element = parentElement.querySelector(selector);

    if (!element) {
      element = document.createElement(tagName);
      element.className = `${className} ${secondaryClassNames}`;

      for (const attributeKey in attributes) {
        element.setAttribute(attributeKey, attributes[attributeKey]);
      }

      parentElement.appendChild(element);
    }

    return element;
  };
  // END Utilities

  const isWaniKani = window.location.host === 'www.wanikani.com';
  const pathInfo = decodeURI(window.location.pathname).split('/');

  const currentVocab = isWaniKani ? pathInfo[pathInfo.length - 1] : '大変';

  const currentVocabType = isWaniKani
    ? pathInfo[pathInfo.length - 2]
    : 'vocabulary';

  const screenScrapeCurrentVocabEntry = () => {
    const headerElement = document.querySelector('header h1');
    const primaryMeaning = headerElement.lastChild.textContent.trim();

    const alternativeMeaningsElement = document.querySelector(
      '.alternative-meaning',
    );

    const alternativeMeanings =
      alternativeMeaningsElement.children[1].innerHTML;

    const meanings = [primaryMeaning, alternativeMeanings].join(', ');

    const readingElements = Array.from(
      document.querySelectorAll('.pronunciation-group .pronunciation-variant'),
    );

    const meta = readingElements.map(el => el.innerHTML).join('、');

    return {
      vocab: currentVocab,
      meta,
      meanings,
    };
  };

  const createVocabLine = vocabEntry => {
    return `${vocabEntry.vocab}（${vocabEntry.meta}）${vocabEntry.meanings}`;
  };

  const injectCopyButton = informationSelector => {
    if (currentVocabType !== 'vocabulary') return;

    const informationElement = document.querySelector(informationSelector);

    const button = getOrCreateElement({
      tagName: 'button',
      className: 'copy-button',
      // Just use the global WaniKani button styles
      secondaryClassNames: 'btn btn-mini',
      parentElement: informationElement,
      attributes: {
        type: 'button',
        // style:
        //   'width: 3rem; height: 1.5rem; background: #fafafa; border: 2px solid rgba(0,0,0,0.1); cursor: pointer;',
      },
    });

    const initialButtonText = 'Copy';
    button.innerHTML = initialButtonText;
    button.onclick = () => {
      const vocabEntry = screenScrapeCurrentVocabEntry();
      const vocabLine = createVocabLine(vocabEntry);
      // console.log(vocabLine);
      navigator.clipboard.writeText(vocabLine);

      button.innerHTML =
        button.innerHTML === initialButtonText ? 'Copied' : initialButtonText;
    };
  };

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

  const parseVocabEntry = line => {
    // Match text before a Japanese opening parenthesis and assume it's kanji
    const vocabMatchResult = line.match(/^(.*)（/);

    if (!vocabMatchResult) return null;

    // Math text between Japanese opening and closing parentheses and assume it's metadata
    const metaMatchResult = line.match(/^.*（(.*)）/);

    // Match text after Japanese opening and closing parentheses and assume it's a list of English meanings
    const meaningsMatchResult = line.match(/^.*（.*）(.*)/);

    const vocab = vocabMatchResult[1];
    const meta = metaMatchResult ? metaMatchResult[1] : null;
    const meanings = meaningsMatchResult ? meaningsMatchResult[1] : null;
    const url = createUrl(vocab);
    const link = createLink(url, vocab);

    return {
      vocab,
      meta,
      meanings,
      url,
      link,
    };
  };

  const parseGroups = note => {
    const groups = [[]];

    const lines = note.split('<br>').map(line => line.trim());
    lines.forEach(line => {
      const currentGroup = groups[groups.length - 1];

      const vocabEntry = parseVocabEntry(line);

      if (!vocabEntry) {
        if (currentGroup.length) {
          // Start a new group
          groups.push([]);
        }

        // Continue to the next line
        return;
      }

      currentGroup.push(vocabEntry);
    });

    // There may be empty groups, that need to be filtered out,
    // if the note ended in blank lines or remarks.
    const groupsWithEntries = groups.filter(group => group.length);

    return groupsWithEntries;
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

  const addAllLinks = groups => {
    return groups.map(group => {
      if (group.length < 2) return group;

      const allEntry = createAllEntry(group);
      return [...group, allEntry];
    });
  };

  const createEverythingEntry = groups => {
    return createAllEntry(groups.flatMap(group => group));
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

    let groups = parseGroups(note);
    groups = addAllLinks(groups);
    groups = addEverythingLink(groups);

    let linkSectionElement = getOrCreateElement({
      tagName: 'div',
      className: 'link-section',
      parentElement: noteParentElement,
    });

    const linkSectionContent = generateLinkSectionContent(groups);
    linkSectionElement.innerHTML = linkSectionContent;
  };

  const injectLinks = noteSelector => {
    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) return;

    // Initialize the link section
    updateLinkSection(noteElement);

    // Register a change handler to keep the link section up to date
    registerMutationObserver(noteElement, () => {
      updateLinkSection(noteElement);
    });
  };

  const informationSelector = '#information';
  injectCopyButton(informationSelector);

  const noteSelectors = ['.note-meaning', '.note-reading'];
  noteSelectors.forEach(injectLinks);
})();
