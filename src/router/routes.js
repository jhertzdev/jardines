
const routes = [
  {
    path: '/',
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
      { path: 'usuarios',
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
        meta: { viewName: 'Parcelas', viewIcon: 'yard' }
      },
      {
        path: 'parcelas/:id',
        component: () => import('src/pages/Parcelas/ParcelaIndividualPage.vue'),
        meta: { viewName: 'Parcelas', viewIcon: 'yard' }
      },
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

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
