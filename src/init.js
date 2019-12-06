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
<header>
  <div class="logo">
    <h1>WaniKani</h1>
  </div>
</header>
<header>
  <h1>
    <a class="level-icon" href="#" onclick="return false;">54</a>
    <span>大変</span>
    Serious
  </h1>
</header>
<section id="information">
  <div class="alternative-meaning">
    <h2>Alternative Meanings</h2>
    <p>Terrible, Very, Difficult, Hard, Hectic</p>
  </div>
</section>
<section class="vocabulary-reading">
  <h2>Reading</h2>
  <div class="pronunciation-group">
    <p class="pronunciation-variant">たいへん</p>
  </div>
  <div class="pronunciation-group">
    <p class="pronunciation-variant">タイヘン</p>
  </div>
<section>
<div>
  <h2>Meaning Note</h2>
  <div class="note-meaning noSwipe">${note}</div>
</div>
<div>
  <h2>Reading Note</h2>
  <div class="note-reading noSwipe">${note}</div>
</div>
`;
