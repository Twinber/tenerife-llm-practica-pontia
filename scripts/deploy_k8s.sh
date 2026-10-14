#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Automatizado en Kubernetes (k3s)
# Twinber en Busca del Secreto Guanche // Aventura Gráfica de Tenerife
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

NAMESPACE="tenerife-game"
IMAGE_NAME="tenerife-game:latest"

echo "🌴 ===================================================================="
echo "   DESPLIEGUE EN KUBERNETES // TWINBER EN BUSCA DEL SECRETO GUANCHE"
echo "======================================================================="

cd "${PROJECT_ROOT}"

# 1. Verificar existencia del archivo .env local
if [ ! -f ".env" ]; then
    echo "❌ Error: No se encontró el archivo .env en la raíz del proyecto."
    echo "   Copia .env.example a .env y define tu OPENAI_API_KEY antes de desplegar."
    exit 1
fi

# 2. Leer credenciales y destino SSH desde .env local de forma segura
echo "🔑 [1/7] Leyendo configuración y credenciales desde .env local..."
OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' | tr -d ' ' || true)
K8S_SSH_TARGET=$(grep -E '^K8S_SSH_TARGET=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' | tr -d ' ' || true)
K8S_DOMAIN=$(grep -E '^K8S_DOMAIN=' .env | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r' | tr -d ' ' || true)

if [ -z "${OPENAI_KEY}" ] || [ "${OPENAI_KEY}" == "sk-proj-tu-clave-activa-aqui" ]; then
    echo "❌ Error: OPENAI_API_KEY en .env está vacía o tiene el valor de ejemplo."
    exit 1
fi

if [ -z "${K8S_SSH_TARGET}" ]; then
    echo "❌ Error: Variable K8S_SSH_TARGET no definida en .env."
    echo "   Añade 'K8S_SSH_TARGET=usuario@tu-servidor' a tu .env local antes de desplegar."
    exit 1
fi

if [ -z "${K8S_DOMAIN}" ]; then
    K8S_DOMAIN="tenerife.example.com"
fi

echo "      ✓ Destino SSH: ${K8S_SSH_TARGET}"
echo "      ✓ Dominio Ingress: ${K8S_DOMAIN}"
echo "      ✓ Credencial de OpenAI detectada (longitud: ${#OPENAI_KEY} caracteres)."

# 3. Compilación de la imagen Docker local (aprovecha la caché de Docker en segundos)
echo "🐳 [2/7] Compilando imagen Docker local (${IMAGE_NAME})..."
docker build -t "${IMAGE_NAME}" .
echo "      ✓ Imagen compilada con éxito."

# 4. Inyección directa de la imagen en containerd del clúster k3s
echo "🚀 [3/7] Transfiriendo e importando imagen a k3s containerd..."
docker save "${IMAGE_NAME}" | gzip | ssh "${K8S_SSH_TARGET}" "k3s ctr images import -"
echo "      ✓ Imagen importada en el clúster k3s."

# 5. Aplicar Namespace y ConfigMap
echo "📦 [4/7] Aplicando Namespace y ConfigMap..."
ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/01-namespace.yaml"
ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/02-configmap.yaml"

# 6. Inyección del Secret en Kubernetes (Directo a memoria vía pipe, sin tocar el repositorio)
echo "🔒 [5/7] Inyectando Secret tenerife-secrets de forma hermética..."
ssh "${K8S_SSH_TARGET}" "kubectl create secret generic tenerife-secrets \
    --from-literal=OPENAI_API_KEY='${OPENAI_KEY}' \
    -n '${NAMESPACE}' --dry-run=client -o yaml | kubectl apply -f -"
echo "      ✓ Secret inyectado en namespace '${NAMESPACE}' sin persistir credenciales en archivos."

# 7. Gestión automatizada de Certificado TLS (Let's Encrypt HTTP-01 Desatendido)
echo "📜 [6/7] Verificando certificado TLS para ${K8S_DOMAIN}..."
TLS_EXISTS=$(ssh "${K8S_SSH_TARGET}" "kubectl get secret tenerife-tls -n '${NAMESPACE}' --no-headers 2>/dev/null || true")

if [ -z "${TLS_EXISTS}" ]; then
    echo "      ℹ️ Secret tenerife-tls no encontrado. Activando reto HTTP-01 desatendido..."
    ssh "${K8S_SSH_TARGET}" "mkdir -p /tmp/acme-challenge/.well-known/acme-challenge"
    ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/03-deployment.yaml"
    ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/04-service.yaml"
    
    # Ingress temporal para responder al reto de Let's Encrypt
    cat <<EOF | ssh "${K8S_SSH_TARGET}" "kubectl apply -f -"
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: tenerife-acme-http
  namespace: ${NAMESPACE}
  annotations:
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  ingressClassName: traefik
  rules:
    - host: ${K8S_DOMAIN}
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: tenerife-game-svc
                port:
                  number: 8080
EOF

    echo "      ⏳ Esperando a que el pod esté activo para responder al reto ACME..."
    ssh "${K8S_SSH_TARGET}" "kubectl rollout status deployment/tenerife-game -n '${NAMESPACE}' --timeout=60s"

    echo "      🔐 Solicitando certificado oficial a Let's Encrypt..."
    ssh "${K8S_SSH_TARGET}" "certbot certonly --webroot -w /tmp/acme-challenge -d '${K8S_DOMAIN}' --non-interactive --agree-tos --register-unsafely-without-email --force-renewal"

    echo "      🔑 Creando Secret tenerife-tls en Kubernetes..."
    ssh "${K8S_SSH_TARGET}" "kubectl create secret tls tenerife-tls \
        --cert=/etc/letsencrypt/live/${K8S_DOMAIN}/fullchain.pem \
        --key=/etc/letsencrypt/live/${K8S_DOMAIN}/privkey.pem \
        -n '${NAMESPACE}'"
    
    ssh "${K8S_SSH_TARGET}" "kubectl delete ingress tenerife-acme-http -n '${NAMESPACE}' --ignore-not-found"
    echo "      ✓ Certificado Let's Encrypt emitido e instalado con éxito."
else
    echo "      ✓ Secret tenerife-tls ya existente en el clúster."
fi

# 8. Aplicar Deployment, Service e Ingress Final con HTTPS y Redirección 308
echo "🌐 [7/7] Aplicando Ingress de producción HTTPS y redirección permanente..."
ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/03-deployment.yaml"
ssh "${K8S_SSH_TARGET}" "kubectl apply -f -" < "${PROJECT_ROOT}/k8s/04-service.yaml"
sed "s/tenerife\.example\.com/${K8S_DOMAIN}/g" "${PROJECT_ROOT}/k8s/05-ingress.yaml" | ssh "${K8S_SSH_TARGET}" "kubectl apply -f -"

# Reinicio rodante y verificación
echo ""
echo "🔄 Forzando reinicio rodante del pod con la nueva imagen..."
ssh "${K8S_SSH_TARGET}" "kubectl rollout restart deployment/tenerife-game -n '${NAMESPACE}'"

echo "⏳ Verificando estado final del despliegue rodante..."
ssh "${K8S_SSH_TARGET}" "kubectl rollout status deployment/tenerife-game -n '${NAMESPACE}' --timeout=60s"

echo ""
echo "✅ ===================================================================="
echo "   ¡DESPLIEGUE COMPLETADO CON ÉXITO!"
echo "======================================================================="
echo "   Namespace: ${NAMESPACE}"
echo "   Pod activo:"
ssh "${K8S_SSH_TARGET}" "kubectl get pods -n '${NAMESPACE}' -l app=tenerife-game -o wide"
echo "======================================================================="
echo "   URL: https://${K8S_DOMAIN}"
echo "======================================================================="
