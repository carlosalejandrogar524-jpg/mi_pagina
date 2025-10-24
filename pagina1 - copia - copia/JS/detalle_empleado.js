// js/detalle_empleado.js
// Requiere: API en api_detalle.php, Chart.js 4.4, html2canvas + jsPDF (ya incluidos)
(() => {
  if (!EMPLEADO_ID || EMPLEADO_ID === 0) {
    alert('Empleado no especificado. Pasa ?empleadoId=123 en la URL.');
    return;
  }

  // DOM references
  const filterMes = document.getElementById('filterMes');
  const consolidadoBody = document.getElementById('consolidadoBody');
  const kpiRec = document.getElementById('kpiRec');
  const kpiObj = document.getElementById('kpiObj');
  const kpiFal = document.getElementById('kpiFal');
  const kpiPct = document.getElementById('kpiPct');

  // modals
  const modalRec = document.getElementById('modalRec');
  const modalCred = document.getElementById('modalCred');
  const modalGest = document.getElementById('modalGest');

  // modal DOMs
  const modalRecMes = document.getElementById('modalRecMes');
  const tbodyRec = document.getElementById('tbodyRec');
  const recSummary = document.getElementById('recSummary');
  const searchRec = document.getElementById('searchRec');

  const modalCredMes = document.getElementById('modalCredMes');
  const tbodyCred = document.getElementById('tbodyCred');
  const credSummary = document.getElementById('credSummary');
  const searchCred = document.getElementById('searchCred');

  const modalGestMes = document.getElementById('modalGestMes');
  const tbodyGest = document.getElementById('tbodyGest');
  const gestSummary = document.getElementById('gestSummary');
  const searchGest = document.getElementById('searchGest');

  // charts
  let chartPie, chartBar, chartLine;

  // state
  let consolidado = [];
  let pagos = [];
  let creditos = [];
  let gestiones = [];

  // small helper
  const money = v => `$${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`;

  // fetch helper
  async function api(action, mes = null) {
    const params = new URLSearchParams({ action, empleadoId: EMPLEADO_ID });
    if (mes) params.append('mes', mes);
    const url = `${API_URL}?${params.toString()}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`API ${action} failed: ${res.status}`);
    return res.json();
  }

  // load all lists
  async function loadAll() {
    try {
      // consolidado (list of months/objectives)
      consolidado = await api('consolidado');
    } catch (err) {
      console.error(err);
      alert('No se pudo cargar consolidado. Revisa API o datos.');
      return;
    }

    // populate filter dropdown using consolidado months
    filterMes.innerHTML = '<option value="Todos">Todos los meses</option>';
    consolidado.forEach(c => {
      const o = document.createElement('option'); o.value = c.mes || c.MES || c.Mes || c.MES; o.textContent = c.mes || c.MES || c.Mes || c.MES;
      filterMes.appendChild(o);
    });

    // load details (pagos, creditos, gestiones) — full sets
    pagos = await api('pagos');
    creditos = await api('creditos');
    gestiones = await api('gestiones');

    // show empleado name (fetch from API optionally) - if consolidado empty, keep default
    // (optionally you can implement endpoint to get empleado info)
    document.getElementById('empleadoNombre').textContent = `Empleado ID ${EMPLEADO_ID}`;

    // initial render with all months
    renderConsolidado(consolidado);

    // charts
    renderCharts(consolidado);

    // filter change
    filterMes.addEventListener('change', () => {
      const mes = filterMes.value;
      const dataset = (mes === 'Todos') ? consolidado : consolidado.filter(x => (x.mes || x.MES) === mes);
      renderConsolidado(dataset);
      renderCharts(dataset);
    });
  }

  // render consolidated table — compute totals from detail arrays
  function renderConsolidado(dataset) {
    consolidadoBody.innerHTML = '';
    dataset.forEach(row => {
      const month = row.mes || row.MES;
      const objetivo = Number(row.objetivo || row.OBJETIVO || row.objetivo_mensual || 0);
      const pagosMes = pagos.filter(p => p.mes === month || p.MES === month);
      const creditosMes = creditos.filter(c => c.mes === month || c.MES === month);
      const gestionesMes = gestiones.filter(g => g.mes === month || g.MES === month);

      const totalRec = pagosMes.reduce((s, p) => s + Number(p.Monto || p.monto || p.monto_cuota || 0), 0);
      const falt = Math.max(0, objetivo - totalRec);
      const pct = objetivo ? ((totalRec / objetivo) * 100).toFixed(1) : '0.0';

      const tr = document.createElement('tr');
      tr.classList.add('hover:bg-gray-50');
      tr.innerHTML = `
        <td class="px-4 py-2">${month}</td>
        <td class="px-4 py-2">${money(totalRec)} <button class="btn-linklike" data-month="${month}" data-type="rec">Ver</button></td>
        <td class="px-4 py-2">${money(falt)}</td>
        <td class="px-4 py-2">${money(objetivo)}</td>
        <td class="px-4 py-2">${creditosMes.length} <button class="btn-linklike" data-month="${month}" data-type="cred">Ver</button></td>
        <td class="px-4 py-2">${gestionesMes.length} <button class="btn-linklike" data-month="${month}" data-type="gest">Ver</button></td>
        <td class="px-4 py-2">${Number(pct) >= 85 ? `<span class="text-green-600 font-bold">${pct}%</span>` : `<span class="text-red-600 font-bold">${pct}%</span>`}</td>
      `;
      consolidadoBody.appendChild(tr);
    });

    // update KPIs for this dataset
    const months = dataset.map(d => d.mes || d.MES);
    const objSum = dataset.reduce((s, d) => s + Number(d.objetivo || d.OBJETIVO || d.objetivo_mensual || 0), 0);
    const recSum = pagos.filter(p => months.includes(p.mes || p.MES)).reduce((s,p) => s + Number(p.Monto || p.monto || p.monto_cuota || 0), 0);
    const faltSum = Math.max(0, objSum - recSum);
    const pctSum = objSum ? ((recSum / objSum) * 100).toFixed(1) : '0.0';

    kpiRec.textContent = money(recSum);
    kpiObj.textContent = money(objSum);
    kpiFal.textContent = money(faltSum);
    kpiPct.textContent = `${pctSum}%`;

    // attach click events for 'Ver' buttons
    consolidadoBody.querySelectorAll('.btn-linklike').forEach(btn => {
      btn.addEventListener('click', (ev) => {
        const month = btn.dataset.month;
        const type = btn.dataset.type; // rec | cred | gest
        if (type === 'rec') openRecModal(month);
        if (type === 'cred') openCredModal(month);
        if (type === 'gest') openGestModal(month);
      });
    });
  }

  // Charts render
  function renderCharts(dataset) {
    const labels = dataset.map(d => d.mes || d.MES);
    const recValues = dataset.map(d => {
      const month = d.mes || d.MES;
      return pagos.filter(p => p.mes === month || p.MES === month).reduce((s, p) => s + Number(p.Monto || p.monto || p.monto_cuota || 0), 0);
    });
    const objValues = dataset.map(d => Number(d.objetivo || d.OBJETIVO || d.objetivo_mensual || 0));
    const faltValues = objValues.map((o,i) => Math.max(0, o - (recValues[i]||0)));
    const pctValues = recValues.map((r,i) => objValues[i] ? ((r / objValues[i]) * 100).toFixed(1) : 0);

    // destroy prev
    if (chartPie) chartPie.destroy();
    if (chartBar) chartBar.destroy();
    if (chartLine) chartLine.destroy();

    // Pie
    chartPie = new Chart(document.getElementById('chartPie').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Recuperado', 'Faltante'],
        datasets: [{ data: [recValues.reduce((a,b)=>a+b,0), faltValues.reduce((a,b)=>a+b,0)], backgroundColor: ['#16a34a', '#f59e0b'] }]
      },
      options: { maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
    });

    // Bar
    chartBar = new Chart(document.getElementById('chartBar').getContext('2d'), {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Recuperado', data: recValues, backgroundColor: '#16a34a' },
          { label: 'Objetivo', data: objValues, backgroundColor: '#2563eb' }
        ]
      },
      options: { maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }
    });

    // Line % recuperado
    chartLine = new Chart(document.getElementById('chartLine').getContext('2d'), {
      type: 'line',
      data: { labels, datasets: [{ label: '% Recuperado', data: pctValues, borderColor: '#7c3aed', tension: 0.3, fill: false }] },
      options: { maintainAspectRatio: false, scales: { y: { min: 0, max: 100 } } }
    });
  }

  // Modal helpers & rendering
  function openRecModal(month) {
    modalRecMes.textContent = month;
    // fetch pagos for month (we already have pagos array; but we can re-call API if we want freshness)
    const rows = pagos.filter(p => (p.mes === month || p.MES === month));
    tbodyRec.innerHTML = '';
    let sum = 0;
    rows.forEach(r => {
      const mora = Number(r.MoraTotal || r.Mora || r.mora_total || 0);
      const monto = Number(r.Monto || r.monto || r.monto_cuota || 0);
      const pend = Math.max(0, mora - monto);
      sum += monto;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2 text-center">${r.Fecha || r.fecha_pago || ''}</td>
        <td class="p-2">${r.Cliente || r.nombre_cliente || ''}</td>
        <td class="p-2 text-center">${r.DUI || r.dui || ''}</td>
        <td class="p-2 text-center">${r.Telefono || r.telefono || ''}</td>
        <td class="p-2 text-right">${money(mora)}</td>
        <td class="p-2 text-center">${r.Cuota || r.numero_cuota || ''}</td>
        <td class="p-2 text-right">${money(monto)}</td>
        <td class="p-2 text-center">${r.CuotasPendientes || r.cuotas_pendientes || ''}</td>
        <td class="p-2 text-right">${money(pend)}</td>
      `;
      tbodyRec.appendChild(tr);
    });
    recSummary.textContent = `Registros: ${rows.length} • Total recuperado mostrado: ${money(sum)}`;
    showModal('modalRec');
    // search
    searchRec.value = '';
    searchRec.oninput = () => filterTable('#tbodyRec', searchRec.value);
  }

  function openCredModal(month) {
    modalCredMes.textContent = month;
    const rows = creditos.filter(c => (c.mes === month || c.MES === month));
    tbodyCred.innerHTML = '';
    let sum = 0;
    rows.forEach(r => {
      sum += Number(r.Precio || r.precio || 0);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2">${r.Cliente || r.nombre_cliente || ''}</td>
        <td class="p-2 text-center">${r.DUI || r.dui || ''}</td>
        <td class="p-2 text-center">${r.Telefono || r.telefono || ''}</td>
        <td class="p-2">${r.Correo || r.correo || ''}</td>
        <td class="p-2">${r.Direccion || r.direccion || ''}</td>
        <td class="p-2 text-center">${r.Producto || r.producto || ''}</td>
        <td class="p-2 text-right">${money(r.Precio || r.precio || 0)}</td>
        <td class="p-2 text-center">${r.TotalCuotas || r.total_cuotas || ''}</td>
      `;
      tbodyCred.appendChild(tr);
    });
    credSummary.textContent = `Registros: ${rows.length} • Valor total créditos: ${money(sum)}`;
    showModal('modalCred');
    searchCred.value = '';
    searchCred.oninput = () => filterTable('#tbodyCred', searchCred.value);
  }

  function openGestModal(month) {
    modalGestMes.textContent = month;
    const rows = gestiones.filter(g => (g.mes === month || g.MES === month));
    tbodyGest.innerHTML = '';
    rows.forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="p-2">${r.Cliente || r.nombre_cliente || ''}</td>
        <td class="p-2 text-center">${r.DUI || r.dui || ''}</td>
        <td class="p-2 text-center">${r.Telefono || r.telefono || ''}</td>
        <td class="p-2 text-center">${r.Fecha || r.fecha_gestion || ''}</td>
        <td class="p-2 text-center">${r.Tipo || r.tipo_gestion || ''}</td>
        <td class="p-2">${r.Comentario || r.comentario || ''}</td>
      `;
      tbodyGest.appendChild(tr);
    });
    gestSummary.textContent = `Registros: ${rows.length}`;
    showModal('modalGest');
    searchGest.value = '';
    searchGest.oninput = () => filterTable('#tbodyGest', searchGest.value);
  }

  // modal show/hide (Tailwind-based)
  function showModal(id) { document.getElementById(id).classList.remove('hidden'); document.getElementById(id).classList.add('flex'); }
  function closeModalId(id) { document.getElementById(id).classList.add('hidden'); document.getElementById(id).classList.remove('flex'); }
  window.closeModal = (id) => { closeModalId(id); };

  // generic filter for a tbody selector
  function filterTable(tbodySelector, q) {
    const rows = document.querySelectorAll(`${tbodySelector} tr`);
    rows.forEach(r => r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none');
  }

  // export PDF: screenshot container
  document.getElementById('btnExport').addEventListener('click', async () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('l','pt','a4');
    const el = document.querySelector('.container');
    const canvas = await html2canvas(el, { scale:2 });
    const img = canvas.toDataURL('image/png');
    const w = doc.internal.pageSize.getWidth() - 40;
    doc.addImage(img,'PNG',20,20,w,(canvas.height * w)/canvas.width);
    doc.save(`detalle_empleado_${EMPLEADO_ID}.pdf`);
  });

  // on load
  loadAll().catch(err => {
    console.error('Init failed', err);
    alert('Error cargando datos: ' + err.message);
  });

})();