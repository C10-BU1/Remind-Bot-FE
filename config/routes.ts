

export default [
  {
    path: '/user',
    layout: false,
    routes: [
      {
        path: '/user',
        routes: [
          {
            name: 'login',
            path: '/user/login',
            component: './user/Login',
          },
        ],
      },
      {
        component: './404',
      },
    ],
  },
  {
    path: '/my-space',
    name: 'Spaces',
    icon: 'dashboard',
    routes: [
      {
        path: '/dashboard',
        redirect: '/my-space',
      },
      // {
      //   name: 'Tất cả spaces',
      //   icon: 'smile',
      //   path: '/all-spaces',
      //   component: './space/spaces',
      // },
      {
        name: 'Space của tôi',
        icon: 'smile',
        path: '/my-space',
        component: './space/my-space',
      },
    ],
  },
  {
    path: '/space/:spaceId/detail',
    component: './space/space-detail'
  },
  {
    path: '/',
    redirect: '/my-space',
  },
  {
    path:'/404',
    component: './404',
  },
];
