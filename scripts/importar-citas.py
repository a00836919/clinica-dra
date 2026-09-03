#!/usr/bin/env python3
"""
Importa la agenda del sistema anterior a `consultas`.

El export trae nombre y teléfono pero no DPI ni fecha de nacimiento, así que las
citas se cargan SIN expediente ligado (paciente_id nulo) y con el nombre suelto.
Requiere haber corrido sql/agenda-disponibilidad.sql.

Es idempotente: `origen_id` tiene índice único, así que volver a correrlo no
duplica nada.

Uso:
    python3 scripts/importar-citas.py <archivo.xlsx> [--aplicar]

Sin --aplicar solo muestra qué haría.
"""
import sys, json, urllib.request, datetime, collections, re
from pathlib import Path

# Guatemala es UTC-6 todo el año, sin horario de verano. El Excel trae horas
# locales sin zona; sin esto, Postgres las interpreta como UTC y toda la agenda
# queda corrida seis horas.
GT = datetime.timezone(datetime.timedelta(hours=-6))

RAIZ = Path(__file__).resolve().parent.parent

def env(clave):
    for linea in (RAIZ / ".env.local").read_text().splitlines():
        if linea.startswith(clave + "="):
            return linea.split("=", 1)[1].strip()
    raise SystemExit(f"Falta {clave} en .env.local")

def rest(metodo, ruta, cuerpo=None, prefer=None):
    url = env("NEXT_PUBLIC_SUPABASE_URL") + "/rest/v1/" + ruta
    key = env("SUPABASE_SERVICE_ROLE_KEY")
    datos = json.dumps(cuerpo).encode() if cuerpo is not None else None
    req = urllib.request.Request(url, data=datos, method=metodo)
    req.add_header("apikey", key)
    req.add_header("Authorization", "Bearer " + key)
    req.add_header("Content-Type", "application/json")
    if prefer:
        req.add_header("Prefer", prefer)
    try:
        with urllib.request.urlopen(req) as r:
            texto = r.read().decode()
            return json.loads(texto) if texto else None
    except urllib.error.HTTPError as e:
        raise SystemExit(f"{metodo} {ruta} → {e.code}: {e.read().decode()[:400]}")

def limpiar_nombre(valor):
    n = str(valor or "").strip().lstrip("~").strip()
    # El export mezcla MAYÚSCULAS y minúsculas sin criterio.
    return " ".join(p.capitalize() for p in n.split()) if n else None

def limpiar_telefono(valor):
    if not valor:
        return None
    t = re.sub(r"[^\d]", "", str(valor))
    return t or None

def main():
    if len(sys.argv) < 2:
        raise SystemExit(__doc__)
    archivo = sys.argv[1]
    aplicar = "--aplicar" in sys.argv

    import openpyxl
    ws = openpyxl.load_workbook(archivo, data_only=True).active
    filas = [f for f in ws.iter_rows(min_row=5, values_only=True) if f[0]]

    # La doctora de esta agenda. El export solo trae "Majo" como nombre de agenda.
    staff = rest("GET", "staff?select=id,nombre_completo,nombre_agenda&es_doctora=is.true&activo=is.true")
    doctora = next((s for s in staff if "polanco" in (s["nombre_completo"] or "").lower()), staff[0])

    citas, omitidas = [], collections.Counter()
    for f in filas:
        inicio, nombre, telefono, servicio, obs = f[1], f[4], f[6], f[7], f[8]
        agenda, origen_id = f[9], f[10]
        if not isinstance(inicio, datetime.datetime):
            omitidas["sin hora de inicio"] += 1
            continue
        limpio = limpiar_nombre(nombre)
        if not limpio:
            omitidas["sin nombre"] += 1
            continue

        # El estado vive en la columna "Estado / agenda": "Realizadas" son citas
        # ya atendidas. Las observaciones son notas de recepción, no estados,
        # salvo cuando dicen explícitamente confirmada o cancelada.
        texto = str(obs or "").lower()
        grupo = str(agenda or "").strip().lower()
        if grupo == "realizadas":
            estado = "atendida"
        elif "cancel" in texto:
            estado = "cancelada"
        elif "confirmada" in texto:
            estado = "confirmada"
        else:
            estado = "agendada"

        # Las notas se conservan salvo que solo digan "confirmada".
        nota = str(obs).strip() if obs and texto.strip() != "confirmada" else None
        servicio_txt = str(servicio).strip() if servicio else None
        motivo = " · ".join(x for x in (servicio_txt, nota) if x) or None

        citas.append({
            "paciente_id": None,
            "paciente_nombre": limpio,
            "paciente_telefono": limpiar_telefono(telefono),
            "doctora_id": doctora["id"],
            "doctora_nombre": doctora.get("nombre_agenda") or doctora["nombre_completo"],
            "sede": "Integra",
            "fecha": inicio.replace(tzinfo=GT).isoformat(),
            "motivo": motivo,
            "estado": estado,
            "origen": "importado",
            "origen_id": str(origen_id) if origen_id else None,
        })

    print(f"archivo:  {archivo}")
    print(f"filas:    {len(filas)}")
    print(f"a cargar: {len(citas)}")
    if omitidas:
        print(f"omitidas: {dict(omitidas)}")
    print(f"doctora:  {doctora['nombre_completo']}")
    print(f"estados:  {dict(collections.Counter(c['estado'] for c in citas))}")
    rango = sorted(c["fecha"] for c in citas)
    print(f"rango:    {rango[0][:10]} → {rango[-1][:10]}")

    # La idempotencia se resuelve aquí y no con ON CONFLICT: el índice único de
    # origen_id es parcial (solo donde no es nulo) y PostgREST no puede inferir
    # un índice parcial. Preguntar antes es igual de seguro y más explícito.
    ya = rest("GET", "consultas?select=id,origen_id,fecha&origen=eq.importado&limit=5000") or []
    existentes = {x["origen_id"]: x for x in ya if x.get("origen_id")}
    nuevas = [c for c in citas if c["origen_id"] and c["origen_id"] not in existentes]

    # Reconciliación: si una cita ya cargada tiene otra hora que la del archivo,
    # se corrige. Así una importación con la zona horaria mal se puede reparar
    # sin borrar nada.
    def mismo_instante(a, b):
        return datetime.datetime.fromisoformat(a) == datetime.datetime.fromisoformat(b)

    desfasadas = [
        (existentes[c["origen_id"]]["id"], c["fecha"])
        for c in citas
        if c["origen_id"] in existentes
        and not mismo_instante(existentes[c["origen_id"]]["fecha"], c["fecha"])
    ]

    print(f"ya estaban:   {len(existentes)}")
    print(f"por insertar: {len(nuevas)}")
    print(f"por corregir: {len(desfasadas)}")

    if not aplicar:
        print("\n(simulación — agrega --aplicar para escribir)")
        return

    if desfasadas:
        print(f"\ncorrigiendo la hora de {len(desfasadas)} citas…")
        for n, (cid, fecha) in enumerate(desfasadas, 1):
            rest("PATCH", f"consultas?id=eq.{cid}", {"fecha": fecha}, prefer="return=minimal")
            if n % 50 == 0 or n == len(desfasadas):
                print(f"  {n}/{len(desfasadas)}")

    if not nuevas:
        print("\nsin citas nuevas que insertar.")
        return

    insertadas = 0
    for i in range(0, len(nuevas), 100):
        lote = nuevas[i:i + 100]
        rest("POST", "consultas", lote, prefer="return=minimal")
        insertadas += len(lote)
        print(f"  lote {i//100 + 1}: {insertadas}/{len(nuevas)}")

    total = rest("GET", "consultas?select=id&origen=eq.importado&limit=1000")
    print(f"\nlisto. citas importadas en la base: {len(total)}")

if __name__ == "__main__":
    main()
