# Sistema Web de Restaurante de Comidas Rápidas FastBite

# Requisitos Funcionales (RQF)

1. Gestión de Usuarios:
Registro de Usuarios: Los clientes podrán registrarse en el sistema ingresando información básica como nombre, correo electrónico y contraseña.
Inicio de Sesión: Los usuarios registrados deberán acceder al sistema mediante correo y contraseña.

2. Administración del Restaurante:
Gestión del Menú: El administrador podrá agregar, actualizar, eliminar o modificar productos del menú.
Control de Usuarios: El administrador podrá activar, desactivar o bloquear cuentas de usuarios.

3. Gestión de Pedidos:
Realizar Pedidos: Los clientes podrán seleccionar productos y agregarlos al carrito de compras.
Seguimiento de Pedidos: Los usuarios podrán visualizar el estado de sus pedidos en tiempo real.
Gestión de Pedidos: El administrador podrá aceptar, preparar, entregar o cancelar pedidos.

4. Gestión de Productos:
Ingreso de Productos: El administrador agregará productos con detalles como nombre, precio, descripción, categoría e imagen.
Búsqueda de Productos: Los usuarios podrán buscar productos por nombre, categoría o precio.

5. Notificaciones y Alertas:
Confirmación de Pedido: El sistema enviará notificaciones al usuario confirmando el pedido realizado.
Estado del Pedido: El sistema notificará cambios en el estado del pedido como “En preparación” o “Entregado”.

6. Seguridad:
Protección de Datos Personales: El sistema garantizará la privacidad de los datos de los usuarios mediante protocolos de seguridad.


# Requisitos No Funcionales (RQNF)

DE PRODUCTO

• Usabilidad (Atributo de Calidad):
El sistema deberá ser fácil de usar para que los usuarios puedan navegar por el menú y realizar pedidos de manera sencilla.

• Confiabilidad (Atributo de Calidad - Fiabilidad):
El sistema deberá funcionar de manera continua y estable evitando interrupciones durante la realización de pedidos.

• Seguridad (Atributo de Calidad):
El sistema implementará mecanismos robustos de protección, incluyendo:
Cifrado de datos.
Autenticación de usuarios.
Control de acceso por roles.
Protección de información personal y pagos.

• Eficiencia:

• De Rendimiento (Atributo de Calidad):
El sistema deberá procesar información rápidamente, con:
Tiempo de respuesta: Máximo 10 segundos.
Tiempo de carga: Máximo 7 segundos.
Procesos simultáneos: Capacidad para soportar al menos 200 usuarios concurrentes.

• De Espacio (Restricción):
El sistema requerirá al menos 15 GB de espacio en disco para almacenar pedidos, usuarios e imágenes de productos.


DE LA ORGANIZACIÓN

• Ambientales (Restricción):
El sistema funcionará únicamente mientras el servidor esté encendido y con conexión estable a internet.

• Operacionales (Atributo de Calidad - Usabilidad):
Será manejado por administradores, empleados y clientes para realizar pedidos y gestionar el restaurante.

• De Desarrollo (Restricción):
El sistema será desarrollado utilizando tecnologías web compatibles y escalables para garantizar buen rendimiento y mantenimiento.


EXTERNOS

• Regulatorios (Restricción):
El sistema cumplirá con las leyes de protección de datos personales establecidas en la Ley 1581 de 2012.

• Éticos (Restricción):
El sistema protegerá la información personal de los usuarios evitando el acceso no autorizado.

• Legales:

• Contables (Restricción):
El sistema garantizará transparencia en el registro de ventas y pedidos realizados.

• De Protección/Seguridad (Restricción):
El sistema garantizará la confidencialidad de los datos personales siguiendo normativas de seguridad digital.