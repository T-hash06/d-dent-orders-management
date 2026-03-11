
Sistema granular de roles y permisos
-----------------------------------
Cada rol se define como un conjunto de permisos sobre entidades y campos específicos. Los permisos posibles son: ver, crear, editar, eliminar. Para edición, se especifican los campos editables.

### Permisos por entidad
- **Órdenes**: ver, crear, editar, eliminar, asignar
- **Clientes**: ver, crear, editar, eliminar
- **Productos**: ver, crear, editar, eliminar

### Roles

#### Admin
- Órdenes: ver, crear, editar (todos los campos), eliminar, asignar
- Clientes: ver, crear, editar (todos los campos), eliminar
- Productos: ver, crear, editar (todos los campos), eliminar

#### Operario
- Órdenes: ver solo sus órdenes asignadas, editar (estado), no puede crear ni eliminar, puede tener órdenes asignadas
- Clientes: ver solo en contexto de sus órdenes, no puede crear, editar ni eliminar
- Productos: ver solo en contexto de sus órdenes, no puede crear, editar ni eliminar

#### Supervisor
- Órdenes: ver todas, editar (estado, usuario asignado, cantidad) solo en órdenes asignadas, no puede crear ni eliminar, puede tener órdenes asignadas
- Clientes: ver todos, no puede crear, editar ni eliminar
- Productos: ver todos, no puede crear, editar ni eliminar

#### Contabilidad/Facturación
- Órdenes: ver todas, editar (estado de pagado), no puede crear, eliminar ni asignar, no puede tener órdenes asignadas
- Clientes: ver todos, no puede crear, editar ni eliminar
- Productos: ver todos, crear, editar (todos los campos), no puede eliminar

### Ejemplo de definición de permisos

Permisos por rol:

- **Admin**
	- Órdenes:
		- Ver, crear, editar (todos los campos), eliminar, asignar
	- Clientes:
		- Ver, crear, editar (todos los campos), eliminar
	- Productos:
		- Ver, crear, editar (todos los campos), eliminar

- **Operario**
	- Órdenes:
		- Ver solo sus órdenes asignadas
		- Editar: estado
		- Puede tener órdenes asignadas
	- Clientes:
		- Ver solo en contexto de sus órdenes
	- Productos:
		- Ver solo en contexto de sus órdenes

- **Supervisor**
	- Órdenes:
		- Ver todas
		- Editar: estado, usuario asignado, cantidad de cada producto en productos existentes de la orden / nuevos productos (solo en órdenes asignadas)
		- Puede tener órdenes asignadas
	- Clientes:
		- Ver todos
	- Productos:
		- Ver todos

- **Contabilidad/Facturación**
	- Órdenes:
		- Ver todas
		- Editar: estado de pagado
		- No puede tener órdenes asignadas
	- Clientes:
		- Ver todos
	- Productos:
		- Ver todos
		- Crear
		- Editar (todos los campos)
