import os
import base64

import uuid
import jwt
import json
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_pymongo import PyMongo
from bson.objectid import ObjectId # Para manejar los IDs de MongoDB
from werkzeug.security import generate_password_hash, check_password_hash
from google import genai
from dotenv import load_dotenv

import time
import requests

app = Flask(__name__)
CORS(app)
load_dotenv()


BASE_URL = "http://201.188.5.134:5000" 
app.config["MONGO_URI"] = "mongodb://localhost:27017/adventurers_hub"
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

FOUNDRY_DATA_PATH = "/home/arturo/foundrydata/Data/imports"

mongo = PyMongo(app)

client = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))

# GUARDIA DE SEGURIDAD (Decorador JWT)
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if len(auth_header.split(" ")) == 2:
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Acceso denegado"}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # Buscamos en la colección 'usuarios' de MongoDB
            usuario_actual = mongo.db.usuarios.find_one({"_id": ObjectId(data['usuario_id'])})
            if not usuario_actual:
                return jsonify({"error": "Usuario no encontrado"}), 401
        except:
            return jsonify({"error": "Token inválido"}), 401
            
        return f(usuario_actual, *args, **kwargs)
    return decorated



# 3. RUTAS DE AUTENTICACIÓN
@app.route('/api/registro', methods=['POST'])
def registro():
    datos = request.get_json()
    if mongo.db.usuarios.find_one({"username": datos['username']}):
        return jsonify({"error": "El usuario ya existe"}), 409
    
    nuevo_usuario = {
        "username": datos['username'],
        "password_hash": generate_password_hash(datos['password']),
        "fecha_registro": datetime.now(timezone.utc)
    }
    mongo.db.usuarios.insert_one(nuevo_usuario)
    return jsonify({"status": "success", "mensaje": "Usuario creado"}), 201

    

@app.route('/api/login', methods=['POST'])
def login():
    datos = request.get_json()
    usuario = mongo.db.usuarios.find_one({"username": datos['username']})
    
    if not usuario or not check_password_hash(usuario['password_hash'], datos['password']):
        return jsonify({"error": "Credenciales inválidas"}), 401
        
    token = jwt.encode({
        'usuario_id': str(usuario['_id']),
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }, app.config['SECRET_KEY'], algorithm='HS256')
    
    return jsonify({"status": "success", "token": token, "username": usuario['username']})









@app.route('/api/perfil', methods=['GET'])
@token_required # <--- ¡Aquí está la magia! Solo los que tengan pase entran.
def obtener_perfil(usuario_actual):
    # Como pasamos el guardia, Flask ya sabe quién es "usuario_actual"
    return jsonify({
        "status": "success",
        "mensaje": f"Hola {usuario_actual.username}, estás en la zona VIP.",
        "datos_usuario": {
            "id": usuario_actual.id,
            "username": usuario_actual.username,
            "fecha_registro": usuario_actual.fecha_registro
        }
    }), 200

@app.route('/api/campanas', methods=['POST'])
@token_required
def crear_campana(usuario_actual):
    datos = request.get_json()
    nueva_campana = {
        "nombre": datos['nombre'],
        "descripcion": datos.get('descripcion', ""),
        "codigo_invitacion": str(uuid.uuid4())[:6].upper(),
        "dm_id": usuario_actual['_id'],
        "jugadores": [] # Lista de IDs de jugadores unidos
    }
    resultado = mongo.db.campanas.insert_one(nueva_campana)
    return jsonify({
        "status": "success", 
        "id": str(resultado.inserted_id),
        "codigo": nueva_campana['codigo_invitacion']
    }), 201



@app.route('/api/campanas', methods=['GET'])
@token_required
def obtener_campanas(usuario_actual):
    # Buscamos campañas donde soy DM o donde estoy en la lista de jugadores
    query = {
        "$or": [
            {"dm_id": usuario_actual['_id']},
            {"jugadores": usuario_actual['_id']}
        ]
    }
    campanas = mongo.db.campanas.find(query)
    
    resultado = []
    for c in campanas:
        resultado.append({
            "id": str(c['_id']),
            "nombre": c['nombre'],
            "descripcion": c['descripcion'],
            "rol": "DM" if c['dm_id'] == usuario_actual['_id'] else "Jugador",
            "codigo_invitacion": c['codigo_invitacion'] if c['dm_id'] == usuario_actual['_id'] else "Oculto"
        })
    return jsonify({"status": "success", "mis_campanas": resultado})



@app.route('/api/ia/npc-rapido', methods=['POST'])
@token_required
def generar_npc(usuario_actual):
    print("--- 🤖 INICIANDO GENERACIÓN DE NPC (MODO SEGURO) ---")
    datos = request.get_json()
    idea = datos.get('idea', 'Un NPC de taberna')
    
    # 1. Aseguramos que la API KEY esté cargada
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return jsonify({"error": "No se encontró la GOOGLE_API_KEY en el .env"}), 500

    # 2. El Prompt (Lo mantenemos simple para evitar errores)
    prompt = f"Genera un NPC de D&D 5e basado en: {idea}. Responde SOLO con un JSON con campos: nombre, raza, clase, personalidad, gancho."

    # 3. Lista de modelos a probar (en orden de probabilidad de éxito)
    modelos_a_probar = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-flash-latest']
    
    last_error = ""

    from google import genai
    client_ia = genai.Client(api_key=api_key)

    for model_name in modelos_a_probar:
        try:
            print(f"Probando modelo: {model_name}...")
            response = client_ia.models.generate_content(
                model=model_name,
                contents=prompt
            )
            
            # Si llegamos aquí, ¡funcionó!
            texto = response.text.replace('```json', '').replace('```', '').strip()
            print(f"✅ Éxito con el modelo: {model_name}")
            
            return jsonify({
                "status": "success",
                "modelo_usado": model_name,
                "resultado": texto
            })

        except Exception as e:
            last_error = str(e)
            print(f"❌ Falló {model_name}: {last_error[:100]}...")
            
            # Si el error es de CUOTA (429), no seguimos probando modelos, hay que esperar.
            if "429" in last_error or "RESOURCE_EXHAUSTED" in last_error:
                return jsonify({
                    "error": "Límite de la IA alcanzado",
                    "detalle": "Has hecho muchas peticiones muy rápido. Espera 60 segundos y vuelve a intentar."
                }), 429
            
            # Si es otro error, el bucle intentará con el siguiente modelo de la lista
            continue

    # Si terminamos el bucle y ninguno funcionó:
    return jsonify({
        "error": "No se pudo conectar con ningún modelo de IA disponible",
        "detalle": last_error
    }), 500

@app.route('/api/ia/diagnostico', methods=['GET'])
def listar_modelos():
    try:
        api_key = os.getenv('GOOGLE_API_KEY')
        from google import genai
        client = genai.Client(api_key=api_key)
        
        # Le pedimos la lista oficial
        modelos_disponibles = []
        for m in client.models.list():
            # Filtramos solo los que sirven para generar contenido
            if 'generateContent' in m.supported_actions:
                modelos_disponibles.append(m.name)
                
        return jsonify({
            "status": "success",
            "modelos": modelos_disponibles
        })
    except Exception as e:
        return jsonify({"error": str(e)})
    

@app.route('/api/assets', methods=['POST'])
@token_required
def guardar_asset(usuario_actual):
    datos = request.get_json()
    
    # 1. Validamos datos mínimos
    if not datos or not datos.get('tipo') or not datos.get('contenido'):
        return jsonify({"error": "Faltan datos del asset (tipo o contenido)"}), 400
        
    tipo = datos['tipo']
    contenido = datos['contenido']

    # 2. Lógica inteligente para el contenido
    # Si es un NPC y viene como string, intentamos convertirlo a objeto 
    # para que en MongoDB se guarde de forma estructurada.
    if tipo == 'NPC' and isinstance(contenido, str):
        try:
            contenido = json.loads(contenido)
        except:
            pass # Si falla, lo dejamos como string (no pasa nada)

    # 3. Creamos el documento para MongoDB
    nuevo_asset = {
        "usuario_id": usuario_actual['_id'], # Usamos el ObjectId del usuario logueado
        "tipo": tipo,
        "prompt_original": contenido,
        "estado_aprobacion": 'Aprobado',
        "fecha_creacion": datetime.now() # Siempre es bueno tener la fecha en Mongo
    }
    
    try:
        # 4. Insertamos en la colección 'assets'
        resultado = mongo.db.assets.insert_one(nuevo_asset)
        
        return jsonify({
            "status": "success", 
            "mensaje": "Asset guardado exitosamente en tus crónicas",
            "asset_id": str(resultado.inserted_id) # Convertimos el ID de Mongo a string
        }), 201
        
    except Exception as e:
        # En MongoDB no hace falta "rollback", simplemente capturamos el error
        print(f"Error al guardar asset: {e}")
        return jsonify({"error": "Error al guardar en la base de datos", "detalle": str(e)}), 500


@app.route('/api/assets', methods=['GET'])
@token_required
def obtener_assets(usuario_actual):
    try:
        # 1. En MongoDB buscamos en la colección 'assets' usando el _id del usuario
        # Recordatorio: usuario_actual ahora es un diccionario
        cursor_assets = mongo.db.assets.find({"usuario_id": usuario_actual['_id']})
        
        # Define tu IP actual o usa una variable de entorno
        BASE_URL = "http://201.188.5.134:5000" 
        
        lista_assets = []
        
        for a in cursor_assets:
            info_npc = None
            tipo = a.get('tipo')
            prompt_orig = a.get('prompt_original', '')
            file_path = a.get('file_path')

            # 2. Lógica para NPCs (JSON)
            if tipo == 'NPC' and prompt_orig:
                # En MongoDB podrías haber guardado el JSON como string o como objeto
                if isinstance(prompt_orig, str):
                    try:
                        info_npc = json.loads(prompt_orig)
                    except:
                        info_npc = {"nombre": "Error", "personalidad": "Formato inválido"}
                else:
                    # Si ya es un diccionario (objeto nativo de Mongo), lo usamos directo
                    info_npc = prompt_orig

            # 3. Construcción de la URL de imagen (si tiene path)
            url_imagen = None
            if file_path:
                path_limpio = file_path.strip('/')
                if not path_limpio.startswith('foundry_assets'):
                    url_imagen = f"{BASE_URL}/foundry_assets/{path_limpio}"
                else:
                    url_imagen = f"{BASE_URL}/{path_limpio}"

            # 4. Formatear el nombre para mostrar
            # Si hay info_npc usamos su nombre, si no, el prompt original o el nombre del archivo
            nombre_display = "Sin nombre"
            if info_npc and isinstance(info_npc, dict):
                nombre_display = info_npc.get('nombre', 'NPC Desconocido')
            elif prompt_orig:
                nombre_display = prompt_orig
            elif file_path:
                nombre_display = file_path.split('/')[-1]

            # 5. Agregar a la lista convirtiendo el ID a string
            lista_assets.append({
                "id": str(a['_id']),  # <--- IMPORTANTE: Convertir ObjectId a string para JSON
                "tipo": tipo,
                "nombre": nombre_display,
                "url": url_imagen,
                "detalles": info_npc  
            })
            
        return jsonify({
            "status": "success", 
            "assets": lista_assets
        }), 200
        
    except Exception as e:
        print(f"Error al obtener assets: {e}")
        return jsonify({"error": "Error al leer la galería", "detalle": str(e)}), 500


@app.route('/api/assets/<asset_id>', methods=['DELETE']) # Quitamos el <int:> porque en Mongo es un string
@token_required
def eliminar_asset(usuario_actual, asset_id):
    try:
        # 1. Buscamos el asset en MongoDB convirtiendo el string a un ObjectId real
        asset = mongo.db.assets.find_one({"_id": ObjectId(asset_id)})
        
        # 2. Verificamos si existe
        if not asset:
            return jsonify({"error": "El registro no existe en las crónicas"}), 404
            
        # 3. SEGURIDAD: Verificamos que el asset pertenezca al usuario logueado
        # Comparamos el ID del dueño con el ID del usuario actual (ambos son ObjectIds)
        if asset['usuario_id'] != usuario_actual['_id']:
            return jsonify({"error": "No tienes permiso para borrar este tesoro"}), 403
            
        # 4. BORRADO FÍSICO (Opcional pero recomendado en tu LLD)
        # Si el asset tiene un archivo en el disco, lo eliminamos
        if asset.get('file_path'):
            # Construimos la ruta absoluta usando la variable que definimos antes
            ruta_fisica = os.path.join(FOUNDRY_DATA_PATH, asset['file_path'])
            if os.path.exists(ruta_fisica):
                os.remove(ruta_fisica)
                print(f"✅ Archivo eliminado del disco: {ruta_fisica}")

        # 5. BORRADO EN BASE DE DATOS
        mongo.db.assets.delete_one({"_id": ObjectId(asset_id)})
        
        return jsonify({
            "status": "success",
            "mensaje": "Asset purgado permanentemente de la base de datos y el disco"
        }), 200
        
    except Exception as e:
        print(f"❌ Error al eliminar: {e}")
        return jsonify({"error": "Error al procesar la eliminación", "detalle": str(e)}), 500

@app.route('/api/ia/generar-imagen', methods=['POST'])
@token_required
def generar_imagen_preview(usuario_actual):
    datos = request.get_json()
    npc_info = datos.get('prompt', 'A fantasy character')
    
    print(f"--- 🎨 GENERANDO RETRATO (MONGO VERSION) ---")
    
    try:
        # 1. Gemini genera el prompt artístico (Usando el cliente ya configurado)
        # Usamos gemini-1.5-flash que es el que nos funcionó por cuota
        prompt_request = f"""
        You are a professional Concept Artist. 
        Convert this description into a high-end fantasy prompt for FLUX: "{npc_info}".
        Describe lighting, textures, and cinematic composition.
        Output ONLY the resulting English prompt.
        """
        
        # 'client' es el que definimos arriba en app.py con google.genai
        res_prompt = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=prompt_request
        )
        art_prompt = res_prompt.text.strip()

        # 2. Configuración Hugging Face
        API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}
        
        image_base64 = None
        
        # Intentos por si el modelo está despertando
        for intento in range(3):
            response = requests.post(API_URL, headers=headers, json={"inputs": art_prompt}, timeout=60)
            
            if response.status_code == 200:
                image_base64 = base64.b64encode(response.content).decode('utf-8')
                print("✅ Imagen generada con éxito")
                break
            elif response.status_code in [503, 429]:
                print(f"Modelo ocupado (Error {response.status_code}), reintentando {intento+1}...")
                time.sleep(8)
            else:
                print(f"❌ Error HF ({response.status_code}): {response.text}")
                break

        if not image_base64:
            return jsonify({"error": "No se pudo obtener la imagen de Hugging Face"}), 504

        # 3. OPCIONAL: Guardar un log de la generación en MongoDB
        # Esto es útil para saber cuántas imágenes genera cada usuario
        log_generacion = {
            "usuario_id": usuario_actual['_id'],
            "prompt_original": npc_info,
            "art_prompt": art_prompt,
            "fecha": datetime.now(timezone.utc),
            "tipo_ia": "FLUX.1-schnell"
        }
        mongo.db.logs_generacion.insert_one(log_generacion)

        return jsonify({
            "status": "success",
            "image_b64": image_base64,
            "art_prompt": art_prompt # Lo devolvemos por si quieres mostrarlo en el front
        }), 200

    except Exception as e:
        print(f"❌ ERROR IA: {str(e)}")
        return jsonify({"error": "Fallo en el proceso artístico", "detalle": str(e)}), 500
@app.route('/api/assets/guardar-imagen', methods=['POST'])
@token_required
def confirmar_guardado_imagen(usuario_actual):
    datos = request.get_json()
    image_b64 = datos.get('image_b64')
    
    # Sanitizamos los nombres para evitar problemas de rutas
    nombre_npc = datos.get('nombre_npc', 'personaje').replace(" ", "_")
    campana_nombre = datos.get('campana_nombre', 'galeria_personal').replace(" ", "_")
    username = usuario_actual['username']

    if not image_b64:
        return jsonify({"error": "Falta la imagen en formato base64"}), 400

    try:
        # 1. Preparar la ruta de carpetas física
        # Estructura: /foundry_assets/NombreCampana/Username/
        ruta_carpeta = os.path.join(FOUNDRY_DATA_PATH, campana_nombre, username)
        
        if not os.path.exists(ruta_carpeta):
            os.makedirs(ruta_carpeta)

        # 2. Convertir Base64 de vuelta a archivo físico (.png)
        timestamp = int(datetime.now().timestamp())
        nombre_archivo = f"{nombre_npc}_{timestamp}.png"
        ruta_completa = os.path.join(ruta_carpeta, nombre_archivo)
        
        # El path relativo es el que guardamos en la DB para construir la URL después
        # Resultado: "NombreCampana/Username/nombre_archivo.png"
        ruta_relativa = f"{campana_nombre}/{username}/{nombre_archivo}"
        
        # Procesar base64 (quitamos el encabezado si viene del frontend como "data:image/png;base64,")
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]
            
        img_data = base64.b64decode(image_b64)
        
        with open(ruta_completa, 'wb') as f:
            f.write(img_data)
        
        # 3. Registrar en MongoDB
        nuevo_asset = {
            "usuario_id": usuario_actual['_id'], # Usamos el ObjectId de Mongo
            "tipo": 'Retrato',
            "file_path": ruta_relativa,
            "prompt_original": datos.get('prompt_usado', ''),
            "estado_aprobacion": 'Aprobado',
            "fecha_creacion": datetime.now() # Opcional: útil en MongoDB
        }
        
        # Insertamos en la colección 'assets'
        mongo.db.assets.insert_one(nuevo_asset)

        return jsonify({
            "status": "success",
            "mensaje": f"Imagen guardada exitosamente en la carpeta de {campana_nombre}",
            "file_path": ruta_relativa
        }), 201

    except Exception as e:
        print(f"Error al guardar imagen: {e}")
        return jsonify({"error": "Error al procesar el archivo", "detalle": str(e)}), 500
    
@app.route('/foundry_assets/<path:filename>')
def servir_assets_foundry(filename):
    # filename recibirá algo como "Campaña_1/Arturo/imagen.png"
    # y lo buscará dentro de tu FOUNDRY_DATA_PATH
    return send_from_directory(FOUNDRY_DATA_PATH, filename)



@app.route('/api/campanas/unirse', methods=['POST'])
@token_required
def unirse_campana(usuario_actual):
    datos = request.get_json()
    codigo = datos.get('codigo')

    if not codigo:
        return jsonify({"error": "Falta el código de invitación"}), 400

    # 1. Buscamos la campaña en MongoDB por su código
    campana = mongo.db.campanas.find_one({"codigo_invitacion": codigo.upper()})

    if not campana:
        return jsonify({"error": "Código inválido o campaña inexistente"}), 404

    # 2. Verificamos si el usuario ya está dentro (para no duplicarlo)
    # Comparamos el ID del usuario actual con los IDs en la lista 'jugadores'
    if usuario_actual['_id'] in campana.get('jugadores', []):
        return jsonify({"error": "Ya eres parte de esta gesta"}), 400
        
    # 3. Verificamos que el DM no intente unirse a su propia campaña como jugador
    if campana['dm_id'] == usuario_actual['_id']:
        return jsonify({"error": "Eres el DM de esta campaña, no puedes unirte como jugador"}), 400

    # 4. ¡LA MAGIA DE MONGO! 
    # Usamos '$push' para agregar el ID del usuario al array de jugadores
    try:
        mongo.db.campanas.update_one(
            {"_id": campana['_id']},
            {"$push": {"jugadores": usuario_actual['_id']}}
        )
        return jsonify({
            "status": "success",
            "mensaje": f"Te has unido a {campana['nombre']} con éxito."
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0', port=5000)