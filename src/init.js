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
