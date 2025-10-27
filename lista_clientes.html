<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lista de Clientes | Sucursal Amaya</title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" rel="stylesheet">
<style>
body{background:#eef2f6;font-family:'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;}
.container{margin-top:2rem;}
table{width:100%;border-collapse:collapse;}
th,td{padding:8px;border:1px solid #ccc;text-align:left;}
th{background:#3b82f6;color:white;}
tr:nth-child(even){background:#f9f9f9;}
</style>
</head>
<body>
<div class="container">
  <h2>📋 LISTA DE CLIENTES</h2>
  <table id="tablaClientes">
    <thead>
      <tr>
        <th>NUMERO DE TARJETA</th>
        <th>NOMBRE DEL CLIENTE</th>
        <th>TELEFONO</th>
        <th>DIRECCION</th>
        <th>DIAS PENDIENTES</th>
        <th>DEUDA TOTAL</th>
      </tr>
    </thead>
    <tbody></tbody>
  </table>
</div>

<script>
const SHEET_URL_RAW = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRbmVB9wmGK70VAeV9IfsKPbrtHSSGkpoyudYQkqaGVjBUxso-c5MmtBV6j-0qUxbrr4ws6P3GsSklK/pub?gid=1512254828&single=true&output=csv";
const SHEET_URL = "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(SHEET_URL_RAW);

function parseCSV(text){
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(h=>h.toLowerCase());
  return lines.slice(1).map(line=>{
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h,i)=>{obj[h]=vals[i]||'';});
    return obj;
  });
}

function parseCurrency(str){
  if(!str) return 0;
  let n = str.replace(/[^\d.-]/g,'');
  return parseFloat(n) || 0;
}

function formatNumber(num){
  return Number(num).toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
}

function cargarLista(){
  const params = new URLSearchParams(window.location.search);
  const rango = params.get('rango'); // "30","60","90","91"

  fetch(SHEET_URL).then(r=>r.text()).then(text=>{
    const clientes = parseCSV(text);
    const tbody = document.querySelector('#tablaClientes tbody');
    tbody.innerHTML = '';

    clientes.forEach(c=>{
      const dias = parseInt(c['dias pendientes']||0);
      let mostrar = false;
      if(rango==="30" && dias>=1 && dias<=30) mostrar=true;
      else if(rango==="60" && dias>=31 && dias<=60) mostrar=true;
      else if(rango==="90" && dias>=61 && dias<=90) mostrar=true;
      else if(rango==="91" && dias>=91) mostrar=true;

      if(mostrar){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${c['numero de tarjeta']||''}</td>
                        <td>${c['nombre del cliente']||''}</td>
                        <td>${c['telefono']||''}</td>
                        <td>${c['direccion']||''}</td>
                        <td>${c['dias pendientes']||0}</td>
                        <td>$${formatNumber(parseCurrency(c['deuda total']))}</td>`;
        tbody.appendChild(tr);
      }
    });
  });
}

cargarLista();
</script>
</body>
</html>
