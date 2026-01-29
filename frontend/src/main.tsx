import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import App from './App'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProposalsPage from './pages/ProposalsPage'
import CalendarPage from './pages/CalendarPage'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <LoginPage /> }
      ,{ path: 'signup', element: <SignupPage /> }
      ,{ path: 'proposals', element: <ProposalsPage /> }
      ,{ path: 'calendar', element: <CalendarPage /> }
    ]
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)


