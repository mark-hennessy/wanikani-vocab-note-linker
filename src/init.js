import './styles.css';

const note = `
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
本気（ほんき）Serious
<br>
基本（きほん）Foundation, Basics
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
