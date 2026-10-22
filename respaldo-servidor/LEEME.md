# Respaldo automático en servidor (GitHub Actions)

Corre solo, aunque nadie abra la app. Guarda el JSON **nativo** de toda la base (incluye los nodos que las reglas no exponen a la app, p. ej. `casvel_inventory_v1`).

1. Crea un repositorio **privado** en GitHub (ej. `casvel-respaldos`). Los respaldos contienen datos de clientes: no lo hagas público.
2. Sube `respaldo.py` a la raíz y `.github/workflows/respaldo-firebase.yml` a ese repo.
3. Firebase Console → Configuración del proyecto → **Cuentas de servicio** → *Generar nueva clave privada*. Se descarga un `.json`.
4. En el repo: Settings → Secrets and variables → Actions → New repository secret:
   - `FIREBASE_SERVICE_ACCOUNT` = contenido completo del `.json` de la clave.
   - `FIREBASE_DB_URL` = `https://<tu-proyecto>-default-rtdb.firebaseio.com`
5. Pestaña Actions → *Respaldo Firebase* → **Run workflow** para probar. Debe aparecer `respaldos/AAAAMMDD-HHMM-contratoscasvel-rtdb-export.json`.
6. Ajusta el `cron` (hora UTC) y `BACKUP_KEEP` (cuántos conservar) a tu gusto.

Nunca subas la clave de la cuenta de servicio al repo ni la pongas en la app: solo como *secret*.
Restaurar: Firebase Console → Realtime Database → ⋮ → *Importar JSON* (reemplaza/mezcla el nodo elegido; haz primero un respaldo del estado actual).
