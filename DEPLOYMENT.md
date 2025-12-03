# ============================================
# COMANDOS LOCALES - CONSTRUIR Y SUBIR IMAGEN
# ============================================

# 1. Construir la imagen Docker localmente
docker build -t uplearn-frontend .

# 2. Guardar la imagen como archivo tar
docker save -o uplearn-frontend.tar uplearn-frontend

# 3. Copiar la imagen y archivos necesarios a EC2
#    Reemplaza: YOUR_KEY.pem, YOUR_EC2_IP
scp -i "YOUR_KEY.pem" uplearn-frontend.tar ec2-user@YOUR_EC2_IP:/home/ec2-user/
scp -i "YOUR_KEY.pem" docker-compose.yml ec2-user@YOUR_EC2_IP:/home/ec2-user/uplearn-app/
scp -i "YOUR_KEY.pem" src/.env ec2-user@YOUR_EC2_IP:/home/ec2-user/.env

# 4. Conectarse a la instancia EC2
ssh -i "YOUR_KEY.pem" ec2-user@YOUR_EC2_IP


# ============================================
# COMANDOS EN EC2 - PRIMERA VEZ
# ============================================

# 1. Instalar Docker (si no está instalado)
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user

# 2. Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 3. Cerrar sesión y volver a conectar para aplicar permisos
exit
# Volver a conectar con SSH

# 4. Cargar la imagen Docker
docker load -i uplearn-frontend.tar

# 5. Crear directorio de trabajo y mover archivos
mkdir -p ~/uplearn-app
mv docker-compose.yml ~/uplearn-app/
mv .env ~/uplearn-app/

# 6. Ir al directorio y levantar el contenedor
cd ~/uplearn-app
docker-compose up -d

# 7. Verificar que está corriendo
docker ps
docker logs uplearn-frontend

# 8. Configurar Security Group en AWS Console
#    - Permitir tráfico HTTP (puerto 80) desde 0.0.0.0/0
#    - Permitir tráfico HTTPS (puerto 443) si usas SSL
#    - Permitir tráfico en puerto 8080 si accedes directamente al contenedor


# ============================================
# CONFIGURAR NGINX Y HTTPS (OPCIONAL)
# ============================================

# Si quieres usar un dominio con HTTPS (ej: uplearnfront.duckdns.org):

# 1. Instalar Nginx en el host EC2
sudo yum update -y
sudo dnf install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# 2. Crear vhost para tu dominio apuntando al contenedor en 8080
sudo tee /etc/nginx/conf.d/uplearnfront.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name uplearnfront.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 3. Probar y recargar Nginx
sudo nginx -t
sudo systemctl reload nginx

# 4. Instalar Certbot y emitir certificado SSL
sudo dnf install -y python3-certbot-nginx
sudo certbot --nginx -d uplearnfront.duckdns.org --agree-tos -m tuemail@example.com --redirect

# 5. Verificar renovación automática
sudo systemctl list-timers | grep certbot


# ============================================
# COMANDOS PARA ACTUALIZACIONES FUTURAS
# ============================================

# En tu máquina local:
docker build -t uplearn-frontend .
docker save -o uplearn-frontend.tar uplearn-frontend
scp -i "YOUR_KEY.pem" uplearn-frontend.tar ec2-user@YOUR_EC2_IP:/home/ec2-user/

# En EC2:
cd ~/uplearn-app
docker-compose down
docker load -i ~/uplearn-frontend.tar
docker-compose up -d
docker image prune -f


# ============================================
# COMANDOS ÚTILES DE MANTENIMIENTO
# ============================================

# Ver logs en tiempo real
docker logs -f uplearn-frontend

# Reiniciar el contenedor
docker-compose restart

# Detener el contenedor
docker-compose down

# Ver estado de todos los contenedores
docker ps -a

# Entrar al contenedor para debugging
docker exec -it uplearn-frontend sh

# Ver uso de recursos
docker stats uplearn-frontend

# Limpiar imágenes antiguas
docker image prune -a -f

# Ver logs de Nginx (si usas reverse proxy)
sudo journalctl -u nginx -e

# Probar configuración de Nginx
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx


# ============================================
# NOTAS IMPORTANTES
# ============================================

# Puertos y acceso:
# - Por defecto el contenedor expone 80 (Nginx interno). En compose mapeamos 8080:80 para evitar conflictos.
# - Acceso directo: http://<EC2_IP>:8080
# - Con Nginx reverse proxy: http://uplearnfront.duckdns.org o https://uplearnfront.duckdns.org

# Variables de entorno (.env):
# - React usa variables en BUILD TIME, no en runtime.
# - El .env se copia durante la construcción de la imagen Docker.
# - Para cambiar endpoints, debes reconstruir la imagen localmente y volver a desplegar.

# Security Group AWS:
# - Puerto 22 (SSH) para administración
# - Puerto 80 (HTTP) si usas Nginx
# - Puerto 443 (HTTPS) si usas SSL
# - Puerto 8080 si quieres acceso directo al contenedor (opcional)
