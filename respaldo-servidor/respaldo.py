#!/usr/bin/env python3
"""Respaldo completo de Firebase Realtime Database en su formato nativo (JSON).

Equivale a "Exportar JSON" de la consola: GET /.json?format=export con un token de
cuenta de servicio (que ignora las reglas de seguridad, por eso incluye nodos como casvel_inventory_v1 que las reglas no exponen a la app).

Variables de entorno:
  FIREBASE_DB_URL           https://<proyecto>-default-rtdb.firebaseio.com
  FIREBASE_SERVICE_ACCOUNT  contenido del JSON de la cuenta de servicio
  BACKUP_DIR                carpeta de salida (default: respaldos)
  BACKUP_KEEP               cuántos respaldos conservar (default: 60; 0 = todos)
"""
import datetime, json, os, pathlib, sys, urllib.request

import google.auth.transport.requests
from google.oauth2 import service_account

SCOPES = ["https://www.googleapis.com/auth/firebase.database",
          "https://www.googleapis.com/auth/userinfo.email"]

def main():
    url = os.environ["FIREBASE_DB_URL"].rstrip("/")
    info = json.loads(os.environ["FIREBASE_SERVICE_ACCOUNT"])
    creds = service_account.Credentials.from_service_account_info(info, scopes=SCOPES)
    creds.refresh(google.auth.transport.requests.Request())

    req = urllib.request.Request(url + "/.json?format=export",
                                 headers={"Authorization": "Bearer " + creds.token})
    with urllib.request.urlopen(req, timeout=300) as r:
        raw = r.read()

    data = json.loads(raw)                      # valida que sea JSON íntegro
    if not isinstance(data, dict) or not data.get("casvel_v1"):
        sys.exit("Respaldo sospechoso: falta casvel_v1; no se guarda.")

    out = pathlib.Path(os.environ.get("BACKUP_DIR", "respaldos"))
    out.mkdir(parents=True, exist_ok=True)
    name = datetime.datetime.utcnow().strftime("%Y%m%d-%H%M") + "-contratoscasvel-rtdb-export.json"
    # La API REST devuelve JSON compacto (una sola línea); la consola de Firebase exporta
    # indentado a 2 espacios, claves ordenadas y UTF-8 literal. Se reproduce ese formato.
    pretty = json.dumps(data, indent=2, sort_keys=True, ensure_ascii=False)
    (out / name).write_text(pretty, encoding="utf-8")
    print(f"OK {name}: {len(pretty)} caracteres, {len(data)} nodos, {len(data['casvel_v1'])} contratos")

    keep = int(os.environ.get("BACKUP_KEEP", "60"))
    if keep:
        for old in sorted(out.glob("*-contratoscasvel-rtdb-export.json"))[:-keep]:
            old.unlink()

if __name__ == "__main__":
    main()
