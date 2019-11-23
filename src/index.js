import './styles.css';

const note = `
木材（もくざい）Wood, Lumber 木材
<br>
材木（ざいもく）Lumber, Timber, Wood
<br>
Some text
<br>
<br>
材料（ざいりょう）Ingredients, Material
<br>
資料（しりょう）Material, Data
<br>
<br>
<br>
木材（もくざい）Wood, Lumber 木材
<br>
材木（ざいもく）Lumber, Timber, Wood
<br>
材料（ざいりょう）Ingredients, Material
<br>
資料（しりょう）Material, Data
<br>
<br>
Some more text
`;

document.getElementById('app').innerHTML = `
<div>
  <h2>Meaning Note</h2>
  <div class="note-meaning noSwipe">
    ${note}
  </div>
</div>

<div>
  <h2>Reading Note</h2>
  <div class="note-reading noSwipe">
    ${note}
  </div>
</div>
`;

// ==UserScript==
// @name         WaniKani Vocabulary Linker
// @namespace    http://tampermonkey.net/
// @description  Creates links for vocabulary in the "Meaning Note" and "Reading Note" sections.
// @version      0.4
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// ==/UserScript==

/*
Creates links for vocabulary in the "Meaning Note" and "Reading Note" sections.

Example Meaning Note
==
木材（もくざい）Wood, Lumber 木材
材木（ざいもく）Lumber, Timber, Wood
Some text

Constraints & Limitations
==
The script only works for vocabulary at the start of each new line
The script only works for vocabulary immediately followed by a Japanese opening parenthesis（
Chrome for mobile does not allow add-ons and thus does not support Tampermonkey UserScripts
The "All" link will only work if you enable multiple popups/tabs in your browser settings

How to use UserScripts on Firefox for mobile
==
Install Firefox for mobile
Install the Tampermonkey extension
Visit GreasyFork.org to install this script

Enable multiple popups/tabs in Chrome
==
Click the "All" link
Check the URL bar for a notification icon telling you that popups were blocked
Click the icon and tell chrome to stop blocking popups from WaniKani

Enable multiple popups/tabs in Firefox for Android (probably iOS as well)
==
Type "about:config" in the URL bar
Search for "popups"
Click "dom.block_multiple_popups" to change the value to "false"

Useful Links
==
CodeSandbox: https://codesandbox.io/s/wanikani-vocabulary-linker-jzejl
GreasyFork: https://greasyfork.org/en/scripts/392752-wanikani-vocabulary-linker
GitHub: https://github.com/mark-hennessy/wanikani-vocabulary-linker
*/

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

const linkify = noteClassName => {
  const noteElement = document.querySelector(noteClassName);
  const note = noteElement.innerHTML;

  const groups = parseGroupsFromNote(note);

  addAllLinkToGroups(groups);

  const linkSectionContent = generateLinkSectionContent(groups);

  const linkSection = document.createElement('div');
  linkSection.style = 'margin-top: 0; margin-bottom: 0;';
  linkSection.innerHTML = linkSectionContent;

  noteElement.parentElement.appendChild(linkSection);
};

linkify('.note-meaning');
linkify('.note-reading');
