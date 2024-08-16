
const routes = [
  {
    path: '/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Auth/LoginPage.vue') },
    ]
  },
  {
    path: '/app',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('src/pages/Dashboard/DashboardPage.vue'),
        meta: { viewName: 'Dashboard', viewIcon: 'dashboard' }
      },
      {
        path: 'configuracion',
        component: () => import('src/pages/Configuracion/ConfiguracionPage.vue'),
        meta: { viewName: 'Configuración', viewIcon: 'settings' }
      },
      {
        path: 'auditoria',
        component: () => import('src/pages/Auditoria/AuditoriaPage.vue'),
        meta: { viewName: 'Auditoría', viewIcon: 'manage_history' }
      },
      {
        path: 'cremaciones',
        component: () => import('src/pages/Cremaciones/CremacionesPage.vue'),
        meta: { viewName: 'Cremaciones', viewIcon: 'local_hospital' }
      },
      {
        path: 'usuarios',
        component: () => import('src/pages/Usuarios/UsuariosPage.vue'),
        meta: { viewName: 'Usuarios', viewIcon: 'groups' }
      },
      {
        path: 'clientes',
        component: () => import('src/pages/Clientes/ClientesPage.vue'),
        meta: { viewName: 'Clientes', viewIcon: 'people' }
      },
      {
        path: 'clientes/:id',
        component: () => import('src/pages/Clientes/ClienteIndividualPage.vue'),
        meta: { viewName: 'Clientes', viewIcon: 'people' }
      },
      {
        path: 'parcelas',
        component: () => import('src/pages/Parcelas/ParcelasPage.vue'),
        meta: { viewName: 'Parcelas', viewIcon: 'yard', tipoUbicacion: "Parcela" }
      },
      {
        path: 'nichos',
        component: () => import('src/pages/Parcelas/ParcelasPage.vue'),
        meta: { viewName: 'Nichos', viewIcon: 'takeout_dining', tipoUbicacion: "Nicho" }
      },
      {
        path: 'columbarios',
        component: () => import('src/pages/Parcelas/ParcelasPage.vue'),
        meta: { viewName: 'Columbarios', viewIcon: 'inventory', tipoUbicacion: "Columbario"}
      },
      {
        path: 'contratos',
        component: () => import('src/pages/Contratos/ContratosPage.vue'),
        meta: { viewName: 'Contratos', viewIcon: 'description' }
      },
      {
        path: 'ubicaciones/:id',
        component: () => import('src/pages/Parcelas/ParcelaIndividualPage.vue'),
        meta: { viewName: 'Parcelas', viewIcon: 'yard' }
      },
      {
        path: 'ubicaciones/:codigo/mapa',
        component: () => import('src/pages/Parcelas/ParcelasMapaPage.vue'),
        meta: { viewName: 'Mapa', viewIcon: 'yard' }
      }
    ]
  },
  {
    path: '/auth/',
    component: () => import('layouts/AuthLayout.vue'),
    children: [
      { path: 'login', component: () => import('pages/Auth/LoginPage.vue') },
      { path: 'logout', component: () => import('pages/Auth/LogoutPage.vue') },
    ]
  },
  {
    path: '/caja/',
    component: () => import('layouts/CashboxLayout.vue'),
    children: [
      {
        path: '',
        component: () => import('pages/Caja/CajaPage.vue'),
        meta: { viewName: 'Caja', viewIcon: 'point_of_sale'}
      },
      {
        path: 'bancos',
        component: () => import('pages/Caja/BancosPage.vue'),
        meta: { viewName: 'Bancos', viewIcon: 'account_balance' }
      },
      {
        path: 'recibos',
        component: () => import('pages/Caja/RecibosPage.vue'),
        meta: { viewName: 'Recibos', viewIcon: 'receipt' }
      },
      {
        path: 'servicios',
        component: () => import('pages/Caja/ServiciosPage.vue'),
        meta: { viewName: 'Servicios y productos', viewIcon: 'yard' }
      },
      {
        path: 'recibos/nuevo',
        component: () => import('pages/Caja/RecibosNuevoPage.vue'),
        meta: { viewName: 'Nuevo recibo', viewIcon: 'receipt' }
      },
      {
        path: 'contratos',
        component: () => import('pages/Caja/CajaContratosPage.vue'),
        meta: { viewName: 'Contratos', viewIcon: 'description' }
      },
      {
        path: 'metodos',
        component: () => import('pages/Caja/MetodosPagoPage.vue'),
        meta: { viewName: 'Métodos de pago', viewIcon: 'account_balance_wallet' }
      },
      {
        path: 'monedas',
        component: () => import('pages/Caja/MonedasPage.vue'),
        meta: { viewName: 'Monedas', viewIcon: 'euro_symbol' }
      },
      {
        path: 'reportes/ingresos',
        component: () => import('pages/Caja/ReporteIngresosPage.vue'),
        meta: { viewName: 'Reporte de ingresos', viewIcon: 'assessment' }
      },
    ]
  },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
