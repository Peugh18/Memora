# Subir Memora a AWS

Todo corre en **una sola EC2** con Docker: la API (FrankenPHP con HTTPS automático), el oyente MQTT, el revisor de tomas y el broker Mosquitto con usuario y clave por pastillero. Costo aproximado: US$ 12 al mes.

## 1. Dominio gratis (DuckDNS)

1. Entra a <https://www.duckdns.org> con Google o GitHub.
2. Crea un subdominio, por ejemplo `memora` → queda `memora.duckdns.org`.
3. Cuando tengas la IP pública de la EC2 (paso 2), pégala en **current ip** y pulsa **update ip**.

## 2. La máquina EC2 (región us-east-2, Ohio)

Si no existe, en la consola de EC2 → **Launch instance**:

| Campo | Valor |
|---|---|
| Nombre | `memora` |
| Imagen | **Ubuntu Server 24.04 LTS**, arquitectura **64-bit (Arm)** |
| Tipo | **t4g.micro** |
| Key pair | **Proceed without a key pair** (entramos con Session Manager) |
| Red → Security group | Crear uno con entrada: **HTTP 80**, **HTTPS 443**, **TCP personalizado 8883**, todos desde `0.0.0.0/0`. **Sin el 22** |
| Almacenamiento | 20 GB gp3 |
| Advanced → IAM instance profile | Un rol con la política **AmazonSSMManagedInstanceCore** (si no existe: IAM → Roles → Create role → EC2 → esa política) |

Si ya existe: revisa que tenga esos 3 puertos abiertos en su security group y el rol de SSM.

## 3. Instalar (Session Manager)

EC2 → selecciona la instancia → **Connect** → pestaña **Session Manager** → **Connect**. En la terminal que se abre:

```bash
curl -fsSL https://raw.githubusercontent.com/Peugh18/Memora/main/despliegue/instalar.sh -o instalar.sh && sudo bash instalar.sh
```

El script pregunta dos cosas (se escriben **ahí**, nunca en el chat ni en GitHub):
- el dominio (`memora.duckdns.org`),
- la clave del QR: las 6 letras después de `MEM-0001-`.

La primera vez tarda unos 10 minutos. Al final debe abrir `https://memora.duckdns.org/up`.

## 4. Apagar de noche y prender al día siguiente (para ahorrar)

En CloudShell (us-east-2). Apagada solo cobra el disco; al prender, AWS le da **otra IP**.

```bash
# Apagar
aws ec2 stop-instances --region us-east-2 --instance-ids i-0ef9b7a94381cc3b8
# Prender y ver la IP nueva
aws ec2 start-instances --region us-east-2 --instance-ids i-0ef9b7a94381cc3b8 && aws ec2 wait instance-running --region us-east-2 --instance-ids i-0ef9b7a94381cc3b8 && aws ec2 describe-instances --region us-east-2 --instance-ids i-0ef9b7a94381cc3b8 --query "Reservations[0].Instances[0].PublicIpAddress" --output text
```

Luego poner esa IP en DuckDNS (`memmora` → update ip). Los contenedores arrancan solos.

## 5. Después

- **Actualizar** tras un cambio en GitHub: volver a correr `sudo bash instalar.sh` (conserva datos y claves).
- **Ver qué pasa**: `cd /opt/memora/despliegue && sudo docker compose logs -f escuchar`
- **Apagar todo al terminar el curso**: terminar la instancia, borrar su disco, liberar la IP y borrar el security group.
