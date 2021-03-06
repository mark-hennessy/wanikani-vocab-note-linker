// ==UserScript==
// @name         WaniKani Vocab Note Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the Meaning Note and Reading Note sections.
// @version      1.7.1
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// @match        https://www.wanikani.com/kanji/*
// @license      MIT
// ==/UserScript==

/*
WaniKani Vocab Note Linker
==
Creates links for vocabulary in the **Meaning Note** and **Reading Note** sections.

Also adds an update button to auto-update notes for you when updates are available.

Take a look at the screenshots and try the [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocab-note-linker-jzejl)

I created this script as a productivity boost for myself and my own kanji learning process, but I'd be delighted if others find it useful as well!

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
* The `Update note` link requires the WaniKani Open Framework UserScript to be installed
* Tampermonkey should be configured to load WaniKani Open Framework as the first UserScript, or at least before this one

Enable multiple popups/tabs in Chrome
==
1. Click the `All` link
2. Check the URL bar for a notification icon telling you that popups were blocked
3. Click the icon and tell chrome to stop blocking popups from WaniKani

Useful Links
==
* [CodeSandbox Demo!](https://codesandbox.io/s/wanikani-vocab-note-linker-jzejl)
* [GreasyFork - WaniKani Vocab Note Linker](https://greasyfork.org/en/scripts/392752-wanikani-vocab-note-linker)
* [GreasyFork - WaniKani Open Framework](https://greasyfork.org/en/scripts/38582-wanikani-open-framework)
* [GitHub](https://github.com/mark-hennessy/wanikani-vocab-note-linker)

License
==
MIT
*/

(async () => {
  // START Utilities
  const registerMutationObserver = (element, mutationCallback) => {
    const observer = new MutationObserver(mutationCallback);
    observer.observe(element, { childList: true, subtree: true });
  };

  const getOrCreateElement = ({
    tagName,
    className,
    secondaryClassNames,
    parentElement,
    attributes,
  }) => {
    const selector = `.${className}`;
    let element;
    if (parentElement) {
      element = parentElement.querySelector(selector);
    }

    if (!element) {
      element = document.createElement(tagName);
      const cn = [className, secondaryClassNames].filter((v) => v).join(' ');
      if (cn) {
        element.className = cn;
      }

      for (const attributeKey in attributes) {
        element.setAttribute(attributeKey, attributes[attributeKey]);
      }

      if (parentElement) {
        parentElement.appendChild(element);
      }
    }

    return element;
  };

  const getNewButtonText = (button, initialText, endText) => {
    const currentText = button.innerHTML;

    if (!currentText) {
      return initialText;
    }

    if (currentText === initialText) {
      return endText;
    }

    if (currentText.startsWith(endText)) {
      return currentText + '!';
    }

    return currentText;
  };

  const getSlugDBAsync = async () => {
    /* eslint-disable no-undef */
    // wkof is a global variable added by another UserScript.
    if (typeof wkof === 'undefined') {
      return [];
    }

    wkof.include('ItemData');
    await wkof.ready('ItemData');

    const config = {
      wk_items: {
        options: { subjects: true },
        filters: {
          item_type: 'kan, voc',
        },
      },
    };

    // The WaniKani API supports an updated_after param to request data
    // that changed after a certain timestamp.
    // The Wanikani Open Framework (wkof) uses this updated_after param
    // to update it's local cache efficiently.
    const items = await wkof.ItemData.get_items(config);

    const typeDB = wkof.ItemData.get_index(items, 'item_type');
    const vocabList = typeDB[currentVocabType];
    const slugDB = wkof.ItemData.get_index(vocabList, 'slug');

    return slugDB;
  };
  // END Utilities

  const isWaniKani = window.location.host === 'www.wanikani.com';

  const pathInfo = decodeURI(window.location.pathname).split('/');

  const currentVocab = isWaniKani ? pathInfo[pathInfo.length - 1] : '大変';

  const currentVocabType = isWaniKani
    ? pathInfo[pathInfo.length - 2]
    : 'vocabulary';

  const screenScrapeCurrentVocabEntry = () => {
    const primaryMeanings = document.querySelector(
      '#meaning .alternative-meaning:nth-of-type(1) p',
    );

    const secondaryMeanings = document.querySelector(
      '#meaning .alternative-meaning:nth-of-type(2) p',
    );

    const meanings = [primaryMeanings, secondaryMeanings]
      .filter((el) => !!el)
      .map((el) => el.textContent.trim())
      .filter((v) => v !== 'None')
      .join(', ');

    let readingNodeList;
    if (currentVocabType === 'vocabulary') {
      readingNodeList = document.querySelectorAll(
        '.pronunciation-group .pronunciation-variant',
      );
    } else if (currentVocabType === 'kanji') {
      readingNodeList = document.querySelectorAll(
        '#reading .span4 p[lang="ja"]',
      );
    }

    const meta = Array.from(readingNodeList)
      .map((el) => el.textContent.trim())
      .filter((v) => v !== 'None')
      .join('、');

    return {
      vocab: currentVocab,
      meta,
      meanings,
    };
  };

  const createVocabLine = (vocabEntry) => {
    return `${vocabEntry.vocab}（${vocabEntry.meta}）${vocabEntry.meanings}`;
  };

  const injectCopyButton = (parentSelector) => {
    if (currentVocabType !== 'vocabulary' && currentVocabType !== 'kanji') {
      return;
    }

    const parentElement = document.querySelector(parentSelector);
    if (!parentElement) return;

    const button = getOrCreateElement({
      tagName: 'button',
      className: 'copy-button',
      // Just use the global WaniKani button styles
      secondaryClassNames: 'btn btn-mini',
      parentElement,
      attributes: {
        type: 'button',
      },
    });

    const initialButtonText = 'Copy';
    button.innerHTML = initialButtonText;
    button.onclick = () => {
      const vocabEntry = screenScrapeCurrentVocabEntry();
      const vocabLine = createVocabLine(vocabEntry);

      navigator.clipboard.writeText(vocabLine);

      button.innerHTML = getNewButtonText(button, initialButtonText, 'Copied');
    };
  };

  const createUrl = (vocab) => {
    return `https://www.wanikani.com/${currentVocabType}/${vocab}`;
  };

  const linkStyle = 'margin-right: 15px;line-height: 1.5rem;';

  const createLink = (url, vocab) => {
    let style = linkStyle;
    if (vocab === currentVocab) {
      style += 'color: #666666;';
    }

    return `<a href="${url}" style="${style}" target="_blank" rel="noopener noreferrer">${vocab}</a>`;
  };

  const parseVocabEntry = (line, lineIndex) => {
    // Match text before a Japanese opening parenthesis and assume it's kanji
    const vocabMatchResult = line.match(/^(.*)（/);
    if (!vocabMatchResult) return null;

    const vocab = vocabMatchResult[1];

    // Math text between Japanese opening and closing parentheses and assume it's metadata
    const metaMatchResult = line.match(/^.*（(.*)）/);
    const meta = metaMatchResult ? metaMatchResult[1] : null;

    // Match text after Japanese opening and closing parentheses and assume it's a list of English meanings
    const meaningsMatchResult = line.match(/^.*（.*）(.*)/);
    const meanings = meaningsMatchResult ? meaningsMatchResult[1] : null;

    const isOnWaniKani = !/(not on WK|not in WK)/.test(meta);
    const url = isOnWaniKani ? createUrl(vocab) : null;
    const link = isOnWaniKani ? createLink(url, vocab) : null;

    return {
      vocab,
      meta,
      meanings,
      url,
      link,
      isOnWaniKani,
      lineIndex,
    };
  };

  const splitNoteIntoLines = (note) => {
    return note.split('<br>').map((line) => line.trim());
  };

  const createNoteFromLines = (lines) => {
    return lines.join('<br>');
  };

  const parseGroups = (note) => {
    const groups = [[]];

    const lines = splitNoteIntoLines(note);
    lines.forEach((line, lineIndex) => {
      const currentGroup = groups[groups.length - 1];

      const vocabEntry = parseVocabEntry(line, lineIndex);

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
    const groupsWithEntries = groups.filter((group) => group.length);

    return groupsWithEntries;
  };

  const createAllEntry = (group) => {
    const urls = group
      .filter((entry) => entry.vocab !== currentVocab)
      // Ignore 'All' and 'not on/in WK' entries
      .filter((entry) => entry.url)
      .map((entry) => entry.url);

    const uniqueURLs = [...new Set(urls)];

    const onclick =
      uniqueURLs
        // _blank is needed for Firefox
        .map((url) => `window.open('${url}', '_blank');`)
        .join('') + 'return false;';

    const allLink = `<a href="#" style="${linkStyle}" onclick="${onclick}">All</a>`;

    return {
      link: allLink,
    };
  };

  const addAllLinks = (groups) => {
    return groups.map((group) => {
      const entriesWithUrls = group.filter((entry) => entry.url);

      return entriesWithUrls.length > 1
        ? [...group, createAllEntry(group)]
        : group;
    });
  };

  const createCopyEntry = (group) => {
    // Ignore the 'All' entry
    const entriesWithVocab = group.filter((entry) => entry.vocab);

    const groupText = entriesWithVocab
      .map(createVocabLine)
      .join('\\n')
      // The onclick function is defined as one big string surrounded by double quotes,
      // and clipboard.writeText (inside of onclick) surrounds text with single quotes,
      // so both single quotes and double quotes inside of the text need to be escaped!
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');

    const onclick = `navigator.clipboard.writeText('${groupText}');return false;`;

    const hasLinks = entriesWithVocab.some((entry) => entry.link);

    const copyLink = `<a href="#" style="${linkStyle}" onclick="${onclick}">${
      hasLinks ? 'Copy' : 'Copy (not on WK)'
    }</a>`;

    return {
      link: copyLink,
    };
  };

  const addCopyLinks = (groups) => {
    return groups.map((group) => {
      const entriesWithVocab = group.filter((entry) => entry.vocab);

      // Don't add the 'Copy' entry to the group at the bottom with a single 'All' entry.
      return entriesWithVocab.length > 0
        ? [...group, createCopyEntry(group)]
        : group;
    });
  };

  const createEverythingEntry = (groups) => {
    return createAllEntry(groups.flatMap((group) => group));
  };

  const addEverythingLink = (groups) => {
    const groupsWithAtLeastOneUrl = groups.filter(
      (group) => group.filter((entry) => entry.url).length,
    );

    return groupsWithAtLeastOneUrl.length > 1
      ? [...groups, [createEverythingEntry(groups)]]
      : groups;
  };

  const generateLinkSectionContent = (groups) => {
    return groups
      .filter((group) => group.some((entry) => entry.link))
      .map((group) => group.map((entry) => entry.link))
      .map((group) => group.join(''))
      .join('<br>');
  };

  const isNoteOpen = (noteElement) => {
    const noteFirstChild = noteElement.firstChild;
    return noteFirstChild && noteFirstChild.nodeName === 'FORM';
  };

  const updateLinkSection = (noteElement) => {
    // The note, i.e. rich text editor, will never be open when this function
    // is called on initial script load, but it might be open when this function
    // is called by the DOM mutation handler.
    if (isNoteOpen(noteElement)) return;

    const parentElement = noteElement.parentElement;
    if (!parentElement) return;

    const note = noteElement.innerHTML;

    const linkSectionElement = getOrCreateElement({
      tagName: 'div',
      className: 'link-section',
      parentElement,
    });

    let groups = parseGroups(note);
    groups = addAllLinks(groups);
    groups = addCopyLinks(groups);
    groups = addEverythingLink(groups);

    const linkSectionContent = generateLinkSectionContent(groups);
    linkSectionElement.innerHTML = linkSectionContent;
  };

  const injectLinkSection = (noteSelector) => {
    if (currentVocabType !== 'vocabulary' && currentVocabType !== 'kanji') {
      return;
    }

    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) return;

    // Initialization
    updateLinkSection(noteElement);

    // Register a DOM change handler
    registerMutationObserver(noteElement, () => {
      updateLinkSection(noteElement);
    });
  };

  const generateNote = (existingNote) => {
    const lines = splitNoteIntoLines(existingNote);
    const groups = parseGroups(existingNote);

    const wkEntries = groups
      .flatMap((group) => group)
      .filter((entry) => entry.isOnWaniKani);

    wkEntries.forEach((entry) => {
      const vocabInfo = slugDB[entry.vocab];

      // If no info is available, then assume the existing line is up-to-date.
      if (!vocabInfo) return;

      const { data } = vocabInfo;
      const generatedMeta = data.readings.map((v) => v.reading).join('、');
      const generatedMeanings = data.meanings.map((v) => v.meaning).join(', ');

      const generatedLine = createVocabLine({
        vocab: entry.vocab,
        meta: entry.meta || generatedMeta,
        meanings: generatedMeanings,
      });

      const { lineIndex } = entry;
      lines[lineIndex] = generatedLine;
    });

    const generatedNote = createNoteFromLines(lines);
    return generatedNote;
  };

  const updateUpdateNoteButton = (noteElement, slugDB) => {
    const parentElement = noteElement.parentElement;
    if (!parentElement) return;

    const ignoreUpdateAttributeName = 'data-ignore-update';

    // If the ignore-update attribute is present, then assume
    // this is the update caused by opening the note to save or cancel.
    if (noteElement.hasAttribute(ignoreUpdateAttributeName)) {
      noteElement.removeAttribute(ignoreUpdateAttributeName);
      return;
    }

    const button = getOrCreateElement({
      tagName: 'button',
      className: 'update-note-button',
      // Just use the global WaniKani button styles
      secondaryClassNames: 'btn btn-mini',
      parentElement,
      attributes: {
        type: 'button',
      },
    });

    const hideButton = () => {
      // Hide the button
      button.style = 'display: none;';
    };

    if (!isNoteOpen(noteElement)) {
      const existingNote = noteElement.innerHTML;
      const generatedNote = generateNote(existingNote);

      if (existingNote !== generatedNote) {
        // Reset the button
        const initialButtonText = 'Update note';
        button.innerHTML = initialButtonText;
        button.style = '';
        button.onclick = async () => {
          noteElement.setAttribute(ignoreUpdateAttributeName, '');
          noteElement.innerHTML = generatedNote;

          button.innerHTML = getNewButtonText(
            button,
            initialButtonText,
            'Manually open note and click save',
          );
        };
      } else {
        // Hide the button because there is nothing to update
        hideButton();
      }
    } else {
      // Hide the button because the note is open
      hideButton();
    }
  };

  const injectUpdateNoteButton = (noteSelector, slugDB) => {
    if (currentVocabType !== 'vocabulary' && currentVocabType !== 'kanji') {
      return;
    }

    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) return;

    // Initialization
    updateUpdateNoteButton(noteElement, slugDB);

    // Register a DOM change handler
    registerMutationObserver(noteElement, () => {
      updateUpdateNoteButton(noteElement, slugDB);
    });
  };

  injectCopyButton('.row header');

  const noteSelectors = ['.note-meaning', '.note-reading'];
  noteSelectors.forEach(injectLinkSection);

  const slugDB = await getSlugDBAsync();
  noteSelectors.forEach((noteSelector) =>
    injectUpdateNoteButton(noteSelector, slugDB),
  );
})();
