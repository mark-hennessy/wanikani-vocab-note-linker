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
// @version      0.1
// @description  Creates links for vocabulary in the "Meaning Note" and "Reading Note" sections. See example below. Only works for vocabulary at the start of each new line. Vocabulary must be followed by a Japanese opening parenthesis（
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// ==/UserScript==

// Example Meaning Note
// ==
// 木材（もくざい）Wood, Lumber 木材
// 材木（ざいもく）Lumber, Timber, Wood
// Some text

// GreasyFork: https://greasyfork.org/en/scripts/392752-wanikani-vocabulary-linker
// GitHub: https://github.com/mark-hennessy/wanikani-vocabulary-linker

const linkify = noteClassName => {
  const noteElement = document.querySelector(noteClassName);
  const note = noteElement.innerHTML;
  const lines = note.split('<br>').map(line => line.trim());

  const groups = [[]];
  lines.forEach(line => {
    const currentGroup = groups[groups.length - 1];
    const matchResult = line.match(/^(.*)（/);

    if (!matchResult) {
      if (currentGroup.length) {
        groups.push([]);
      }

      return;
    }

    const vocabulary = matchResult[1];
    const url = `https://www.wanikani.com/vocabulary/${vocabulary}`;
    const link = `<a href="${url}" style='margin-right: 15px'>${vocabulary}</a>`;
    const linkInfo = {
      url,
      link,
    };

    currentGroup.push(linkInfo);
  });

  const openInNewTab = url => {
    window.open(url, '_blank');
  };

  groups
    .filter(g => g.length > 1)
    .forEach(g => {
      const openGroupInNewTab = () => {
        g.forEach(openInNewTab);

        // To ignore the href
        return false;
      };

      const allLink =
        '<a href="#" onclick="return openGroupInNewTab()">All</a>';
        
      const linkInfo = {
        link: allLink,
      };

      g.push(linkInfo);
    });

  const enhancedNote = groups
    .map(g => g.map(info => info.link))
    .map(g => g.join(''))
    .join('<br>');

  const linkElement = document.createElement('div');
  linkElement.style = 'margin-top: 0; margin-bottom: 0;';
  linkElement.innerHTML = enhancedNote;

  noteElement.parentElement.appendChild(linkElement);
};

linkify('.note-meaning');
linkify('.note-reading');
