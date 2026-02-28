/* CO2Coach prototype – vanilla JS (no backend) */
(function(){
  const screens = [...document.querySelectorAll('.screen')];
  const subtitle = document.getElementById('screenSubtitle');
  const welcomeText = document.getElementById('welcomeText');
  const weeklyTotalEl = document.getElementById('weeklyTotal');
  const avoidedTotalEl = document.getElementById('avoidedTotal');
  const barsEl = document.getElementById('categoryBars');
  const suggestionText = document.getElementById('suggestionText');

  const state = {
    name: '—',
    avoided: 2.4,
    weeklyTotal: 74.2,
    categories: {
      transporte: 34.0,
      hogar: 18.0,
      alimentacion: 12.0,
      consumo: 6.0,
      ocio: 4.2
    },
    challengeDone: 1,
    points: 120
  };

  const subtitles = {
    onboarding: 'Prototipo navegable',
    perfil: 'Perfil rápido',
    dashboard: 'Resumen semanal',
    registro: 'Registrar actividad',
    resultado: 'Resultado del cálculo',
    recomendaciones: 'Acciones sugeridas',
    comunidad: 'Retos y comunidad',
    impacto: 'Impacto agregado',
    marketplace: 'Marketplace'
  };

  function fmt(n, digits=1){
    return n.toLocaleString('es-ES', {minimumFractionDigits: digits, maximumFractionDigits: digits});
  }

  function renderDashboard(){
    const nameInput = document.getElementById('nameInput');
    if(nameInput && nameInput.value.trim()){
      state.name = nameInput.value.trim();
    }
    welcomeText.textContent = state.name !== '—'
      ? `Hola, ${state.name}. Resumen semanal`
      : 'Resumen semanal';

    weeklyTotalEl.textContent = fmt(state.weeklyTotal, 1);
    avoidedTotalEl.textContent = fmt(state.avoided, 1);

    const total = Object.values(state.categories).reduce((a,b)=>a+b,0);
    barsEl.innerHTML = '';
    const order = [
      ['Transporte','transporte'],
      ['Hogar','hogar'],
      ['Alimentación','alimentacion'],
      ['Consumo','consumo'],
      ['Ocio','ocio']
    ];

    order.forEach(([label,key])=>{
      const val = state.categories[key];
      const pct = total ? Math.round((val/total)*100) : 0;
      const row = document.createElement('div');
      row.className = 'barline';
      row.innerHTML = `
        <div class="barhead"><span>${label}</span><span>${pct}%</span></div>
        <div class="track"><div class="fill" style="width:${pct}%;"></div></div>
      `;
      barsEl.appendChild(row);
    });

    const highest = Object.entries(state.categories).sort((a,b)=>b[1]-a[1])[0][0];
    suggestionText.textContent = highest === 'transporte'
      ? 'Prueba a sustituir 2 trayectos cortos por bus esta semana.'
      : 'Elige una recomendación para reducir tu huella esta semana.';

    const pointsChip = document.getElementById('pointsChip');
    const challengeText = document.getElementById('challengeText');
    const challengeBar = document.getElementById('challengeBar');
    const myContribution = document.getElementById('myContribution');

    if(pointsChip) pointsChip.textContent = `Puntos: ${state.points}`;
    if(challengeText) challengeText.textContent = `Progreso: ${state.challengeDone}/3`;
    if(challengeBar) challengeBar.style.width = `${Math.min(100, (state.challengeDone/3)*100)}%`;
    if(myContribution) myContribution.textContent = fmt(state.avoided,1);
  }

  function show(screenId){
    screens.forEach(s => s.classList.toggle('hidden', s.dataset.screen !== screenId));
    subtitle.textContent = subtitles[screenId] || 'Prototipo';
    window.location.hash = screenId;

    if(screenId === 'dashboard' || screenId === 'comunidad' || screenId === 'impacto'){
      renderDashboard();
    }
  }

  function currentScreen(){
    const hash = (window.location.hash || '').replace('#','').trim();
    return subtitles[hash] ? hash : 'onboarding';
  }

  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-go]');
    if(btn){
      show(btn.getAttribute('data-go'));
      return;
    }
    const jump = e.target.closest('[data-jump]');
    if(jump){
      show(jump.getAttribute('data-jump'));
      return;
    }
  });

  const guide = document.getElementById('guide');
  const overlay = document.getElementById('overlay');

  document.getElementById('btnGuide').addEventListener('click', ()=>{
    guide.classList.toggle('hidden');
    overlay.classList.toggle('hidden', guide.classList.contains('hidden'));
  });

  document.getElementById('btnCloseGuide').addEventListener('click', ()=>{
    guide.classList.add('hidden');
    overlay.classList.add('hidden');
  });


  overlay.addEventListener('click', ()=>{
    guide.classList.add('hidden');
    overlay.classList.add('hidden');
  });

  const catBtns = [...document.querySelectorAll('.chipbtn')];
  const formT = document.getElementById('formTransporte');
  const placeholder = document.getElementById('formPlaceholder');
  catBtns.forEach(b=>{
    b.addEventListener('click', ()=>{
      catBtns.forEach(x=>x.classList.toggle('active', x===b));
      const isTransport = b.getAttribute('data-cat') === 'transporte';
      formT.classList.toggle('hidden', !isTransport);
      placeholder.classList.toggle('hidden', isTransport);
    });
  });

  document.getElementById('btnCalc').addEventListener('click', ()=>{
    const km = parseFloat(document.getElementById('kmInput').value || '0');
    const cons = parseFloat(document.getElementById('consumptionInput').value || '0');
    const pax = Math.max(1, parseInt(document.getElementById('passengersInput').value || '1', 10));
    const fuel = document.getElementById('fuelSelect').value;

    // Demo-only constants (in the report these come from a versioned factor table).
    const EF = fuel === 'diesel' ? 2.68 : 2.31; // kgCO2 per liter
    const liters = km * (cons/100);
    const co2 = (liters * EF) / pax;

    document.getElementById('resultValue').textContent = fmt(co2, 2);
    document.getElementById('resultBreakdown').textContent =
      `Litros estimados: ${fmt(liters,2)} L · Factor (demo): ${EF} kgCO₂/L · Pasajeros: ${pax}`;

    state.categories.transporte += co2;
    state.weeklyTotal += co2;

    show('resultado');
  });

  document.querySelectorAll('.rec-yes').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const card = btn.closest('.rec');
      const rec = card?.getAttribute('data-rec') || 'rec';
      const add = rec === 'bus' ? 1.8 : (rec === 'walk' ? 0.9 : 0.6);
      state.avoided += add;
      state.points += 30;
      state.challengeDone = Math.min(3, state.challengeDone + 1);
      card.querySelector('.tag').textContent = `Marcado como hecho ✅ (+${add} kgCO₂e evitados)`;
      btn.disabled = true;
      const noBtn = card.querySelector('.rec-no');
      if(noBtn) noBtn.disabled = true;
      renderDashboard();
    });
  });
  document.querySelectorAll('.rec-no').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      btn.textContent = 'Anotado';
      btn.disabled = true;
      const yesBtn = btn.closest('.rec')?.querySelector('.rec-yes');
      if(yesBtn) yesBtn.disabled = true;
    });
  });

  function tick(){
    const d = new Date();
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    document.getElementById('clock').textContent = `${hh}:${mm}`;
  }
  tick();
  setInterval(tick, 15000);

  window.addEventListener('hashchange', ()=> show(currentScreen()));
  show(currentScreen());
  renderDashboard();
})();
