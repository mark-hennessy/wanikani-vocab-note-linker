import './styles.css';

const readableNote = `
大変（たいへん）Serious, Terrible, Very, Difficult, Hard, Hectic
<br>
深刻（しんこく）Serious, Grave
<br>
真剣（しんけん）Serious
<br>
本気（ほんき）Serious
<br>
<br>
ほんき sounds silly/funny...but it means Serious haha.
<br>
<br>
本気（ほんき）Serious
<br>
根気（こんき）Patience, Perseverance, Persistence
<br>
<br>
根気（こんき）Patience, Perseverance, Persistence
<br>
<br>
本気（ほんき）Serious
<br>
基本（きほん）Foundation, Basics
<br>
<br>
空手（からて、not on WK）Karate (a type of Martial Arts)
<br>
空オケ（からオケ、not in WK）Karaoke
`;

const note = readableNote.split('\n').join('');

document.getElementById('app').innerHTML = `
<header class="global-header"></header>
<div class="row">
  <header>
    <div class="logo">
      <h1>WaniKani</h1>
    </div>
    <h1>
      <a class="level-icon" href="#" onclick="return false;">54</a>
      <span>大変</span>
    </h1>
    <div class="page-list">Go to: Meaning, Reading, Context, Kanji Composition, Progress</div>
  </header>
  <section id="meaning">
    <h2>Meaning</h2>
    <div class="alternative-meaning">
      <strong>Primary</strong>
      <p>Serious</p>
    </div>
    <div class="alternative-meaning">
      <strong>Alternative Meanings</strong>
      <p>Terrible, Very, Difficult, Hard, Hectic</p>
    </div>
    <div class="alternative-meaning">
      <strong>Word Type</strong>
      <p>noun, する verb</p>
    </div>
    <section id="note-meaning">
      <strong>Note</strong>
      <br /><br />
      <div class="note-meaning">${note}</div>
    </section>
  </section>
  <section id="reading">
    <h2>Reading</h2>
    <div class="pronunciation-group">
      <p class="pronunciation-variant">たいへん</p>
    </div>
    <div class="pronunciation-group">
      <p class="pronunciation-variant">タイヘン</p>
    </div>
    <section id="note-reading">
      <strong>Note</strong>
      <br /><br />
      <div class="note-reading">${note}</div>
    </section>
  <section>
</div>
`;
