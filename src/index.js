// ==UserScript==
// @name         WaniKani Vocab Note Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the Meaning Note and Reading Note sections.
// @version      1.8.4
// @author       Mark Hennessy
// @match        https://www.wanikani.com/kanji/*
// @match        https://www.wanikani.com/vocabulary/*
// @license      MIT
// ==/UserScript==

/*
WaniKani Vocab Note Linker
==
Creates links for vocabulary referenced in the **Meaning Note** and **Reading Note**
sections.

Also adds an update button to auto-update notes when updates are available. The
updates are not saved until you open the note and click the `Save` button.
Clicking `Cancel` or refreshing the page will undo the changes.

I created this script as a productivity tool for myself and my own kanji learning process.

Example Meaning Note
==
木材（もくざい）Wood, Lumber<br>
材木（ざいもく）Lumber, Timber, Wood

Some text

Constraints & Limitations
==
* The script only works for vocabulary at the start of each new line
* The script only works for vocabulary immediately followed by a Japanese opening parenthesis `（`
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
* [GreasyFork - WaniKani Vocab Note Linker](https://greasyfork.org/en/scripts/392752-wanikani-vocab-note-linker)
* [GreasyFork - WaniKani Open Framework](https://greasyfork.org/en/scripts/38582-wanikani-open-framework)
* [GitHub](https://github.com/mark-hennessy/wanikani-vocab-note-linker)

License
==
MIT
*/

(async function () {
  // START Utilities
  function registerMutationObserver(element, mutationCallback) {
    const observer = new MutationObserver(mutationCallback);
    observer.observe(element, { childList: true, subtree: true });
  }

  function getOrCreateElement({
    tagName,
    className,
    secondaryClassNames,
    parentElement,
    attributes,
  }) {
    const selector = `.${className}`;
    let element;
    if (parentElement) {
      element = parentElement.querySelector(selector);
    }

    if (!element) {
      element = document.createElement(tagName);
      const cn = [className, secondaryClassNames].filter(Boolean).join(' ');
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
  }

  function getNewButtonText(button, initialText, endText) {
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
  }

  async function getSlugDB() {
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

    const subjectTypeDB = wkof.ItemData.get_index(items, 'item_type');
    const subjects = subjectTypeDB[currentSubjectType];
    const slugDB = wkof.ItemData.get_index(subjects, 'slug');

    return slugDB;
  }
  // END Utilities

  const waniKani = window.location.host === 'www.wanikani.com';

  const pathParts = decodeURI(window.location.pathname).split('/');

  const currentSubjectType = waniKani ? pathParts[0] : 'vocabulary';

  const currentSlug = waniKani ? pathParts[1] : '大変';

  function screenScrapeCurrentEntry() {
    const primaryMeanings = document.querySelector(
      '#meaning .alternative-meaning:nth-of-type(1) p',
    );

    const secondaryMeanings = document.querySelector(
      '#meaning .alternative-meaning:nth-of-type(2) p',
    );

    const meanings = [primaryMeanings, secondaryMeanings]
      .filter(Boolean)
      .map((el) => el.textContent.trim())
      .filter((v) => v !== 'None')
      .join(', ');

    let readingNodeList;
    if (currentSubjectType === 'vocabulary') {
      readingNodeList = document.querySelectorAll(
        '.pronunciation-group .pronunciation-variant',
      );
    } else if (currentSubjectType === 'kanji') {
      readingNodeList = document.querySelectorAll(
        '#reading .span4 p[lang="ja"]',
      );
    }

    const metadata = Array.from(readingNodeList)
      .map((el) => el.textContent.trim())
      .filter((v) => v !== 'None')
      .join('、');

    return {
      slug: currentSlug,
      metadata,
      meanings,
    };
  }

  function createEntryLine(entry) {
    return `${entry.slug}（${entry.metadata}）${entry.meanings}`;
  }

  function injectCopyButton(parentSelector) {
    if (currentSubjectType !== 'vocabulary' && currentSubjectType !== 'kanji') {
      return;
    }

    const parentElement = document.querySelector(parentSelector);
    if (!parentElement) {
      return;
    }

    const button = getOrCreateElement({
      tagName: 'button',
      className: 'copy-button',
      // just use the global WaniKani button styles
      secondaryClassNames: 'btn btn-mini',
      parentElement,
      attributes: {
        type: 'button',
      },
    });

    const initialButtonText = 'Copy';
    button.innerHTML = initialButtonText;
    button.onclick = () => {
      const entry = screenScrapeCurrentEntry();
      const entryLine = createEntryLine(entry);

      navigator.clipboard.writeText(entryLine);

      button.innerHTML = getNewButtonText(button, initialButtonText, 'Copied');
    };
  }

  function createUrl(slug) {
    return `https://www.wanikani.com/${currentSubjectType}/${slug}`;
  }

  const linkStyle = 'margin-right: 15px;line-height: 1.5rem;';

  function createLink(url, slug) {
    let style = linkStyle;
    if (slug === currentSlug) {
      style += 'color: #666666;';
    }

    return `<a href="${url}" style="${style}" target="_blank" rel="noopener noreferrer">${slug}</a>`;
  }

  function parseEntry(line, lineIndex) {
    // match text before a Japanese opening parenthesis and assume it's kanji
    const entryMatchResult = line.match(/^(.*)（/);
    if (!entryMatchResult) {
      return null;
    }

    const slug = entryMatchResult[1];

    // math text between Japanese opening and closing parentheses and assume it's metadata
    const metadataMatchResult = line.match(/^.*（(.*)）/);
    const metadata = metadataMatchResult ? metadataMatchResult[1] : null;

    // match text after Japanese opening and closing parentheses and assume it's a list of English meanings
    const meaningsMatchResult = line.match(/^.*（.*）(.*)/);
    const meanings = meaningsMatchResult ? meaningsMatchResult[1] : null;

    const notOnWk = /not on WK/.test(metadata);
    const override = /override/.test(metadata);
    const url = !notOnWk ? createUrl(slug) : null;
    const link = !notOnWk ? createLink(url, slug) : null;

    return {
      slug,
      metadata,
      meanings,
      url,
      link,
      notOnWk,
      override,
      lineIndex,
    };
  }

  function splitNoteIntoLines(note) {
    return note.split('<br>').map((line) => line.trim());
  }

  function createNoteFromLines(lines) {
    return lines.join('<br>');
  }

  function parseGroups(note) {
    const groups = [[]];

    const lines = splitNoteIntoLines(note);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const currentGroup = groups[groups.length - 1];

      const entry = parseEntry(line, i);

      if (!entry) {
        if (currentGroup.length) {
          // start a new group
          groups.push([]);
        }

        // continue to the next line
        return;
      }

      currentGroup.push(entry);
    }

    // there may be empty groups, that need to be filtered out,
    // if the note ended in blank lines or remarks
    const groupsWithEntries = groups.filter((group) => group.length);

    return groupsWithEntries;
  }

  function createAllEntry(group) {
    const urls = group
      .filter((entry) => entry.slug !== currentSlug)
      // ignore 'All' and 'not on/in WK' entries
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
  }

  function addAllLinks(groups) {
    return groups.map((group) => {
      const entriesWithUrls = group.filter((entry) => entry.url);

      return entriesWithUrls.length > 1
        ? [...group, createAllEntry(group)]
        : group;
    });
  }

  function createCopyEntry(group) {
    const entriesWithSlug = getEntriesWithSlug(group);

    const groupText = entriesWithSlug
      .map(createEntryLine)
      .join('\\n')
      // The onclick function is defined as one big string surrounded by double quotes,
      // and clipboard.writeText (inside of onclick) surrounds text with single quotes,
      // so both single quotes and double quotes inside of the text need to be escaped!
      .replace(/'/g, "\\'")
      .replace(/"/g, '\\"');

    const onclick = `navigator.clipboard.writeText('${groupText}');return false;`;

    const hasLinks = entriesWithSlug.some((entry) => entry.link);

    const copyLink = `<a href="#" style="${linkStyle}" onclick="${onclick}">${
      hasLinks ? 'Copy' : 'Copy (not on WK)'
    }</a>`;

    return {
      link: copyLink,
    };
  }

  function addCopyLinks(groups) {
    return groups.map((group) => {
      const entriesWithSlug = getEntriesWithSlug(group);

      // don't add the 'Copy' entry to the group at the bottom with a single 'All' entry
      return entriesWithSlug.length > 0
        ? [...group, createCopyEntry(group)]
        : group;
    });
  }

  function getEntriesWithSlug(group) {
    // filter out the 'All' link entry
    return group.filter((entry) => entry.slug);
  }

  function createEverythingEntry(groups) {
    return createAllEntry(groups.flatMap((group) => group));
  }

  function addEverythingLink(groups) {
    const groupsWithAtLeastOneUrl = groups.filter(
      (group) => group.filter((entry) => entry.url).length,
    );

    return groupsWithAtLeastOneUrl.length > 1
      ? [...groups, [createEverythingEntry(groups)]]
      : groups;
  }

  function generateLinkSectionContent(groups) {
    return groups
      .filter((group) => group.some((entry) => entry.link))
      .map((group) => group.map((entry) => entry.link))
      .map((group) => group.join(''))
      .join('<br>');
  }

  function isNoteOpen(noteElement) {
    const noteFirstChild = noteElement.firstChild;
    return noteFirstChild && noteFirstChild.nodeName === 'FORM';
  }

  function updateLinkSection(noteElement) {
    // The note, i.e. rich text editor, will never be open when this function
    // is called on initial script load, but it might be open when this function
    // is called by the DOM mutation handler.
    if (isNoteOpen(noteElement)) {
      return;
    }

    noteElement.setAttribute('lang', 'ja');

    const parentElement = noteElement.parentElement;
    if (!parentElement) {
      return;
    }

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
  }

  function injectLinkSection(noteSelector) {
    if (currentSubjectType !== 'vocabulary' && currentSubjectType !== 'kanji') {
      return;
    }

    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) {
      return;
    }

    // initialization
    updateLinkSection(noteElement);

    // register a DOM change handler
    registerMutationObserver(noteElement, () => {
      updateLinkSection(noteElement);
    });
  }

  function generateNote(existingNote) {
    const lines = splitNoteIntoLines(existingNote);
    const groups = parseGroups(existingNote);

    const wkEntries = groups
      .flatMap((group) => group)
      .filter((entry) => !entry.notOnWk && !entry.override);

    for (const entry of wkEntries) {
      const subject = slugDB[entry.slug];

      // if no info is available, then assume the existing line is up-to-date
      if (!subject) {
        return;
      }

      const { meanings } = subject.data;
      const generatedMeanings = [
        ...meanings.filter((m) => m.primary),
        ...meanings.filter((m) => !m.primary),
      ]
        .map((m) => m.meaning)
        .join(', ');

      const entryLine = createEntryLine({
        slug: entry.slug,
        metadata: entry.metadata,
        meanings: generatedMeanings,
      });

      const { lineIndex } = entry;
      lines[lineIndex] = entryLine;
    }

    return createNoteFromLines(lines);
  }

  function updateUpdateNoteButton(noteElement) {
    const parentElement = noteElement.parentElement;
    if (!parentElement) {
      return;
    }

    const ignoreUpdateAttributeName = 'data-ignore-update';

    // if the ignore-update attribute is present, then assume
    // this is the update caused by opening the note to save or cancel
    if (noteElement.hasAttribute(ignoreUpdateAttributeName)) {
      noteElement.removeAttribute(ignoreUpdateAttributeName);
      return;
    }

    const button = getOrCreateElement({
      tagName: 'button',
      className: 'update-note-button',
      // just use the global WaniKani button styles
      secondaryClassNames: 'btn btn-mini',
      parentElement,
      attributes: {
        type: 'button',
      },
    });

    function hideButton() {
      // hide the button
      button.style = 'display: none;';
    }

    if (!isNoteOpen(noteElement)) {
      const existingNote = noteElement.innerHTML;
      const generatedNote = generateNote(existingNote);

      if (existingNote !== generatedNote) {
        // reset the button
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
        // hide the button because there is nothing to update
        hideButton();
      }
    } else {
      // hide the button because the note is open
      hideButton();
    }
  }

  function injectUpdateNoteButton(noteSelector, slugDB) {
    if (currentSubjectType !== 'vocabulary' && currentSubjectType !== 'kanji') {
      return;
    }

    const noteElement = document.querySelector(noteSelector);
    if (!noteElement) {
      return;
    }

    // initialization
    updateUpdateNoteButton(noteElement, slugDB);

    // register a DOM change handler
    registerMutationObserver(noteElement, () => {
      updateUpdateNoteButton(noteElement, slugDB);
    });
  }

  injectCopyButton('.row header');

  const noteSelectors = ['.note-meaning', '.note-reading'];
  for (const noteSelector of noteSelectors) {
    injectLinkSection(noteSelector);
  }

  const slugDB = await getSlugDB();
  for (const noteSelector of noteSelectors) {
    injectUpdateNoteButton(noteSelector, slugDB);
  }
})();
