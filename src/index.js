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
  const lines = note.split('<br>');

  const links = lines
    .map(line => line.trim())
    .map(line => {
      const matchResult = line.match(/^(.*)（/);
      if (!matchResult) {
        return '<br>';
      }

      const vocabulary = matchResult[1];
      const link = `<a href='https://www.wanikani.com/vocabulary/${vocabulary}' style='margin-right: 8px'>${vocabulary}</a>`;
      return link;
    })
    .filter(v => !!v);

  const enhancedNote = links.join('').replace(/(<br>)+/g, '<br>');

  const linkElement = document.createElement('div');
  linkElement.style = 'margin-top: 0; margin-bottom: 0;';
  linkElement.innerHTML = enhancedNote;

  noteElement.parentElement.appendChild(linkElement);
};

linkify('.note-meaning');
linkify('.note-reading');
