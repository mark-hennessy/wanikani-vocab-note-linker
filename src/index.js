import './styles.css';

document.getElementById('app').innerHTML = `
<h2>Meaning Note</h2>
<div class="note-meaning noSwipe">木材（もくざい）Wood, Lumber 木材<br>材木（ざいもく）Lumber, Timber, Wood<br>Some text</div>

<h2>Reading Note</h2>
<div class="note-reading noSwipe">木材（もくざい）Wood, Lumber 木材<br>材木（ざいもく）Lumber, Timber, Wood<br>Some text</div>
`;

// ==UserScript==
// @name         WaniKani Vocabulary Linker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Creates links for vocabulary in the "Meaning Note" and "Reading Note" sections. See example below. Only works for vocabulary at the start of each new line. Vocabulary must be followed by a Japanese opening parenthesis（
// @author       Mark Hennessy
// @match        https://www.wanikani.com/vocabulary/*
// @grant        none
// ==/UserScript==

// Example Meaning Note
// ==
// 木材（もくざい）Wood, Lumber 木材
// 材木（ざいもく）Lumber, Timber, Wood
// Some text

// Becomes
// ==
// <a href="https://www.wanikani.com/vocabulary/木材">木材</a>（もくざい）Wood, Lumber 木材
// <a href="https://www.wanikani.com/vocabulary/材木">材木</a>（ざいもく）Lumber, Timber, Wood
// Some text

const linkify = noteClassName => {
  const noteElement = document.querySelector(noteClassName);
  const note = noteElement.innerHTML;
  const lines = note.split('<br>');

  const enhancedLines = lines.map(line => {
    const matchResult = line.match(/^(.*)（/);
    if (!matchResult) {
      return line;
    }

    const vocabulary = matchResult[1];
    return line.replace(
      vocabulary,
      `<a href='https://www.wanikani.com/vocabulary/${vocabulary}'>${vocabulary}</a>`,
    );
  });

  const enhancedNote = enhancedLines.join('<br>');
  noteElement.innerHTML = enhancedNote;
};

linkify('.note-meaning');
linkify('.note-reading');
