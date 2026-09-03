export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/pomodoro/index',
    'pages/todo/index',
    'pages/workdays/index',
    'pages/verse/index',
    'pages/picker/index',
    'pages/music/index',
    'pages/quiz/index',
  ],
  window: {
    navigationBarTitleText: '薄荷小站',
    navigationBarBackgroundColor: '#1a9464',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f2fbf6',
    backgroundTextStyle: 'light',
    enablePullDownRefresh: false,
  },
  tabBar: {
    color: '#7a9c8a',
    selectedColor: '#1a9464',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png',
      },
      {
        pagePath: 'pages/pomodoro/index',
        text: '番茄钟',
        iconPath: 'assets/tabbar/pomodoro.png',
        selectedIconPath: 'assets/tabbar/pomodoro-active.png',
      },
      {
        pagePath: 'pages/todo/index',
        text: '待办',
        iconPath: 'assets/tabbar/todo.png',
        selectedIconPath: 'assets/tabbar/todo-active.png',
      },
      {
        pagePath: 'pages/verse/index',
        text: '金句',
        iconPath: 'assets/tabbar/verse.png',
        selectedIconPath: 'assets/tabbar/verse-active.png',
      },
      {
        pagePath: 'pages/quiz/index',
        text: '测试',
        iconPath: 'assets/tabbar/quiz.png',
        selectedIconPath: 'assets/tabbar/quiz-active.png',
      },
    ],
  },
  permission: {},
})
