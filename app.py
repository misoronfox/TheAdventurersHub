import os
from dotenv import load_dotenv
import uuid 
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
from functools import wraps
from flask_cors import CORS 
import base64
import json
import requests

import time




app = Flask(__name__)
CORS(app)
load_dotenv()


# ==========================================
# ARREGLO 1: LA RUTA ABSOLUTA
# ==========================================
# Esto obtiene la ruta exacta de la carpeta donde está guardado este archivo app.py
basedir = os.path.abspath(os.path.dirname(__file__))
BASE_URL = "http://201.188.5.134:5000" 
# Así forzamos a Flask a buscar db.db EXACTAMENTE en esa misma carpeta, sin excusas.
ruta_db = os.path.join(basedir, 'db.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + ruta_db
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY')

FOUNDRY_DATA_PATH = "/home/arturo/foundrydata/Data/imports"

db = SQLAlchemy(app)

if not os.path.exists(FOUNDRY_DATA_PATH):
    os.makedirs(FOUNDRY_DATA_PATH)

# ==========================================
# ARREGLO 2: COLUMNAS EXACTAS
# ==========================================
class Usuario(db.Model):
    __tablename__ = 'Usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50))
    
    # El primer texto entre comillas es el nombre EXACTO de tu columna en DB Browser
    password_hash = db.Column('passwordHash', db.String(255))   
    fecha_registro = db.Column('fechaRegistro', db.String(50))
    assets = db.relationship('Asset', backref='creador', lazy=True)
    campanas_unidas = db.relationship('UsuarioCampana', backref='usuario', lazy=True)

class Campana(db.Model):
    __tablename__ = 'Campanas' # Revisa si le pusiste 'Campanas' o 'Campañas'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    descripcion = db.Column(db.Text)
    codigo_invitacion = db.Column('codigoInvitacion', db.String(20), unique=True)

    # Relaciones
    assets_campana = db.relationship('Asset', backref='campana', lazy=True)
    usuarios_unidos = db.relationship('UsuarioCampana', backref='campana', lazy=True)


# Tabla Intermedia (Asociación) para Muchos a Muchos
class UsuarioCampana(db.Model):
    __tablename__ = 'Usuarios_Campanas' 
    
    id = db.Column(db.Integer, primary_key=True)
    # Claves foráneas (Foreign Keys) que apuntan a las tablas principales
    usuario_id = db.Column('usuarioId', db.Integer, db.ForeignKey('Usuarios.id'))
    campana_id = db.Column('campanaId', db.Integer, db.ForeignKey('Campanas.id'))
    rol = db.Column('rolEnCampana', db.String(20)) # Aquí guardaremos 'DM' o 'Jugador'


class Asset(db.Model):
    __tablename__ = 'Assets'
    
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column('usuarioId', db.Integer, db.ForeignKey('Usuarios.id'))
    # campanaId puede estar vacío (nulo) si la imagen solo está en la galería personal
    campana_id = db.Column('campanaId', db.Integer, db.ForeignKey('Campanas.id'), nullable=True) 
    
    tipo = db.Column(db.String(50)) # 'Retrato', 'Mapa', 'Texto', 'Local_Upload'
    file_path = db.Column('filePath', db.String(255))
    prompt_original = db.Column('promptOriginal', db.Text)
    estado_aprobacion = db.Column('estadoAprobacion', db.String(20)) # 'Pendiente', 'Aprobado', 'Rechazado' 


# ==========================================
# GUARDIA DE SEGURIDAD (Decorador JWT)
# ==========================================
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # 1. Buscamos el token en las cabeceras de la petición
        if 'Authorization' in request.headers:
            # El formato estándar es "Bearer <token>", así que lo separamos
            auth_header = request.headers['Authorization']
            if len(auth_header.split(" ")) == 2:
                token = auth_header.split(" ")[1]
        
        # 2. Si no hay token, lo rebotamos
        if not token:
            return jsonify({"error": "Falta el token de autenticación. ¡Acceso denegado!"}), 401
        
        # 3. Intentamos decodificar el token para ver si es válido y no ha expirado
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # Buscamos al usuario en la base de datos usando el ID que venía dentro del token
            usuario_actual = Usuario.query.get(data['usuario_id'])
            
            if not usuario_actual:
                return jsonify({"error": "El usuario del token ya no existe"}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "El token ha expirado. Por favor, inicia sesión nuevamente"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Token inválido"}), 401
            
        # 4. Si todo está bien, lo dejamos pasar y le entregamos el usuario a la ruta
        return f(usuario_actual, *args, **kwargs)
        
    return decorated

@app.route('/api/test-db')
def test_db():
    try:
        usuarios_db = Usuario.query.all()
        lista_usuarios = []
        for u in usuarios_db:
            lista_usuarios.append({
                "id": u.id,
                "username": u.username
            })
            
        return jsonify({
            "status": "success",
            "mensaje": "¡Conexión exitosa a db.db!",
            "cantidad_usuarios": len(lista_usuarios),
            "usuarios": lista_usuarios,
            "ruta_leida": ruta_db  # Te muestro la ruta exacta para confirmar
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "mensaje": str(e)
        }), 500


@app.route('/api/registro', methods=['POST'])
def registro():
    # 1. Obtenemos los datos que nos envía el frontend (React o Insomnia/Postman)
    datos = request.get_json()
    
    # 2. Validamos que nos hayan enviado usuario y contraseña
    if not datos or not datos.get('username') or not datos.get('password'):
        return jsonify({"error": "Faltan datos. Se requiere username y password"}), 400

    username = datos['username']
    password_texto_plano = datos['password']

    # 3. Verificamos si el usuario ya existe en la base de datos
    usuario_existente = Usuario.query.filter_by(username=username).first()
    if usuario_existente:
        return jsonify({"error": "El nombre de usuario ya está en uso"}), 409

    # 4. Encriptamos la contraseña (¡NUNCA guardar en texto plano!)
    password_encriptada = generate_password_hash(password_texto_plano)
    
    # Obtenemos la fecha actual en formato texto
    fecha_actual = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    # 5. Creamos el nuevo usuario en Python
    nuevo_usuario = Usuario(
        username=username, 
        password_hash=password_encriptada,
        fecha_registro=fecha_actual
    )

    # 6. Lo guardamos en la base de datos real
    try:
        db.session.add(nuevo_usuario)
        db.session.commit() # Esto es como presionar "Guardar"
        return jsonify({
            "status": "success",
            "mensaje": f"Usuario '{username}' creado exitosamente."
        }), 201
    except Exception as e:
        db.session.rollback() # Si algo falla, deshacemos el cambio
        return jsonify({"error": "Error al guardar en la base de datos", "detalle": str(e)}), 500
    

@app.route('/api/login', methods=['POST'])
def login():
    datos = request.get_json()
    
    # 1. Validar que nos enviaron los datos
    if not datos or not datos.get('username') or not datos.get('password'):
        return jsonify({"error": "Faltan datos. Se requiere username y password"}), 400
        
    # 2. Buscar al usuario en la base de datos
    usuario = Usuario.query.filter_by(username=datos['username']).first()
    
    # 3. Verificar si el usuario existe y si la contraseña coincide con el hash
    if not usuario or not check_password_hash(usuario.password_hash, datos['password']):
        return jsonify({"error": "Usuario o contraseña incorrectos"}), 401
        
    # 4. Crear el Token JWT (La pulsera VIP)
    # Le ponemos el ID del usuario y decimos que expira en 24 horas
    token_payload = {
        'usuario_id': usuario.id,
        'exp': datetime.now(timezone.utc) + timedelta(hours=24)
    }
    
    token = jwt.encode(token_payload, app.config['SECRET_KEY'], algorithm='HS256')
    
    # 5. Devolver el token al frontend
    return jsonify({
        "status": "success",
        "mensaje": f"¡Bienvenido de vuelta, {usuario.username}!",
        "token": token
    }), 200

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
    
    # 1. Validar datos mínimos
    if not datos or not datos.get('nombre'):
        return jsonify({"error": "La campaña necesita un nombre"}), 400
        
    nombre = datos['nombre']
    descripcion = datos.get('descripcion', "") # Si no envían descripción, ponemos texto vacío
    
    # 2. Generar código de invitación único (6 caracteres en mayúscula)
    # uuid4 genera algo como "a8098c1a-28...", tomamos los primeros 6 y los ponemos en mayúscula
    codigo_unico = str(uuid.uuid4())[:6].upper()
    
    # 3. Crear el objeto Campaña
    nueva_campana = Campana(
        nombre=nombre,
        descripcion=descripcion,
        codigo_invitacion=codigo_unico
    )
    
    try:
        # Guardamos la campaña primero para que la base de datos le asigne un ID
        db.session.add(nueva_campana)
        db.session.flush() # 'flush' envía los datos pero no cierra la transacción todavía
        
        # 4. ¡EL PASO CLAVE! Asignar al creador como DM en la tabla intermedia
        relacion_dm = UsuarioCampana(
            usuario_id=usuario_actual.id,
            campana_id=nueva_campana.id, # Aquí usamos el ID que se acaba de generar
            rol='DM'
        )
        
        db.session.add(relacion_dm)
        
        # Ahora sí, confirmamos todos los cambios (Campaña + Relación)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "mensaje": f"Campaña '{nombre}' creada exitosamente.",
            "datos_campana": {
                "id": nueva_campana.id,
                "nombre": nueva_campana.nombre,
                "codigo_invitacion": nueva_campana.codigo_invitacion,
                "rol_asignado": "DM"
            }
        }), 201
        
    except Exception as e:  
        db.session.rollback()
        return jsonify({"error": "Error al crear la campaña", "detalle": str(e)}), 500
    
@app.route('/api/campanas', methods=['GET'])
@token_required
def obtener_mis_campanas(usuario_actual):
    mis_partidas = []

    # Gracias a SQLAlchemy, 'usuario_actual.campanas_unidas' nos da 
    # la lista de filas de la tabla intermedia automáticamente.
    for union in usuario_actual.campanas_unidas:
        partida = union.campana # Accedemos a los datos de la campaña
        
        mis_partidas.append({
            "id": partida.id,
            "nombre": partida.nombre,
            "descripcion": partida.descripcion,
            "mi_rol": union.rol, # Aquí dirá 'DM' o 'Jugador'
            # Solo mostramos el código de invitación si eres el DM
            "codigo_invitacion": partida.codigo_invitacion if union.rol == 'DM' else "Oculto"
        })
    
    return jsonify({
        "status": "success",
        "cantidad": len(mis_partidas),
        "mis_campanas": mis_partidas
    }), 200

@app.route('/api/ia/npc-rapido', methods=['POST'])
@token_required
def generar_npc_rapido(usuario_actual):
    datos = request.get_json()
    idea_base = datos.get('idea', 'Un personaje de fantasía medieval aleatorio')
    
    api_key = os.getenv('GOOGLE_API_KEY')
    if not api_key:
        return jsonify({"error": "Falta la API Key"}), 500

    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        
        prompt = f"""
        Actúa como un Dungeon Master experto de D&D 5e.
        Genera un NPC creativo basado en esta idea: "{idea_base}".
        Responde ÚNICAMENTE con un JSON válido (sin markdown) con esta estructura:
        {{
            "nombre": "Nombre",
            "raza": "Raza",
            "clase": "Clase",
            "personalidad": "Una frase",
            "gancho": "Un motivo para hablar con él"
        }}
        """
        
        # MODELO ELEGIDO SEGÚN TU LISTA: gemini-flash-lite-latest
        response = client.models.generate_content(
            model='gemini-flash-lite-latest', 
            contents=prompt
        )
        
        texto_limpio = response.text.replace('```json', '').replace('```', '').strip()
        
        return jsonify({
            "status": "success",
            "resultado": texto_limpio
        }), 200
        
    except Exception as e:
        return jsonify({"error": "Fallo en la IA", "detalle": str(e)}), 500
    


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
    
    # Validamos que vengan los datos mínimos
    if not datos or not datos.get('tipo') or not datos.get('contenido'):
        return jsonify({"error": "Faltan datos del asset"}), 400
        
    nuevo_asset = Asset(
        usuario_id=usuario_actual.id,
        tipo=datos['tipo'], # 'Retrato', 'Mapa', 'NPC', etc.
        prompt_original=datos['contenido'], # Guardamos el JSON o el Prompt
        estado_aprobacion='Aprobado' # Los de la galería personal están aprobados por defecto
    )
    
    try:
        db.session.add(nuevo_asset)
        db.session.commit()
        return jsonify({
            "status": "success", 
            "mensaje": "Asset guardado en tu galería",
            "asset_id": nuevo_asset.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al guardar", "detalle": str(e)}), 500


@app.route('/api/assets', methods=['GET'])
@token_required
def obtener_assets(usuario_actual):
    try:
        mis_assets = Asset.query.filter_by(usuario_id=usuario_actual.id).all()
        
        lista_assets = []
        for a in mis_assets:
            info_npc = None
            
            # Si es un NPC, intentamos convertir el string de la DB a un diccionario de Python
            if a.tipo == 'NPC' and a.prompt_original:
                try:
                    # Si ya es un dict por algún motivo, no lo cargamos, si es string, sí
                    if isinstance(a.prompt_original, str):
                        info_npc = json.loads(a.prompt_original)
                    else:
                        info_npc = a.prompt_original
                except:
                    info_npc = {"nombre": "Error", "personalidad": "Datos corruptos"}

            # Construcción de la URL de imagen
            url_imagen = None
            if a.file_path:
                path_limpio = a.file_path.strip('/')
                url_imagen = f"{BASE_URL}/foundry_assets/{path_limpio}" if not path_limpio.startswith('foundry_assets') else f"{BASE_URL}/{path_limpio}"
            
            lista_assets.append({
                "id": a.id,
                "tipo": a.tipo,
                "nombre": a.prompt_original if not info_npc else info_npc.get('nombre'),
                "url": url_imagen,
                "detalles": info_npc  # <--- Esto llegará a React como un objeto listo
            })
            
        return jsonify({"status": "success", "assets": lista_assets}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/assets/<int:asset_id>', methods=['DELETE'])
@token_required
def eliminar_asset(usuario_actual, asset_id):
    # 1. Buscamos el asset en la base de datos
    asset = Asset.query.get(asset_id)
    
    # 2. Verificamos si existe
    if not asset:
        return jsonify({"error": "El registro no existe"}), 404
        
    # 3. SEGURIDAD: Verificamos que el asset pertenezca al usuario logueado
    if asset.usuario_id != usuario_actual.id:
        return jsonify({"error": "No tienes permiso para borrar este tesoro"}), 403
        
    try:
        # 4. Lo eliminamos de la sesión y guardamos cambios
        db.session.delete(asset)
        db.session.commit()
        
        return jsonify({
            "status": "success",
            "mensaje": "Asset eliminado permanentemente del disco y la base de datos"
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar", "detalle": str(e)}), 500


@app.route('/api/ia/generar-imagen', methods=['POST'])
@token_required
def generar_imagen_preview(usuario_actual):
    datos = request.get_json()
    npc_info = datos.get('prompt', 'A fantasy character')
    
    print(f"--- 🎨 GENERANDO RETRATO CON FLUX (NUEVA RUTA HF) ---")
    
    try:
        # 1. Gemini genera el prompt (esto ya sabemos que funciona perfecto)
        from google import genai
        client_gemini = genai.Client(api_key=os.getenv('GOOGLE_API_KEY'))
        
        prompt_request = f"""
        You are a professional Concept Artist for high-end fantasy games like Baldur's Gate 3 and Diablo IV.
        Convert this NPC description into a LEGENDARY-TIER image prompt for the FLUX model: "{npc_info}".
        
        The prompt MUST follow this structure in English:
        1. **Subject:** Ultra-detailed head-and-shoulders portrait of the character. Describe facial features, expression, and unique markings.
        2. **Materials:** Specific textures like scratched plate armor, weathered leather, embroidered silk, or translucent skin.
        3. **Style:** A mix of 'Hyper-realistic digital oil painting' and 'Official D&D sourcebook illustration'. Sharp focus.
        4. **Lighting:** Cinematic lighting, volumetric god-rays, rim lighting to separate the character from the background, and ambient tavern or magical glow.
        5. **Composition:** Close-up shot, shallow depth of field (bokeh background), 8k resolution, masterpiece, trending on ArtStation.
        
        IMPORTANT: Output ONLY the resulting English prompt, no explanations or quotes.
        """
        res_prompt = client_gemini.models.generate_content(
            model='gemini-flash-latest',
            contents=prompt_request
        )
        art_prompt = res_prompt.text.strip()

        # 2. NUEVA URL DEL ROUTER DE HUGGING FACE
        # Hemos cambiado 'api-inference' por 'router'
        API_URL = "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell"
        headers = {"Authorization": f"Bearer {os.getenv('HUGGINGFACE_API_KEY')}"}
        
        print(f"Enviando a Flux via Router: {art_prompt[:50]}...")
        
        # Intentos por si el modelo está "calentando"
        for intento in range(3):
            # Enviamos la petición
            response = requests.post(API_URL, headers=headers, json={"inputs": art_prompt}, timeout=60)
            
            if response.status_code == 200:
                image_base64 = base64.b64encode(response.content).decode('utf-8')
                print("✅ Imagen generada con éxito")
                return jsonify({
                    "status": "success",
                    "image_b64": image_base64
                }), 200
            
            elif response.status_code == 503 or response.status_code == 429:
                # 503: Cargando modelo / 429: Demasiadas peticiones, esperamos
                print(f"Aviso: El modelo está ocupado o cargando (Error {response.status_code})... reintento {intento+1}")
                time.sleep(8) # Esperamos un poco más
            else:
                print(f"❌ Error HF ({response.status_code}): {response.text}")
                break

        return jsonify({"error": "Hugging Face no pudo procesar la imagen tras varios intentos"}), 504

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return jsonify({"error": "Fallo en el proceso artístico", "detalle": str(e)}), 500

@app.route('/api/assets/guardar-imagen', methods=['POST'])
@token_required
def confirmar_guardado_imagen(usuario_actual):
    datos = request.get_json()
    image_b64 = datos.get('image_b64')
    nombre_npc = datos.get('nombre_npc', 'personaje').replace(" ", "_")
    campana_nombre = datos.get('campana_nombre', 'galeria_personal').replace(" ", "_")

    try:
        # 1. Preparar la ruta de carpetas
        # /home/arturo/foundrydata/Data/imports/Campaña/Jugador/
        ruta_carpeta = os.path.join(FOUNDRY_DATA_PATH, campana_nombre, usuario_actual.username)
        if not os.path.exists(ruta_carpeta):
            os.makedirs(ruta_carpeta)

        # 2. Convertir Base64 de vuelta a archivo físico
        nombre_archivo = f"{nombre_npc}_{int(datetime.now().timestamp())}.png"
        ruta_completa = os.path.join(ruta_carpeta, nombre_archivo)
        
        img_data = base64.b64decode(image_b64)
        with open(ruta_completa, 'wb') as f:
            f.write(img_data)
            ruta_relativa = os.path.join(campana_nombre, usuario_actual.username, nombre_archivo)
        
        # 3. Registrar en la Base de Datos
        nuevo_asset = Asset(
            usuario_id=usuario_actual.id,
            tipo='Retrato',
            file_path=ruta_relativa,
            prompt_original=datos.get('prompt_usado', ''),
            estado_aprobacion='Aprobado'
        )
        db.session.add(nuevo_asset)
        db.session.commit()

        return jsonify({
            "status": "success",
            "mensaje": f"Imagen guardada en: imports/{campana_nombre}/{usuario_actual.username}/"
        }), 201
    except Exception as e:
        return jsonify({"error": "Error al guardar archivo", "detalle": str(e)}), 500
    
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
        return jsonify({"error": "Debes proporcionar un código de invitación"}), 400

    # 1. Buscar la campaña por el código (en mayúsculas por si acaso)
    campana = Campana.query.filter_by(codigo_invitacion=codigo.upper()).first()

    if not campana:
        return jsonify({"error": "Código de invitación inválido o campaña no encontrada"}), 404

    # 2. Verificar si el usuario ya es parte de la campaña
    existente = UsuarioCampana.query.filter_by(
        usuario_id=usuario_actual.id, 
        campana_id=campana.id
    ).first()

    if existente:
        return jsonify({"error": "Ya formas parte de esta campaña"}), 400

    # 3. Crear la vinculación como 'Jugador'
    nueva_vinculacion = UsuarioCampana(
        usuario_id=usuario_actual.id,
        campana_id=campana.id,
        rol='Jugador'
    )

    try:
        db.session.add(nueva_vinculacion)
        db.session.commit()
        return jsonify({
            "status": "success",
            "mensaje": f"Te has unido a '{campana.nombre}' como Jugador",
            "campana": {
                "id": campana.id,
                "nombre": campana.nombre,
                "rol": "Jugador"
            }
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al unirse", "detalle": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True,host='0.0.0.0', port=5000)